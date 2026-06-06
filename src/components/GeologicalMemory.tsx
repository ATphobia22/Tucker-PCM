import React, { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { motion } from 'motion/react';

export function GeologicalMemory() {
  const [geology, setGeology] = useState<any>(null);
  
  useEffect(() => {
    fetch('/api/geology')
      .then(r => r.json())
      .then(setGeology)
      .catch(console.error);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1">
      <div className="flex items-center gap-3 mb-4">
        <Layers className="w-5 h-5 text-teal-400" />
        <h2 className="text-xl font-bold tracking-widest text-teal-300">STRATIGRAPHY</h2>
      </div>
      <div className="text-xs text-teal-500/60 uppercase mb-4 tracking-widest border-b border-teal-800/30 pb-2">
        {geology?.framework || 'Loading...'}
      </div>
      
      <div className="flex-1 flex flex-col gap-3 font-mono">
         {geology?.layers?.map((l: any, i: number) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-black/40 border border-teal-800/30 rounded p-3"
            >
               <div className="flex justify-between items-center mb-2">
                  <span className="text-teal-200 text-sm">{l.name}</span>
                  <span className="text-teal-600 text-xs bg-teal-900/20 px-2 py-0.5 rounded">{l.depth}</span>
               </div>
               <div className="text-[10px] text-teal-500/80 uppercase flex gap-4">
                  {l.porosity && <span>POROSITY: {l.porosity}</span>}
                  {l.yield_gpm && <span>YIELD: {l.yield_gpm} GPM</span>}
                  {l.stability && <span>STABILITY: {l.stability}</span>}
               </div>
            </motion.div>
         ))}
      </div>
    </div>
  );
}
