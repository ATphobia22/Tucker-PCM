import React, { useEffect, useState } from 'react';
import { DatabaseZap, ArrowDownFromLine } from 'lucide-react';
import { motion } from 'motion/react';

export function AquiferMonitor() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAquifer = async () => {
      try {
        const r = await fetch('/api/aquifer');
        const d = await r.json();
        setData(d);
      } catch (e) {}
    };
    const i = setInterval(fetchAquifer, 2500);
    fetchAquifer();
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden min-h-[200px]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <DatabaseZap className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold tracking-widest text-teal-300">AQUIFER INTELLIGENCE</h2>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-4 relative z-10">
        <div className="text-[10px] text-teal-600/80 mb-1 uppercase tracking-widest">{data?.aquifer || 'Ohio River Outwash'}</div>
        
        <div className="flex items-end gap-3">
            <div className="text-4xl font-bold text-white tracking-tighter flex items-center gap-2">
                <ArrowDownFromLine className="w-6 h-6 text-teal-600" />
                {data?.depth_ft?.toFixed(2) || '---'} 
            </div>
            <span className="text-sm font-normal text-teal-500 mb-1">ft</span>
        </div>
        
        <div className="mt-2 text-xs text-teal-500/80 uppercase tracking-widest border-t border-teal-800/30 pt-3 flex justify-between">
           <span className="opacity-60">STATUS: </span>
           <span className={data?.status === 'DECLINE_WARNING' ? 'text-orange-400 font-bold' : 'text-teal-400'}>
              {data?.status || 'STABLE'}
           </span>
        </div>
      </div>
      
      {/* Decorative gradient to simulate water depth */}
      <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-teal-900/40 to-transparent pointer-events-none" />
    </div>
  );
}
