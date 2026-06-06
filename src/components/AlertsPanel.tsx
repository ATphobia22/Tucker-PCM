import React, { useEffect, useState } from 'react';
import { BellRing, ShieldAlert, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AlertData {
  id: number;
  title: string;
  severity: 'HIGH' | 'WARN' | 'INFO';
  details: string;
}

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<AlertData[]>([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const r = await fetch('/api/alerts');
        const d = await r.json();
        setAlerts(d.alerts || []);
      } catch (e) {}
    };
    const i = setInterval(fetchAlerts, 3000);
    fetchAlerts();
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[300px]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <BellRing className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold tracking-widest text-teal-300">SYSTEM ALERTS</h2>
        </div>
        <div className="bg-teal-900/40 px-2 py-1 rounded text-xs text-teal-400 font-mono">
          {alerts.length} ACTIVE
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 font-mono">
        <AnimatePresence>
          {alerts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-teal-600/50 text-sm text-center mt-8 tracking-widest"
            >
              ALL SYSTEMS NOMINAL
            </motion.div>
          ) : (
            alerts.map((alert) => (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`border rounded p-3 text-sm flex gap-3 ${
                    alert.severity === 'HIGH' ? 'bg-red-900/10 border-red-500/30' : 
                    alert.severity === 'WARN' ? 'bg-orange-900/10 border-orange-500/30' : 
                    'bg-teal-900/10 border-teal-800/30'
                }`}
              >
                <div className={`mt-0.5 ${
                    alert.severity === 'HIGH' ? 'text-red-400' : 
                    alert.severity === 'WARN' ? 'text-orange-400' : 
                    'text-teal-500'
                }`}>
                    {alert.severity === 'HIGH' ? <ShieldAlert className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                </div>
                <div>
                  <div className={`font-bold mb-1 tracking-wider ${
                    alert.severity === 'HIGH' ? 'text-red-300' : 
                    alert.severity === 'WARN' ? 'text-orange-300' : 
                    'text-teal-300'
                  }`}>
                      {alert.title}
                  </div>
                  <div className="text-[10px] text-teal-100/60 uppercase tracking-widest leading-relaxed">
                    {alert.details}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
