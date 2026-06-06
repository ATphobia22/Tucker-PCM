import React, { useEffect, useState } from 'react';
import { ScrollText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditLog {
  event: string;
  hash: string;
  seal: string;
}

export function FaithLayerLedger() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    fetch('/api/audit')
      .then(r => r.json())
      .then(d => setLogs(d.logs || []))
      .catch(console.error);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-emerald-400" />
          <h2 className="text-xl font-bold tracking-widest text-emerald-300">FAITH LAYER LEDGER</h2>
        </div>
        <div className="bg-emerald-900/40 px-2 py-1 rounded text-xs text-emerald-400 font-mono flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3" />
          Ed25519 SIGNED
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-3 font-mono">
        <AnimatePresence>
          {logs.map((log, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="border border-emerald-800/30 bg-emerald-900/10 rounded p-3 text-sm"
            >
               <div className="flex justify-between items-start mb-2">
                  <div className="text-emerald-300 font-bold tracking-wider">{log.event}</div>
               </div>
               <div className="flex justify-between items-center text-[10px] text-emerald-500/60 uppercase">
                  <span>SHA256: {log.hash}</span>
                  <span className="bg-emerald-950/50 px-2 py-0.5 rounded text-emerald-400">{log.seal}</span>
               </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <div className="mt-4 pt-4 border-t border-emerald-800/30 text-[10px] text-center text-emerald-600/50 uppercase tracking-widest">
        AuditLog_FaithLayer.json • Immutable Record
      </div>
    </div>
  );
}
