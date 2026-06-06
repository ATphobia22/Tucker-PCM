import React, { useEffect, useState } from 'react';
import { Waves, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export function RiverMonitor() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchWater = async () => {
      try {
        const r = await fetch('/api/water/03377500');
        const d = await r.json();
        setData(d);
      } catch (e) {}
    };
    const i = setInterval(fetchWater, 2000);
    fetchWater();
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden min-h-[250px]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Waves className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold tracking-widest text-teal-300">FLUVIAL MONITOR</h2>
        </div>
        {data?.status === 'HIGH' && (
          <div className="bg-red-900/40 px-2 py-1 rounded text-xs text-red-400 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            FLOOD RISK
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div>
          <div className="text-xs text-teal-600/80 mb-1 uppercase tracking-widest">{data?.river || 'Wabash'} Flow</div>
          <div className="text-4xl font-bold text-white tracking-tighter">
            {data?.flow_cfs || '---'} <span className="text-sm font-normal text-teal-500">cfs</span>
          </div>
        </div>
        
        <div>
          <div className="text-xs text-teal-600/80 mb-2 uppercase tracking-widest flex justify-between">
            <span>Soil Saturation</span>
            <span className="text-teal-400">{(data ? data.soil_saturation * 100 : 0).toFixed(1)}%</span>
          </div>
          <div className="w-full bg-teal-950/40 rounded-full h-2 overflow-hidden">
            <motion.div 
              className="bg-teal-500 h-2" 
              initial={{ width: 0 }} 
              animate={{ width: `${(data?.soil_saturation || 0) * 100}%`}} 
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
