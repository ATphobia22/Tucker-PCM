import React, { useEffect, useState, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { Network } from 'lucide-react';
import clsx from 'clsx';

export function KnowledgeGraphView() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [windowDimensions, setWindowDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>();

  useEffect(() => {
    fetch('/api/graph')
      .then(r => r.json())
      .then(data => setGraphData(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    // Dynamic resizing for the container
    const updateDimensions = () => {
      if (containerRef.current) {
        setWindowDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const handleClick = useCallback(
    (node: any) => {
      // Focus on node
      const distance = 40;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z);

      if (fgRef.current) {
        fgRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node, // lookAt
          3000  // ms transition
        );
      }
    },
    [fgRef]
  );

  return (
    <div className="bg-[#0A1220] border border-teal-800/50 rounded-lg p-5 flex flex-col relative overflow-hidden flex-1 min-h-[400px]">
      <div className="flex justify-between items-center mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <Network className="w-5 h-5 text-indigo-400" />
          <h2 className="text-xl font-bold tracking-widest text-indigo-300">TOWNSHIP KNOWLEDGE GRAPH</h2>
        </div>
        <div className="bg-indigo-900/40 px-2 py-1 rounded text-xs text-indigo-400 font-mono">
          NEO4J RUNTIME
        </div>
      </div>

      <div ref={containerRef} className="flex-1 w-full bg-black/60 rounded border border-indigo-900/30 overflow-hidden relative">
        {windowDimensions.width > 0 && windowDimensions.height > 0 && (
          <ForceGraph3D
            ref={fgRef}
            graphData={graphData}
            width={windowDimensions.width}
            height={windowDimensions.height}
            nodeLabel="name"
            nodeColor={(node: any) => {
              switch(node.group) {
                case 'historical': return '#6366f1'; // indigo
                case 'geology': return '#2dd4bf'; // teal
                case 'aquifer': return '#3b82f6'; // blue
                case 'parcel': return '#10b981'; // emerald
                case 'well': return '#f59e0b'; // amber
                case 'fault': return '#ef4444'; // red
                default: return '#9ca3af'; // gray
              }
            }}
            nodeVal="val"
            linkColor={() => '#4338ca'} // indigo-700
            linkOpacity={0.5}
            linkWidth={1.5}
            linkLabel="label"
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={2}
            onNodeClick={handleClick}
            backgroundColor="rgba(0,0,0,0)"
            showNavInfo={false}
          />
        )}
      </div>

      {/* Decorative gradient */}
      <div className="absolute bottom-0 right-0 w-full h-1/4 bg-gradient-to-t from-indigo-900/20 to-transparent pointer-events-none" />
    </div>
  );
}
