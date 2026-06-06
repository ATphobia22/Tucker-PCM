import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface TelemetryData {
  tps: number;
  fidelity: number;
  seal: string;
  timestamp: number;
}

export function TelemetryPanel() {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [history, setHistory] = useState<number[]>(Array(20).fill(8500));

  useEffect(() => {
    // Determine dynamic websocket URL based on current host
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const ws = new WebSocket(`${protocol}//${host}/ws/telemetry`);

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as TelemetryData;
        setData(payload);
        setHistory(prev => {
          const next = [...prev, payload.tps];
          if (next.length > 30) next.shift();
          return next;
        });
      } catch (err) {
        console.error("Telemetry parsing error", err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Simple sparkline path calculation
  const max = Math.max(...history, 8600);
  const min = Math.min(...history, 8400);
  const range = max - min || 1;
  const pathData = history.map((val, i) => {
    const x = (i / (history.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 100;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 blur-3xl rounded-full" />
      
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-teal-400" />
        <h2 className="text-xl font-semibold tracking-wider text-teal-300">10Hz TELEMETRY</h2>
      </div>

      <div className="flex justify-between items-end mb-6 border-b border-teal-800/30 pb-4">
        <div>
          <p className="text-xs text-teal-600/80 uppercase tracking-widest mb-1">Baseline Rate</p>
          <div className="text-4xl font-bold text-white tracking-tighter">
            {data ? data.tps.toFixed(2) : "8500.00"} <span className="text-lg text-teal-500">TPS</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-teal-600/80 uppercase tracking-widest mb-1">QEC Fidelity</p>
          <div className="text-2xl font-semibold text-teal-400">
            {data ? (data.fidelity * 100).toFixed(2) : "99.97"}%
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-[100px] relative w-full mb-4">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          <motion.path
            d={pathData}
            fill="none"
            stroke="#2DD4BF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5 }}
          />
        </svg>
      </div>

      <div className="flex justify-between items-center text-[10px] text-teal-400 font-mono border-t border-teal-800/30 pt-3 mb-3">
        <span>SUB-ATOMIC RYDBERG</span>
        <span>VIBRATIONAL: 0.9997</span>
      </div>

      <div className="text-[10px] text-teal-500/60 uppercase tracking-widest text-center mt-auto">
        {data ? data.seal : "WAITING FOR OMNI-FLOW..."}
      </div>
    </div>
  );
}
