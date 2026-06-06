import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LcodRecord {
  id: string;
  source: string;
  timestamp: number;
}

export function LcodMonitor() {
  const [records, setRecords] = useState<LcodRecord[]>([]);

  useEffect(() => {
    const fetchMemory = async () => {
      try {
        const res = await fetch('/api/lcod/memory');
        if (!res.ok) return;
        const data = await res.json();
        
        // Transform the dictionary to an array and sort descending by timestamp
        const mapped = Object.entries(data.memory).map(([id, val]: [string, any]) => ({
          id,
          source: val.source,
          timestamp: val.timestamp
        })).sort((a, b) => b.timestamp - a.timestamp).slice(0, 10);
        
        setRecords(mapped);
      } catch (err) {
        console.error("Failed to fetch LCOD", err);
      }
    };

    const interval = setInterval(fetchMemory, 2000);
    fetchMemory(); // initial fetch

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col min-h-[300px]">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-semibold tracking-wider text-teal-300">LCOD MEMORY</h2>
        </div>
        <div className="bg-teal-900/40 px-2 py-1 rounded text-xs text-teal-400 flex items-center gap-2">
          <ShieldCheck className="w-3 h-3" />
          RADICAL TRUTH
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        <AnimatePresence>
          {records.length === 0 ? (
            <div className="text-teal-600/50 text-sm text-center mt-10 tracking-widest">
              WAITING FOR INGESTION...
            </div>
          ) : (
            records.map((rec) => (
              <motion.div 
                key={rec.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-black/40 border border-teal-800/30 rounded p-3 text-sm flex justify-between items-center"
              >
                <div>
                  <div className="text-teal-200 font-mono mb-1 truncate max-w-[200px]">{rec.id}</div>
                  <div className="text-[10px] text-teal-500/60 uppercase tracking-widest">
                    SRC: {rec.source}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-teal-500/60 font-mono">
                    {new Date(rec.timestamp).toISOString().split('T')[1].replace('Z', '')}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
