import React, { useEffect, useState } from 'react';
import { Leaf, AlertTriangle, Droplets } from 'lucide-react';
import { motion } from 'motion/react';

export function CropIntelligence() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchCrop = async () => {
      try {
        const r = await fetch('/api/crop');
        const d = await r.json();
        setData(d);
      } catch (e) {}
    };
    const i = setInterval(fetchCrop, 3000);
    fetchCrop();
    return () => clearInterval(i);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden min-h-[200px]">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <Leaf className="w-5 h-5 text-teal-400" />
          <h2 className="text-lg font-bold tracking-widest text-teal-300">CROP INTELLIGENCE</h2>
        </div>
        {data?.status === 'STRESS_ALERT' && (
          <div className="bg-orange-900/40 px-2 py-1 rounded text-xs text-orange-400 flex items-center gap-2 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            STRESS DETECTED
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-center gap-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
            <div className="text-[10px] text-teal-600/80 mb-1 uppercase tracking-widest">NDVI Index</div>
            <div className="text-2xl font-bold text-white tracking-tighter">
                {data?.ndvi?.toFixed(2) || '---'}
            </div>
            </div>
            <div>
            <div className="text-[10px] text-teal-600/80 mb-1 uppercase tracking-widest">Soil Moisture</div>
            <div className="text-2xl font-bold text-teal-400 tracking-tighter">
                {data?.soil_moisture ? (data.soil_moisture * 100).toFixed(1) : '--'}%
            </div>
            </div>
        </div>
        
        <div className="mt-2 text-xs text-teal-500/80 uppercase tracking-widest border-t border-teal-800/30 pt-3">
           <span className="opacity-60">ACTION: </span>
           <span className={data?.recommendation === 'Activate Irrigation' ? 'text-orange-400 font-bold' : 'text-teal-400'}>
              {data?.recommendation || 'MONITOR'}
           </span>
        </div>
      </div>
    </div>
  );
}
