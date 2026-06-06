import React, { useEffect, useState } from 'react';
import { Fingerprint, Zap } from 'lucide-react';

export function SdeMonitor() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/sde/status')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[150px]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Fingerprint className="w-5 h-5 text-purple-400" />
          <h2 className="text-sm font-bold tracking-widest text-purple-300">DEDUPLICATION (SDE)</h2>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2 font-mono relative z-10">
         <div>
            <div className="text-[10px] text-purple-600/80 mb-1 uppercase tracking-widest">Active Shards</div>
            <div className="text-2xl font-bold text-white">
               {data?.active_shards || "---"}
            </div>
         </div>
         <div>
            <div className="text-[10px] text-purple-600/80 mb-1 uppercase tracking-widest">Compression</div>
            <div className="text-2xl font-bold text-purple-400 flex items-center gap-2">
               <Zap className="w-4 h-4" /> {data?.compression || "--%"}
            </div>
         </div>
      </div>
      
      <div className="mt-4 text-[10px] text-purple-500/60 uppercase tracking-widest border-t border-purple-800/30 pt-3">
         ALGORITHM: {data?.algorithm || 'Loading...'}
      </div>
    </div>
  );
}
