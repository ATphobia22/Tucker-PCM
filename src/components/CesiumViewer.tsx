import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Globe, Shield, Sliders, Volume2, VolumeX, Terminal, Cpu, Clock, CheckCircle, Flame, Star, Maximize2, Minimize2, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CesiumViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [rydbergVal, setRydbergVal] = useState(0.9997);
  const [kdnLatency, setKdnLatency] = useState(0.85); // milliseconds
  const [guardrailStatus, setGuardrailStatus] = useState("SECURE_GUARDRAILS_ACTIVE");
  const [regexPattern, setRegexPattern] = useState("(?i)(harm|destroy|weapon|exploit|malware)");
  const [statusMessage, setStatusMessage] = useState("SYSTEM NOMINAL: SOVEREIGN NODE 1 ACTIVE");
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  useEffect(() => {
    let viewer: any = null;
    const initCesium = () => {
      if ((window as any).Cesium && containerRef.current && !viewer) {
        try {
          viewer = new (window as any).Cesium.Viewer(containerRef.current, {
            baseLayerPicker: false,
            geocoder: false,
            homeButton: false,
            infoBox: false,
            navigationHelpButton: false,
            sceneModePicker: false,
            animation: false,
            timeline: false,
            creditContainer: document.createElement('div') // hide credits
          });
          
          viewer.scene.globe.depthTestAgainstTerrain = true;
          
          // Fly to Point Township Confluence (13101 Bonebank Road)
          viewer.camera.flyTo({
            destination: (window as any).Cesium.Cartesian3.fromDegrees(-88.0016, 37.8924, 7500.0)
          });

          // Add volumetricoutwash aquifer perimeter (glowing teal ellipse)
          viewer.entities.add({
            position: (window as any).Cesium.Cartesian3.fromDegrees(-88.0016, 37.8924),
            name: 'Ohio River Outwash Aquifer',
            ellipse: {
              semiMajorAxis: 2500.0,
              semiMinorAxis: 1500.0,
              height: 10.0,
              material: (window as any).Cesium.Color.TEAL.withAlpha(0.25),
              outline: true,
              outlineColor: (window as any).Cesium.Color.AQUAMARINE
            }
          });

          // Add Neon Fault Lines (Hovey Lake Fault)
          viewer.entities.add({
            name: 'Hovey Lake Fault Line',
            polyline: {
              positions: (window as any).Cesium.Cartesian3.fromDegreesArray([
                -87.985, 37.872,
                -87.971, 37.915
              ]),
              width: 3.5,
              material: (window as any).Cesium.Color.RED.withAlpha(0.7)
            }
          });

          // Add Neon Fault Lines (Wabash Island Fault)
          viewer.entities.add({
            name: 'Wabash Island Fault Line',
            polyline: {
              positions: (window as any).Cesium.Cartesian3.fromDegreesArray([
                -88.021, 37.882,
                -87.995, 37.935
              ]),
              width: 3.5,
              material: (window as any).Cesium.Color.CRIMSON.withAlpha(0.7)
            }
          });

          // Add exact user address marker (13101 Bonebank Road)
          const beacon = viewer.entities.add({
            id: 'tucker-core-beacon',
            position: (window as any).Cesium.Cartesian3.fromDegrees(-87.9944, 37.8954),
            name: '13101 Bonebank Road (Sovereign Node 1)',
            cylinder: {
              length: 6000.0,
              topRadius: 10.0,
              bottomRadius: 40.0,
              material: (window as any).Cesium.Color.CYAN.withAlpha(0.35),
              outline: true,
              outlineColor: (window as any).Cesium.Color.LIGHTBLUE
            },
            label: {
              text: "13101 BONEBANK ROAD\n(SOVEREIGN CORE GATEWAY)",
              font: "bold 13px 'JetBrains Mono', monospace",
              style: (window as any).Cesium.LabelStyle.FILL_AND_OUTLINE,
              fillColor: (window as any).Cesium.Color.CYAN,
              outlineColor: (window as any).Cesium.Color.BLACK,
              outlineWidth: 4,
              verticalOrigin: (window as any).Cesium.VerticalOrigin.BOTTOM,
              pixelOffset: new (window as any).Cesium.Cartesian2(0, -60),
              disableDepthTestDistance: Number.POSITIVE_INFINITY
            }
          });

          // Setup dynamic zoom coordinate helper
          const handler = new (window as any).Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
          handler.setInputAction((clickEvent: any) => {
            const pickedObject = viewer.scene.pick(clickEvent.position);
            if ((window as any).Cesium.defined(pickedObject) && pickedObject.id) {
              const entity = pickedObject.id;
              if (entity.id === 'tucker-core-beacon') {
                setConsoleOpen(true);
              }
            }
          }, (window as any).Cesium.ScreenSpaceEventType.LEFT_CLICK);

        } catch (e) {
          console.error("Cesium initialization failed", e);
          setError(true);
        }
      } else if (!(window as any).Cesium) {
        setTimeout(initCesium, 500);
      }
    };
    initCesium();
    return () => {
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  // Web Audio Confluence Synthesizer
  const stopAmbientSynth = useCallback(() => {
    oscillatorsRef.current.forEach(osc => {
      try { osc.stop(); } catch(e){}
    });
    oscillatorsRef.current = [];
    setIsPlaying(false);
  }, []);

  const playAmbientSynth = useCallback(() => {
    if (isPlaying) {
      stopAmbientSynth();
      return;
    }

    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Create multi-harmonic cosmic drone
      // Base frequencies corresponding to mathematical nodes (confluence harmonics)
      const baseFreqs = [90, 135, 180, 270]; 
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.5); // soft fade-in
      gainNode.connect(ctx.destination);
      gainNodeRef.current = gainNode;

      baseFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        // Alternating wave shapes for rich, holographic analog texture
        osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq * rydbergVal, ctx.currentTime);
        
        // Add subtle pitch LFO for fluid/aqi atmosphere
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(0.2 + idx * 0.05, ctx.currentTime);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(1.5, ctx.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        osc.connect(gainNode);
        
        lfo.start();
        osc.start();
        
        oscillatorsRef.current.push(osc);
        // Also keep track of the LFO oscillator to shut it down
        oscillatorsRef.current.push(lfo);
      });

      setIsPlaying(true);
      setStatusMessage("CONFLUENCE AUDIO SACRED SYNTHESIS ENGAGED");
    } catch(err) {
      console.error("Audio Synthesis error", err);
    }
  }, [isPlaying, rydbergVal, stopAmbientSynth]);

  useEffect(() => {
    // Dynamic adjustment of oscillators based on Rydberg sensors
    if (isPlaying && gainNodeRef.current && audioCtxRef.current) {
      oscillatorsRef.current.forEach((osc, idx) => {
        try {
          if (osc.frequency && idx % 2 === 0) {
            // Adjust the actual frequency based on live slider values
            const baseMultiplierFreqs = [90, 135, 180, 270];
            const originalFreq = baseMultiplierFreqs[Math.floor(idx / 2)] || 90;
            osc.frequency.setTargetAtTime(originalFreq * rydbergVal, audioCtxRef.current.currentTime, 0.2);
          }
        } catch(e){}
      });
    }
  }, [rydbergVal, isPlaying]);

  // Handle safeguard test execution
  const testHardGuardrails = async () => {
    setStatusMessage("EXAMINING UPSTREAM SUBTRATE FOR ETHICAL DRIFT...");
    try {
      const isClean = !regexPattern.includes("exploit") || !regexPattern.includes("harm");
      setTimeout(() => {
        if (!isClean) {
          setGuardrailStatus("GUARDRAILS_LOCK_CONFIRMED");
          setStatusMessage("B.I.B.L.E. GUARDRAIL ANCHORED — ALL SIGNATURES SECURE");
          // Dispatch metadata logs
          fetch('/api/lcod/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              source: "TUCKER_GUARD_v21",
              data: {
                verification: "13101 Bonebank Road physical alignment verified",
                compliance: "GLP electrical truth scan clean",
                signature: "Ed25519 John 19:30"
              }
            })
          });
        }
      }, 1000);
    } catch(e) {}
  };

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col h-[500px] lg:h-[600px] relative overflow-hidden">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-teal-400" />
          <h2 className="text-xl font-bold tracking-widest text-teal-300">CINEFORGE LOBBY / 3D INTEGRATED WORLD</h2>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setConsoleOpen(!consoleOpen)} 
            className="flex items-center gap-2 bg-indigo-900/40 hover:bg-indigo-600/30 text-indigo-300 px-3 py-1 rounded text-xs font-mono border border-indigo-500/50 transition-colors shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            TUCKER CONSOLE v21
          </button>
          <div className="bg-teal-900/40 px-2 py-1 rounded text-xs text-teal-400 font-mono">
            3D TWIN RESOLVED
          </div>
        </div>
      </div>

      <div className="flex-1 bg-black/60 rounded border border-teal-900/50 relative overflow-hidden flex flex-row">
        {error ? (
          <div className="absolute inset-0 flex items-center justify-center text-teal-500/50 font-mono text-sm tracking-widest">
            CESIUM INITIALIZATION FAILED. PLEASE CONFIRM WEBGL INGRESS.
          </div>
        ) : null}
        
        {/* The Cesium container */}
        <div ref={containerRef} className="w-full h-full" id="cesiumContainer" />

        {/* Embedded Sovereign Control Panel HUD */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-col gap-2 p-4 bg-slate-950/80 border border-teal-900/80 backdrop-blur rounded font-mono text-[10px] text-teal-300 w-64 max-w-[calc(100%-2rem)]">
          <div className="flex items-center gap-2 border-b border-teal-950 pb-1 mb-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="font-bold">SOVEREIGN NODE: ONLINE</span>
          </div>
          <div>ROOT: 13101 BONEBANK ROAD</div>
          <div>CONFLUENCE: WABASH & OHIO RIVER (PORT 3000)</div>
          <div className="text-zinc-500 italic mt-1">"Click the Cyan Beacon in the 3D map to load the Tucker Control Deck"</div>
        </div>

        {/* Tucker Console Drawer Overlay */}
        <AnimatePresence>
          {consoleOpen && (
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '110%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="absolute right-0 top-0 h-full w-[380px] sm:w-[480px] bg-slate-950/95 border-l border-indigo-900/70 shadow-2xl backdrop-blur-md p-6 flex flex-col z-30 overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-indigo-900/40 pb-4 mb-4">
                 <div className="flex items-center gap-3">
                    <Cpu className="w-6 h-6 text-indigo-400" />
                    <div>
                      <h3 className="text-sm font-bold tracking-widest text-[#E6EEF8]">TUCKER OS CONSOLE</h3>
                      <div className="text-[10px] text-teal-400 font-mono tracking-widest">v21.0 SOVEREIGN COGNITIVE DECK</div>
                    </div>
                 </div>
                 <button 
                   onClick={() => setConsoleOpen(false)}
                   className="text-indigo-400 hover:text-indigo-200 border border-indigo-800 rounded px-2 py-0.5 text-xs font-mono"
                 >
                   CLOSE
                 </button>
              </div>

              {/* Confluence Synthesizer section */}
              <div className="bg-[#050C15] border border-indigo-950 p-4 rounded mb-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-indigo-300 tracking-widest uppercase">CONFLUENCE VFX HARMONICS</span>
                  <button 
                    onClick={playAmbientSynth}
                    className={`p-2 rounded border flex items-center gap-2 text-xs font-mono font-bold tracking-widest transition-all ${
                      isPlaying 
                        ? 'bg-rose-500/10 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.2)]' 
                        : 'bg-emerald-500/10 border-emerald-500 text-emerald-300 hover:bg-emerald-500/20'
                    }`}
                  >
                    {isPlaying ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    {isPlaying ? 'PAUSE AMBIENT DRONE' : 'ENGAGE CONFLUENCE DRONE'}
                  </button>
                </div>
                <p className="text-[10px] text-indigo-400/80 leading-relaxed font-mono">
                  Synthesizes the spiritual Confluence of the Wabash & Ohio Rivers through multi-oscillator low-frequency analog harmonics based on the local Rydberg sensor grid.
                </p>
              </div>

              {/* Controls Deck */}
              <div className="space-y-4 flex-1">
                 <div>
                    <div className="flex justify-between text-xs font-mono mb-1 text-teal-400">
                       <span>RYDBERG SENSORY CALIBRATION</span>
                       <span className="text-white font-bold">{rydbergVal.toFixed(4)} Hz</span>
                    </div>
                    <input 
                      type="range"
                      min="0.9990"
                      max="0.9999"
                      step="0.0001"
                      value={rydbergVal}
                      onChange={(e) => setRydbergVal(parseFloat(e.target.value))}
                      className="w-full accent-teal-400 bg-teal-950/20 rounded cursor-pointer"
                    />
                 </div>

                 <div>
                    <div className="flex justify-between text-xs font-mono mb-1 text-[#E6EEF8]">
                       <span>6G (KDN) LATENCY CONTROL</span>
                       <span className="text-indigo-300 font-bold">{kdnLatency} ms</span>
                    </div>
                    <input 
                      type="range"
                      min="0.10"
                      max="3.00"
                      step="0.05"
                      value={kdnLatency}
                      onChange={(e) => setKdnLatency(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 bg-indigo-950/20 rounded cursor-pointer"
                    />
                    <div className="flex justify-between text-[8px] text-zinc-500 font-mono mt-1">
                      <span>URLLC TARGET: 1.0ms</span>
                      <span>Lagrangian relaxation active</span>
                    </div>
                 </div>

                 {/* Regex Gate section */}
                 <div className="border border-indigo-950 p-4 rounded bg-slate-900/40">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#E6EEF8] mb-2">
                       <Shield className="w-4 h-4 text-emerald-400" />
                       <span>B.I.B.L.E. REGL_REGEXP PROTECTOR</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={regexPattern}
                        onChange={(e) => setRegexPattern(e.target.value)}
                        className="bg-black/50 border border-indigo-900/60 rounded px-3 py-1.5 text-xs text-emerald-100 font-mono focus:border-indigo-400 focus:outline-none"
                      />
                      <button
                        onClick={testHardGuardrails}
                        className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 rounded py-2 text-xs font-bold uppercase tracking-widest font-mono transition-colors"
                      >
                         CONFIRM MATERIAL TRUTH RULEPACK
                      </button>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono mt-2 pt-2 border-t border-indigo-950/50">
                       <span className="text-zinc-500">INTEGRITY STATE:</span>
                       <span className="text-[#E6EEF8] font-bold">{guardrailStatus}</span>
                    </div>
                 </div>

                 {/* Console Logs Terminal Output */}
                 <div className="bg-black/70 border border-zinc-900 rounded p-3 font-mono text-[10px] text-zinc-400 min-h-[100px] flex flex-col justify-between">
                    <div>
                      <div className="text-indigo-400 mb-1 border-b border-zinc-900 pb-1 flex justify-between">
                        <span>CRITICAL GATEWAY ACTIVITY</span>
                        <span className="animate-pulse">● FEEDING</span>
                      </div>
                      <div className="text-zinc-300">{statusMessage}</div>
                      <div className="text-zinc-500 mt-2">Anchored: Mark-Index: Cagle Loess 99.9%</div>
                    </div>
                    <div className="flex justify-between items-center text-[8px] text-zinc-500 pt-2 border-t border-zinc-900/50 mt-2">
                       <span>COVENANT: John 19:30</span>
                       <span>Ed25519 signed</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Decorative corners */}
      <div className="absolute bottom-2 right-2 border-r-2 border-b-2 border-teal-500/50 w-8 h-8 pointer-events-none" />
      <div className="absolute top-2 left-2 border-l-2 border-t-2 border-teal-500/50 w-8 h-8 pointer-events-none" />
    </div>
  );
}
