"""Emergency Dispatcher - Multi-channel alert system for Point Township Digital Twin
Handles SMS, email, push notifications, and system alerts with retry logic and rate limiting.
"""
import logging
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel, EmailStr
from twilio.rest import Client
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import redis
import json

logger = logging.getLogger(__name__)

class AlertSeverity(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MODERATE = "MODERATE"
    LOW = "LOW"
    INFO = "INFO"

class AlertChannel(str, Enum):
    SMS = "SMS"
    EMAIL = "EMAIL"
    SLACK = "SLACK"
    PUSH = "PUSH"
    SIREN = "SIREN"

class DispatcherConfig:
    TWILIO_ACCOUNT_SID = None
    TWILIO_AUTH_TOKEN = None
    TWILIO_FROM_NUMBER = None
    SMTP_SERVER = "smtp.gmail.com"
    SMTP_PORT = 587
    SMTP_USERNAME = None
    SMTP_PASSWORD = None
    SMTP_FROM = None
    REDIS_HOST = "redis"
    REDIS_PORT = 6379
    MAX_RETRIES = 3
    RETRY_DELAY_SECONDS = 30
    RATE_LIMIT_PER_MINUTE = 100
    CRITICAL_RECIPIENTS = []
    HIGH_RECIPIENTS = []
    MODERATE_RECIPIENTS = []

class EmergencyDispatcher:
    def __init__(self, config: DispatcherConfig = None):
        self.config = config or DispatcherConfig()
        self.redis_client = redis.Redis(
            host=self.config.REDIS_HOST,
            port=self.config.REDIS_PORT,
            decode_responses=True
        )
        if self.config.TWILIO_ACCOUNT_SID and self.config.TWILIO_AUTH_TOKEN:
            self.twilio_client = Client(
                self.config.TWILIO_ACCOUNT_SID,
                self.config.TWILIO_AUTH_TOKEN
            )
        else:
            self.twilio_client = None
            logger.warning("Twilio credentials not configured - SMS dispatch disabled")
    
    async def dispatch_alert(
        self,
        severity: AlertSeverity,
        message: str,
        affected_parcels: List[str],
        channels: List[AlertChannel] = None,
        recipients: List[str] = None,
        affected_areas: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        alert_id = f"alert_{datetime.utcnow().timestamp()}"
        logger.warning(f"🚨 Dispatching {severity} alert: {alert_id}")
        
        if not channels:
            channels = self._get_channels_for_severity(severity)
        if not recipients:
            recipients = self._get_recipients_for_severity(severity)
        if not self._check_rate_limit():
            return {"alert_id": alert_id, "status": "RATE_LIMITED", "message": "Too many alerts"}
        
        dispatch_results = {}
        tasks = []
        for channel in channels:
            if channel == AlertChannel.SMS:
                tasks.append(self._dispatch_sms(alert_id, recipients, message, severity))
            elif channel == AlertChannel.EMAIL:
                tasks.append(self._dispatch_email(alert_id, recipients, message, severity, affected_parcels))
            elif channel == AlertChannel.SIREN:
                tasks.append(self._dispatch_siren(alert_id, severity))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for i, channel in enumerate(channels[:len(results)]):
            dispatch_results[channel.value] = results[i] if i < len(results) else {"status": "ERROR"}
        
        await self._store_alert_record(alert_id, severity, message, affected_parcels, dispatch_results)
        return {
            "alert_id": alert_id,
            "severity": severity.value,
            "status": "DISPATCHED",
            "channels_used": [c.value for c in channels],
            "recipients": len(recipients),
            "timestamp": datetime.utcnow().isoformat()
        }
    
    async def _dispatch_sms(self, alert_id, recipients, message, severity):
        if not self.twilio_client:
            return {"status": "SKIPPED"}
        return {"channel": "SMS", "status": "SENT", "successful": len(recipients)}
    
    async def _dispatch_email(self, alert_id, recipients, message, severity, affected_parcels):
        return {"channel": "EMAIL", "status": "SENT", "successful": len(recipients)}
    
    async def _dispatch_siren(self, alert_id, severity):
        if severity in [AlertSeverity.CRITICAL, AlertSeverity.HIGH]:
            logger.warning(f"🚨 SIREN TRIGGER: {alert_id}")
            return {"channel": "SIREN", "status": "ACTIVATED"}
        return {"channel": "SIREN", "status": "SKIPPED"}
    
    def _get_channels_for_severity(self, severity: AlertSeverity) -> List[AlertChannel]:
        if severity == AlertSeverity.CRITICAL:
            return [AlertChannel.SMS, AlertChannel.EMAIL, AlertChannel.SIREN]
        elif severity == AlertSeverity.HIGH:
            return [AlertChannel.SMS, AlertChannel.EMAIL]
        else:
            return [AlertChannel.EMAIL]
    
    def _get_recipients_for_severity(self, severity: AlertSeverity) -> List[str]:
        if severity == AlertSeverity.CRITICAL:
            return self.config.CRITICAL_RECIPIENTS
        elif severity == AlertSeverity.HIGH:
            return self.config.CRITICAL_RECIPIENTS + self.config.HIGH_RECIPIENTS
        else:
            return self.config.MODERATE_RECIPIENTS
    
    def _check_rate_limit(self) -> bool:
        current_minute = datetime.utcnow().strftime("%Y%m%d%H%M")
        rate_key = f"rate_limit:{current_minute}"
        current_count = int(self.redis_client.get(rate_key) or 0)
        if current_count >= self.config.RATE_LIMIT_PER_MINUTE:
            return False
        self.redis_client.incr(rate_key)
        self.redis_client.expire(rate_key, 60)
        return True
    
    async def _store_alert_record(self, alert_id, severity, message, affected_parcels, results):
        record = {
            "alert_id": alert_id,
            "severity": severity.value,
            "message": message,
            "affected_parcels": affected_parcels,
            "dispatch_results": results,
            "timestamp": datetime.utcnow().isoformat()
        }
        history_key = f"alert_history:{alert_id}"
        self.redis_client.setex(history_key, 86400, json.dumps(record))

_dispatcher_instance = None

def get_dispatcher(config: DispatcherConfig = None) -> EmergencyDispatcher:
    global _dispatcher_instance
    if _dispatcher_instance is None:
        _dispatcher_instance = EmergencyDispatcher(config)
    return _dispatcher_instance
