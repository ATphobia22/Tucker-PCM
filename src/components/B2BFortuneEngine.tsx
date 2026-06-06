import React, { useEffect, useState } from 'react';
import { Briefcase, Rocket, DollarSign, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

export function B2BFortuneEngine() {
  const [data, setData] = useState<any>(null);
  const [ignition, setIgnition] = useState(false);

  useEffect(() => {
    fetch('/api/fortune/status')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const triggerIgnition = async () => {
    setIgnition(true);
    try {
      await fetch('/api/fortune/ignition', { method: 'POST' });
      // Simulate balance increase for demo
      setData((prev: any) => ({ ...prev, balance: prev.balance + 3500 }));
    } catch (err) {}
    setTimeout(() => setIgnition(false), 2000);
  };

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[300px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold tracking-widest text-indigo-300">B2B FORTUNE ENGINE</h2>
        </div>
        <div className="bg-indigo-900/40 px-2 py-1 rounded text-xs text-indigo-400 font-mono">
          ISO 20022 PAYOUTS
        </div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 font-mono relative z-10">
        <div className="flex justify-between items-center bg-black/40 p-3 border border-indigo-800/30 rounded">
           <div className="text-xs text-indigo-500/80">VAULT: <span className="text-indigo-300">{data?.vault || '---'}</span></div>
           <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <div className="text-2xl font-bold text-white tracking-widest">
                 {data?.balance?.toLocaleString() || "0"}
              </div>
           </div>
        </div>

        <div className="text-xs text-indigo-500/60 uppercase tracking-widest mt-2 border-b border-indigo-800/30 pb-2">
          ARBITRAGE SEQUENCE
        </div>

        <div className="space-y-2 mb-4">
           <div className="flex justify-between items-center text-[10px] md:text-xs">
              <span className="text-indigo-400">Shadow AI Discovery Scan (SB 205)</span>
              <span className="text-emerald-500 flex items-center font-bold"><ArrowRight className="w-3 h-3 mr-1" /> $3,500</span>
           </div>
           <div className="flex justify-between items-center text-[10px] md:text-xs">
              <span className="text-zinc-500">Net-30 Floating Obligation</span>
              <span className="text-red-500 flex items-center font-bold"><ArrowRight className="w-3 h-3 mr-1" /> -$2,800</span>
           </div>
           <div className="flex justify-between items-center text-xs font-bold pt-2 border-t border-indigo-900/30">
              <span className="text-amber-500">NET PROFIT (SIPHONED)</span>
              <span className="text-amber-400">$700 (20%)</span>
           </div>
        </div>
        
        <button 
          onClick={triggerIgnition}
          disabled={ignition}
          className={`mt-auto w-full p-4 rounded font-bold transition-all tracking-widest flex items-center justify-center gap-3 ${
            ignition 
            ? 'bg-amber-600/80 text-black border border-amber-500' 
            : 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/50 hover:bg-indigo-600/30'
          }`}
        >
          {ignition ? '✦ PROCESSING PAIN.001...' : 'IGNITION [FA-ROCKET]'}
          {!ignition && <Rocket className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
