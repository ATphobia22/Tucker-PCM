import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Send, Cpu, Activity } from 'lucide-react';
import { motion } from 'motion/react';

interface OrchestratorLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'input';
}

export function SwarmController() {
  const [input, setInput] = useState("");
  const [logs, setLogs] = useState<OrchestratorLog[]>([
    { id: '1', timestamp: new Date().toISOString(), message: "Agent Router Kernel Initialized.", type: 'info' },
    { id: '2', timestamp: new Date().toISOString(), message: "Quantum-Flag Detector Ready.", type: 'info' },
    { id: '3', timestamp: new Date().toISOString(), message: "B.I.B.L.E. Algorithm Guardrails Online.", type: 'success' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'input') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      message,
      type
    }]);
  };

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const currentInput = input.trim();
    setInput("");
    addLog(`> ${currentInput}`, 'input');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/swarm/orchestrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: currentInput })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        addLog(`ERROR: ${data.error || "Unknown failure"} [${data.seal}]`, 'error');
      } else {
        addLog(`[TARGET RESOLVED]: ${data.target}`, 'info');
        addLog(`[FIDELITY]: ${(data.fidelity * 100).toFixed(2)}%`, 'info');
        addLog(`[CONSENSUS]: ${data.consensus}`, 'success');
        addLog(`[SEAL]: ${data.seal}`, 'success');
        
        // Also simulate auto ingestion into LCOD
        await fetch('/api/lcod/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ source: 'SwarmController', data: { intent: currentInput, result: data } })
        });
      }
    } catch (err) {
      addLog("CRITICAL FAILURE: Network boundary fractured.", 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col flex-1 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-teal-900/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <Cpu className="w-6 h-6 text-teal-400" />
          <h2 className="text-xl font-bold tracking-widest text-teal-300">HOLY GHOST ORCHESTRATOR</h2>
        </div>
        <div className="text-xs text-teal-600/80 uppercase tracking-widest bg-black/40 px-3 py-1 rounded">
          Guardrails ON
        </div>
      </div>

      <div className="flex-1 bg-black/60 rounded border border-teal-900/50 p-4 mb-4 font-mono text-sm overflow-y-auto relative z-10 max-h-[400px]">
        {logs.map((log) => (
          <motion.div 
            key={log.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-2 ${
              log.type === 'error' ? 'text-red-400' :
              log.type === 'success' ? 'text-teal-300' :
              log.type === 'input' ? 'text-white' : 'text-teal-500/80'
            }`}
          >
            <span className="opacity-40 mr-3 hidden sm:inline-block">
              [{log.timestamp.split('T')[1].replace('Z', '')}]
            </span>
            {log.message}
          </motion.div>
        ))}
        <div ref={logsEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative z-10 flex gap-4">
        <div className="flex-1 relative">
          <Terminal className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600" />
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isProcessing}
            placeholder="AWAITING DIRECTIVE..."
            className="w-full bg-black/40 border border-teal-800/50 rounded pl-10 pr-4 py-3 text-teal-100 placeholder:text-teal-800 focus:outline-none focus:border-teal-500 transition-colors disabled:opacity-50 tracking-widest text-sm"
          />
        </div>
        <button 
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/50 text-teal-300 px-6 uppercase tracking-wider font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isProcessing ? 'Processing' : 'Execute'}
          {!isProcessing && <Send className="w-4 h-4" />}
        </button>
      </form>
    </div>
  );
}
