import React, { useEffect, useState } from 'react';
import { Atom } from 'lucide-react';
import { motion } from 'motion/react';

export function QuantumHardeningPanel() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/quantum/hardening')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-fuchsia-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[220px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Atom className="w-5 h-5 text-fuchsia-400" />
          <h2 className="text-sm font-bold tracking-widest text-fuchsia-300">QUANTUM HARDENING</h2>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-3 font-mono text-fuchsia-200 relative z-10 text-xs">
         <div className="flex justify-between border-b border-fuchsia-900/30 pb-1">
            <span className="opacity-60">DYNAMICS</span>
            <span className="font-bold">{data?.latency || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-fuchsia-900/30 pb-1">
            <span className="opacity-60">QEC LEVEL</span>
            <span className="font-bold">{data?.qec || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-fuchsia-900/30 pb-1">
            <span className="opacity-60">ERROR RATE</span>
            <span className="font-bold text-emerald-400">{data?.error_rate || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-fuchsia-900/30 pb-1">
            <span className="opacity-60">ACCURACY</span>
            <span className="font-bold text-amber-400">{data?.accuracy || '...'}</span>
         </div>
      </div>

      <div className="mt-4 text-[10px] text-fuchsia-500/60 uppercase tracking-widest text-center">
        STATUS: {data?.status || 'LOADING...'}
      </div>
    </div>
  );
}
