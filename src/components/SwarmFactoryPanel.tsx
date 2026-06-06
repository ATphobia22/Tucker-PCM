import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { motion } from 'motion/react';

export function SwarmFactoryPanel() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Polling simulation for active evolution
    const fetchStats = () => {
        fetch('/api/swarm/factory')
        .then((res) => res.json())
        .then(setData)
        .catch(console.error);
    };
    fetchStats();
    const int = setInterval(fetchStats, 5000);
    return () => clearInterval(int);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-cyan-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[220px]">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold tracking-widest text-cyan-300">META-AGENT FACTORY</h2>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-3 font-mono text-cyan-200 relative z-10 text-xs">
         <div className="flex justify-between border-b border-cyan-900/30 pb-1">
            <span className="opacity-60">GENERATED</span>
            <span className="font-bold text-white">{data?.meta_agents || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-cyan-900/30 pb-1">
            <span className="opacity-60">EVOLUTION LOOP</span>
            <span className="font-bold text-cyan-400 animate-pulse">{data?.evolution || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-cyan-900/30 pb-1">
            <span className="opacity-60">REWRITE BUDGET</span>
            <span className="font-bold text-amber-400">{data?.rewrite_budget || '...'}</span>
         </div>
         <div className="flex justify-between border-b border-cyan-900/30 pb-1">
            <span className="opacity-60">INTELLIGENCE</span>
            <span className="font-bold">{data?.graph || '...'}</span>
         </div>
      </div>

      <div className="mt-4 text-[10px] text-cyan-500/60 uppercase tracking-widest text-center">
        STATUS: {data?.status || 'LOADING...'}
      </div>
    </div>
  );
}
