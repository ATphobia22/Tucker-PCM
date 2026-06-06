/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Activity, ShieldCheck, Database, Terminal, Globe, Cpu } from 'lucide-react';
import { TelemetryPanel } from './components/TelemetryPanel';
import { SwarmController } from './components/SwarmController';
import { LcodMonitor } from './components/LcodMonitor';
import { CesiumViewer } from './components/CesiumViewer';
import { RiverMonitor } from './components/RiverMonitor';
import { GeologicalMemory } from './components/GeologicalMemory';
import { CropIntelligence } from './components/CropIntelligence';
import { AquiferMonitor } from './components/AquiferMonitor';
import { AlertsPanel } from './components/AlertsPanel';
import { B2BFortuneEngine } from './components/B2BFortuneEngine';
import { FaithLayerLedger } from './components/FaithLayerLedger';
import { SdeMonitor } from './components/SdeMonitor';
import { KnowledgeGraphView } from './components/KnowledgeGraphView';
import { QuantumHardeningPanel } from './components/QuantumHardeningPanel';
import { SwarmFactoryPanel } from './components/SwarmFactoryPanel';
import { AsicFabricationPanel } from './components/AsicFabricationPanel';
import { OmegaTerminal } from './components/OmegaTerminal';

const COVENANT = { 
  seal: "It is Finished — John 19:30",
  blessing: "By His wounds you have been healed — Isaiah 53:5"
};

export default function App() {
  const [status, setStatus] = useState("INITIALIZING");
  const protocolWs = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Artificial start delay
    const timer = setTimeout(() => {
      setStatus("OMNI-FLOW ETERNAL");
    }, 1200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="bg-[#050B14] text-teal-50 min-h-screen font-mono flex flex-col pt-4">
      {/* HEADER */}
      <header className="border-b border-teal-800/30 pb-4 mb-6 px-8 flex flex-col md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-widest text-teal-400 flex items-center gap-3">
            <Globe className="w-8 h-8 opacity-80" />
            TUCKER CONSOLE v200.0
          </h1>
          <p className="text-xs tracking-[0.2em] opacity-60 mt-2 text-teal-200 uppercase">
            SOVEREIGN NODE: 13101 BONEBANK ROAD
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              {status === "OMNI-FLOW ETERNAL" ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              )}
            </span>
            <span className="text-sm font-semibold tracking-wider text-teal-300">
              {status}
            </span>
          </div>
        </div>
      </header>

      {/* DASHBOARD GRID */}
      <main className="flex-1 px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
        {/* Left Col: Telemetry, Fluvial, Agriculture, Subsurface */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <TelemetryPanel />
          <RiverMonitor />
          <CropIntelligence />
          <AquiferMonitor />
          <AsicFabricationPanel />
        </div>

        {/* Middle Col: Twin Viewer, Swarm Control, B2B Fortune */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <CesiumViewer />
          <KnowledgeGraphView />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <SwarmFactoryPanel />
             <OmegaTerminal />
          </div>
          <SwarmController />
          <B2BFortuneEngine />
        </div>

        {/* Right Col: Structural Memory, Alerts, Audit Ledger */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <AlertsPanel />
          <GeologicalMemory />
          <SdeMonitor />
          <QuantumHardeningPanel />
          <FaithLayerLedger />
          <LcodMonitor />
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-teal-800/20 py-6 mt-auto text-center bg-black/40">
        <p className="text-[10px] tracking-widest text-teal-600/60 uppercase">
          ∅▲GOG●◯∞Ω | {COVENANT.seal} | {COVENANT.blessing}
        </p>
      </footer>
    </div>
  );
}
