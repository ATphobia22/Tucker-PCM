import React, { useEffect, useState } from 'react';
import { Cpu } from 'lucide-react';
import { motion } from 'motion/react';

export function AsicFabricationPanel() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/substrate/fabrication')
      .then((res) => res.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-blue-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[220px]">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Cpu className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-bold tracking-widest text-blue-300">ASIC FABRICATION</h2>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-3 font-mono text-blue-200 relative z-10 text-xs">
         <div className="flex justify-between border-b border-blue-900/30 pb-1">
            <span className="opacity-60">RESOLUTION</span>
            <span className="font-bold">{data?.resolution || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-blue-900/30 pb-1">
            <span className="opacity-60">FOUNDRY</span>
            <span className="font-bold">{data?.foundry || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-blue-900/30 pb-1">
            <span className="opacity-60">SHIELDING</span>
            <span className="font-bold text-blue-400">{data?.shielding || '...'}</span>
         </div>
      </div>

      <div className="mt-4 text-[10px] text-blue-500/60 uppercase tracking-widest text-center bg-blue-900/20 py-1 rounded">
        {data?.status || 'LOADING...'}
      </div>
    </div>
  );
}
