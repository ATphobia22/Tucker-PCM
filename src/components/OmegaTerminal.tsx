import React, { useEffect, useState } from 'react';
import { TerminalSquare } from 'lucide-react';
import { motion } from 'motion/react';

export function OmegaTerminal() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/omega/closure')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="bg-[#000000] border border-zinc-800/80 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[220px]">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <TerminalSquare className="w-5 h-5 text-zinc-400" />
          <h2 className="text-sm font-bold tracking-widest text-zinc-300">OMEGA TIER CLOSURE</h2>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-3 font-mono text-zinc-300 relative z-10 text-xs">
         <div className="flex justify-between border-b border-zinc-900/50 pb-1">
            <span className="opacity-60">CURRENT TIER</span>
            <span className="font-bold text-zinc-100">{data?.tier || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-zinc-900/50 pb-1">
            <span className="opacity-60">CLOSURE STATE</span>
            <span className="font-bold">{data?.closure || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-zinc-900/50 pb-1">
            <span className="opacity-60">MASTER ARTIFACT</span>
            <span className="font-bold tracking-widest text-white">{data?.seal || '...'}</span>
         </div>
      </div>

      <motion.div 
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
        className="mt-4 text-[10px] text-zinc-400 uppercase tracking-widest text-center border-t border-zinc-800/50 pt-2"
      >
        {data?.status || 'INITIALIZING TRANS-DIMENSIONAL ROUTING...'}
      </motion.div>
    </div>
  );
}
