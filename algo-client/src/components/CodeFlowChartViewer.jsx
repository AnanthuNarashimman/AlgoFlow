import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Square, Type, GitBranch, CheckCircle, XCircle, ChevronRight, ZoomIn, ZoomOut, Move, Code, X } from 'lucide-react';

/* Mock Data for a simple "Is Number Prime?" algorithm 
*/
const INITIAL_NODES = [
  { id: 'start', type: 'start', label: 'Start Program', code: 'main()', x: 350, y: 50 },
  { id: 'init', type: 'process', label: 'Initialize', code: 'let n = 17;\nlet isPrime = true;', x: 350, y: 160 },
  { id: 'loop_init', type: 'process', label: 'Loop Setup', code: 'let i = 2;', x: 350, y: 270 },
  { id: 'condition', type: 'decision', label: 'Check Limit', code: 'i < n', x: 350, y: 380 },
  { id: 'mod_check', type: 'decision', label: 'Check Factor', code: 'n % i === 0', x: 350, y: 550 },
  { id: 'set_false', type: 'process', label: 'Found Factor', code: 'isPrime = false;\nbreak;', x: 600, y: 650 },
  { id: 'increment', type: 'process', label: 'Increment', code: 'i++ ', x: 150, y: 480 },
  { id: 'check_result', type: 'decision', label: 'Result?', code: 'if (isPrime)', x: 350, y: 750 },
  { id: 'print_prime', type: 'io', label: 'Output True', code: 'print("Prime")', x: 200, y: 900 },
  { id: 'print_not', type: 'io', label: 'Output False', code: 'print("Not Prime")', x: 500, y: 900 },
  { id: 'end', type: 'end', label: 'End', code: 'return 0;', x: 350, y: 1050 },
];

const INITIAL_EDGES = [
  { id: 'e1', source: 'start', target: 'init' },
  { id: 'e2', source: 'init', target: 'loop_init' },
  { id: 'e3', source: 'loop_init', target: 'condition' },
  { id: 'e4', source: 'condition', target: 'mod_check', label: 'True' },
  { id: 'e5', source: 'condition', target: 'check_result', label: 'False' },
  { id: 'e6', source: 'mod_check', target: 'set_false', label: 'True' },
  { id: 'e7', source: 'mod_check', target: 'increment', label: 'False' },
  { id: 'e8', source: 'increment', target: 'condition' }, // Loop back
  { id: 'e9', source: 'set_false', target: 'check_result' },
  { id: 'e10', source: 'check_result', target: 'print_prime', label: 'True' },
  { id: 'e11', source: 'check_result', target: 'print_not', label: 'False' },
  { id: 'e12', source: 'print_prime', target: 'end' },
  { id: 'e13', source: 'print_not', target: 'end' },
];

export default function CodeFlowchartViewer() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [draggingNode, setDraggingNode] = useState(null);
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [codeViewerPos, setCodeViewerPos] = useState({ x: 50, y: 100 });
  const [isDraggingCodeViewer, setIsDraggingCodeViewer] = useState(false);
  const [codeViewerDragStart, setCodeViewerDragStart] = useState({ x: 0, y: 0 });
  const [editorCode, setEditorCode] = useState('');

  const containerRef = useRef(null);

  // Load editor code from localStorage
  useEffect(() => {
    const loadCode = () => {
      const savedCode = localStorage.getItem('algoflow_code');
      if (savedCode) {
        setEditorCode(savedCode);
      }
    };
    
    // Initial load
    loadCode();
    
    // Poll for updates every 500ms
    const interval = setInterval(loadCode, 500);
    
    return () => clearInterval(interval);
  }, []);

  // --- Helpers to calculate SVG paths ---
  const getNodeCenter = (node) => {
    // Approx dimensions based on CSS
    const width = node.type === 'decision' ? 140 : 180;
    const height = node.type === 'decision' ? 100 : 80;
    return { x: node.x + width / 2, y: node.y + height / 2 };
  };

  const calculatePath = (source, target) => {
    const s = getNodeCenter(source);
    const t = getNodeCenter(target);
    
    // Simple Bezier curve for smooth flow
    const deltaY = Math.abs(t.y - s.y);
    const controlPointOffset = deltaY * 0.5;
    
    return `M ${s.x} ${s.y} C ${s.x} ${s.y + controlPointOffset}, ${t.x} ${t.y - controlPointOffset}, ${t.x} ${t.y}`;
  };

  // --- Event Handlers ---

  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.5, scale - e.deltaY * zoomSensitivity), 2);
      setScale(newScale);
    } else {
       // Optional: Panning with trackpad
       setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (e.button === 0 && !draggingNode) { // Left click only
      setIsDraggingCanvas(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleNodeMouseDown = (e, nodeId) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
    setSelectedNode(nodeId);
  };

  const handleMouseMove = (e) => {
    if (draggingNode) {
      const deltaX = e.movementX / scale;
      const deltaY = e.movementY / scale;
      
      setNodes(nds => nds.map(n => {
        if (n.id === draggingNode) {
          return { ...n, x: n.x + deltaX, y: n.y + deltaY };
        }
        return n;
      }));
    } else if (isDraggingCanvas) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingCanvas(false);
    setDraggingNode(null);
    setIsDraggingCodeViewer(false);
  };

  const handleCodeViewerMouseDown = (e) => {
    e.stopPropagation();
    setIsDraggingCodeViewer(true);
    setCodeViewerDragStart({
      x: e.clientX - codeViewerPos.x,
      y: e.clientY - codeViewerPos.y
    });
  };

  const handleCodeViewerMouseMove = (e) => {
    if (isDraggingCodeViewer) {
      setCodeViewerPos({
        x: e.clientX - codeViewerDragStart.x,
        y: e.clientY - codeViewerDragStart.y
      });
    }
  };

  useEffect(() => {
    if (isDraggingCodeViewer) {
      window.addEventListener('mousemove', handleCodeViewerMouseMove);
      window.addEventListener('mouseup', () => setIsDraggingCodeViewer(false));
      return () => {
        window.removeEventListener('mousemove', handleCodeViewerMouseMove);
        window.removeEventListener('mouseup', () => setIsDraggingCodeViewer(false));
      };
    }
  }, [isDraggingCodeViewer, codeViewerDragStart]);

  // --- Render Helpers ---

  const getNodeIcon = (type) => {
    switch(type) {
      case 'start': return <Play size={16} />;
      case 'end': return <Square size={16} />;
      case 'decision': return <GitBranch size={16} />;
      case 'io': return <Type size={16} />;
      default: return <ChevronRight size={16} />;
    }
  };

  return (
    <div className="flowchart-app">
      <style>{`
        .flowchart-app {
          display: flex;
          flex-direction: column;
          height: 100vh;
          width: 100%;
          background-color: #050309;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          overflow: hidden;
          color: #e2e8f0;
        }

        /* Toolbar */
        .toolbar {
          height: 60px;
          background: #0a0612;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          padding: 0 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          z-index: 10;
          justify-content: space-between;
        }
        .toolbar-title {
          font-weight: 600;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #e2e8f0;
        }
        .toolbar-controls {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
          color: #cbd5e1;
        }
        .btn:hover { background: rgba(168,85,247,0.15); border-color: rgba(168,85,247,0.3); color: #e9d5ff; }
        .btn:active { background: rgba(168,85,247,0.25); }
        
        /* Canvas Area */
        .canvas-container {
          flex: 1;
          position: relative;
          overflow: hidden;
          cursor: grab;
          background-image: radial-gradient(rgba(168,85,247,0.1) 1px, transparent 1px);
          background-size: 20px 20px;
          background-color: #0c0915;
        }
        .canvas-container:active {
          cursor: grabbing;
        }

        /* The scalable world */
        .transform-layer {
          transform-origin: 0 0;
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none; /* Let clicks pass to children */
        }
        
        /* Allow pointer events on actual interactive elements inside the transform layer */
        .transform-layer > * {
          pointer-events: auto;
        }

        /* SVG Connections Layer */
        .connections-layer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
        }
        .connection-path {
          fill: none;
          stroke: rgba(148,163,184,0.3);
          stroke-width: 2px;
          transition: stroke 0.3s;
        }
        .connection-path.active {
          stroke: #a855f7;
          stroke-width: 3px;
        }
        .connection-label {
          font-size: 12px;
          fill: #cbd5e1;
          background: transparent;
          padding: 2px 4px;
        }

        /* Node Styles */
        .node {
          position: absolute;
          background: rgba(30,22,41,0.8);
          border-radius: 8px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
          width: 180px;
          padding: 12px;
          border: 2px solid rgba(255,255,255,0.1);
          cursor: pointer;
          transition: box-shadow 0.2s, transform 0.1s, border-color 0.2s;
          z-index: 2;
          user-select: none;
          backdrop-filter: blur(10px);
        }
        .node:hover {
          box-shadow: 0 10px 15px -3px rgba(168,85,247,0.2), 0 4px 6px -2px rgba(168,85,247,0.1);
          z-index: 3;
          border-color: rgba(168,85,247,0.3);
        }
        .node.selected {
          border-color: #a855f7;
          box-shadow: 0 0 0 2px rgba(168,85,247,0.2);
        }

        /* Node Types */
        .node-start, .node-end {
          border-radius: 50px; /* Pill shape */
          border-color: rgba(16,185,129,0.5);
          background: rgba(16,185,129,0.08);
          text-align: center;
        }
        .node-start .node-header, .node-end .node-header {
          justify-content: center;
          color: #6ee7b7;
        }
        .node-end {
          border-color: rgba(239,68,68,0.5);
          background: rgba(239,68,68,0.08);
        }
        .node-end .node-header {
          color: #fca5a5;
        }
        .node-decision {
          /* Rhombus visually simulated via border/colors since rotation is messy with text */
          border-color: rgba(251,191,36,0.5);
          background: rgba(251,191,36,0.08);
          width: 140px; /* Slightly smaller */
          clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%); /* Diamond shape */
          height: 100px; /* Force height for diamond */
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px 5px; 
        }
        /* Fix text in diamond */
        .node-decision .node-content {
          font-size: 0.75rem;
          line-height: 1.2;
          color: #fde68a;
        }
        
        .node-process {
          border-left: 4px solid #a855f7;
        }
        .node-io {
           border-left: 4px solid #c084fc;
           transform: skew(-10deg); /* Parallelogram for I/O */
        }
        .node-io > * {
           transform: skew(10deg); /* Unskew content */
        }

        .node-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          color: #94a3b8;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .node-content {
          font-family: 'Fira Code', 'Consolas', monospace;
          background: rgba(0,0,0,0.3);
          padding: 6px;
          border-radius: 4px;
          font-size: 0.8rem;
          color: #cbd5e1;
          white-space: pre-wrap;
          overflow: hidden;
        }
        .node-decision .node-content {
           background: transparent;
           font-weight: bold;
           color: #fde68a;
        }

        /* Sidebar Overlay */
        .details-panel {
          position: absolute;
          right: 20px;
          top: 80px;
          width: 300px;
          background: rgba(10,6,18,0.95);
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3);
          padding: 20px;
          border: 1px solid rgba(168,85,247,0.3);
          z-index: 20;
          animation: slideIn 0.3s ease-out;
          backdrop-filter: blur(10px);
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .panel-header {
          font-size: 1.2rem;
          font-weight: bold;
          margin-bottom: 15px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 10px;
          color: #e9d5ff;
        }
        .panel-row {
          margin-bottom: 15px;
        }
        .panel-label {
          font-size: 0.75rem;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 5px;
          font-weight: 600;
        }
        .code-block {
          background: rgba(0,0,0,0.4);
          color: #cbd5e1;
          padding: 10px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 0.9rem;
          white-space: pre-wrap;
          border: 1px solid rgba(255,255,255,0.1);
        }

        /* Code Viewer Panel */
        .code-viewer {
          position: fixed;
          width: 450px;
          max-width: 90vw;
          max-height: 70vh;
          background: rgba(10,6,18,0.98);
          border: 1px solid rgba(168,85,247,0.4);
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 10px 10px -5px rgba(0, 0, 0, 0.4);
          z-index: 100;
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(10px);
          animation: fadeInScale 0.2s ease-out;
        }
        @keyframes fadeInScale {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .code-viewer-header {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: move;
          background: rgba(168,85,247,0.1);
          border-radius: 12px 12px 0 0;
          user-select: none;
        }
        .code-viewer-header:active {
          cursor: grabbing;
        }
        .code-viewer-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.95rem;
          color: #e9d5ff;
        }
        .code-viewer-content {
          padding: 16px;
          overflow-y: auto;
          flex: 1;
          font-family: 'Fira Code', 'Consolas', monospace;
          font-size: 0.85rem;
          line-height: 1.6;
          color: #cbd5e1;
        }
        .code-viewer-content pre {
          margin: 0;
          white-space: pre-wrap;
          word-wrap: break-word;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: all 0.2s;
        }
        .close-btn:hover {
          background: rgba(255,255,255,0.1);
          color: #e9d5ff;
        }

      `}</style>

      {/* Header */}
      <div className="toolbar">
        <div className="toolbar-title">
          <GitBranch color="#3498db" />
          <span>CodeMap Viewer</span>
        </div>
        <div className="toolbar-controls">
           <div className="btn" onClick={() => setShowCodeViewer(!showCodeViewer)} style={{ 
             background: showCodeViewer ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)'
           }}>
             <Code size={14}/> {showCodeViewer ? 'Hide' : 'Show'} Code
           </div>
           <div className="btn" onClick={() => { setScale(1); setPan({x:0, y:0}); }}>
             <Move size={14}/> Reset View
           </div>
           <div className="btn" onClick={() => setScale(s => Math.max(0.5, s - 0.1))}>
             <ZoomOut size={14}/>
           </div>
           <span style={{minWidth: '40px', textAlign: 'center', fontSize: '0.9rem'}}>
             {Math.round(scale * 100)}%
           </span>
           <div className="btn" onClick={() => setScale(s => Math.min(2, s + 0.1))}>
             <ZoomIn size={14}/>
           </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div 
        className="canvas-container"
        ref={containerRef}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div 
          className="transform-layer"
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})` 
          }}
        >
          {/* Edges Layer */}
          <svg className="connections-layer" style={{ width: 4000, height: 4000 }}>
            <defs>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="rgba(148,163,184,0.3)" />
              </marker>
              <marker id="arrowhead-active" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#a855f7" />
              </marker>
            </defs>
            {edges.map(edge => {
              const source = nodes.find(n => n.id === edge.source);
              const target = nodes.find(n => n.id === edge.target);
              if (!source || !target) return null;
              
              const isConnectedToSelected = selectedNode === edge.source || selectedNode === edge.target;
              const pathD = calculatePath(source, target);
              
              // Calculate midpoint for label
              const sCenter = getNodeCenter(source);
              const tCenter = getNodeCenter(target);
              const midX = (sCenter.x + tCenter.x) / 2;
              const midY = (sCenter.y + tCenter.y) / 2;

              return (
                <g key={edge.id}>
                  <path 
                    d={pathD} 
                    className={`connection-path ${isConnectedToSelected ? 'active' : ''}`}
                    markerEnd={`url(#${isConnectedToSelected ? 'arrowhead-active' : 'arrowhead'})`}
                  />
                  {edge.label && (
                    <g transform={`translate(${midX}, ${midY})`}>
                       <rect x="-15" y="-10" width="30" height="20" fill="rgba(10,6,18,0.9)" rx="4" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
                       <text x="0" y="5" textAnchor="middle" fontSize="10" fill="#cbd5e1" fontWeight="bold">
                         {edge.label}
                       </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Nodes Layer */}
          {nodes.map(node => (
            <div
              key={node.id}
              className={`node node-${node.type} ${selectedNode === node.id ? 'selected' : ''}`}
              style={{ left: node.x, top: node.y }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              {node.type !== 'decision' && (
                <div className="node-header">
                  {getNodeIcon(node.type)}
                  <span>{node.label}</span>
                </div>
              )}
              <div className="node-content">
                {node.code}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Details Panel - only if a node is selected */}
      {selectedNode && (
        <div className="details-panel">
          {(() => {
            const node = nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            return (
              <>
                <div className="panel-header">
                  {node.label}
                </div>
                <div className="panel-row">
                  <div className="panel-label">Node Type</div>
                  <div style={{ textTransform: 'capitalize' }}>{node.type}</div>
                </div>
                <div className="panel-row">
                  <div className="panel-label">Execution Code</div>
                  <div className="code-block">
                    {node.code}
                  </div>
                </div>
                <div className="panel-row">
                  <div className="panel-label">Description</div>
                  <div style={{ fontSize: '0.9rem', color: '#94a3b8' }}>
                     This node represents a <strong style={{ color: '#e9d5ff' }}>{node.type}</strong> step in the algorithm. 
                     {node.type === 'decision' ? ' It evaluates a boolean expression to branch execution.' : ' It executes a sequential instruction.'}
                  </div>
                </div>
                <button className="btn" style={{width: '100%', justifyContent: 'center'}} onClick={() => setSelectedNode(null)}>
                  Close Details
                </button>
              </>
            );
          })()}
        </div>
      )}
      {/* Code Viewer Panel */}
      {showCodeViewer && (
        <div 
          className="code-viewer"
          style={{
            left: `${codeViewerPos.x}px`,
            top: `${codeViewerPos.y}px`
          }}
        >
          <div 
            className="code-viewer-header"
            onMouseDown={handleCodeViewerMouseDown}
          >
            <div className="code-viewer-title">
              <Code size={16} color="#a855f7" />
              <span>Current Editor Code</span>
            </div>
            <button className="close-btn" onClick={() => setShowCodeViewer(false)}>
              <X size={18} />
            </button>
          </div>
          <div className="code-viewer-content">
            <pre>{editorCode || '# No code in editor yet...'}</pre>
          </div>
        </div>
      )}    </div>
  );
}