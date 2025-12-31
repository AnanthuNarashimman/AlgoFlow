import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, Square, Type, GitBranch, CheckCircle, XCircle, ChevronRight, ZoomIn, ZoomOut, Move, Code, X } from 'lucide-react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
  Handle,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Custom Diamond Node for Decision
const DiamondNode = ({ data }) => {
  return (
    <div style={{
      width: '160px',
      height: '160px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>
      {/* Connection handles - properly using React Flow Handle component */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: '#a855f7',
          width: '8px',
          height: '8px',
          border: '2px solid #0c0915',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#a855f7',
          width: '8px',
          height: '8px',
          border: '2px solid #0c0915',
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{
          background: '#a855f7',
          width: '8px',
          height: '8px',
          border: '2px solid #0c0915',
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: '#a855f7',
          width: '8px',
          height: '8px',
          border: '2px solid #0c0915',
        }}
      />
      
      <div style={{
        width: '140px',
        height: '140px',
        background: 'rgba(251,191,36,0.15)',
        border: '2px solid rgba(251,191,36,0.6)',
        transform: 'rotate(45deg)',
        position: 'absolute',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(251,191,36,0.2)',
      }} />
      <div style={{
        position: 'relative',
        zIndex: 1,
        padding: '20px',
        textAlign: 'center',
        color: '#fde68a',
        fontSize: '13px',
        fontWeight: 600,
        maxWidth: '100px',
        wordWrap: 'break-word',
      }}>
        {data.label}
      </div>
    </div>
  );
};

// Custom Rounded Node for Input/Output
const RoundedNode = ({ data }) => {
  const nodeStyle = data.style || {};
  return (
    <div style={{
      background: nodeStyle.background,
      border: nodeStyle.border,
      borderRadius: '50px',
      padding: '12px 24px',
      color: nodeStyle.color,
      fontSize: '13px',
      fontWeight: 500,
      textAlign: 'center',
      minWidth: '120px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      position: 'relative',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#a855f7', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#a855f7', width: '8px', height: '8px' }}
      />
      {data.label}
    </div>
  );
};

// Custom Default Node
const DefaultNode = ({ data }) => {
  const nodeStyle = data.style || {};
  return (
    <div style={{
      background: nodeStyle.background || 'rgba(30,22,41,0.9)',
      border: nodeStyle.border || '2px solid rgba(168,85,247,0.3)',
      borderRadius: '8px',
      padding: '12px 16px',
      color: nodeStyle.color || '#e2e8f0',
      fontSize: '13px',
      minWidth: '180px',
      maxWidth: '220px',
      fontFamily: "'Consolas', monospace",
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      position: 'relative',
    }}>
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#a855f7', width: '8px', height: '8px' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#a855f7', width: '8px', height: '8px' }}
      />
      {data.label}
    </div>
  );
};

export default function CodeFlowchartViewer({ flowchartData, isLoading }) {
  const [isMobile, setIsMobile] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [codeViewerPos, setCodeViewerPos] = useState({ x: 50, y: 100 });
  const [isDraggingCodeViewer, setIsDraggingCodeViewer] = useState(false);
  const [codeViewerDragStart, setCodeViewerDragStart] = useState({ x: 0, y: 0 });
  const [editorCode, setEditorCode] = useState('');

  const containerRef = useRef(null);

  // Define custom node types
  const nodeTypes = useMemo(() => ({
    decision: DiamondNode,
    rounded: RoundedNode,
    default: DefaultNode,
  }), []);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load editor code from localStorage
  useEffect(() => {
    const loadCode = () => {
      const savedCode = localStorage.getItem('algoflow_code');
      if (savedCode) {
        setEditorCode(savedCode);
      }
    };

    loadCode();
    const interval = setInterval(loadCode, 500);
    return () => clearInterval(interval);
  }, []);

  // Convert backend data to React Flow format with proper branching layout
  useEffect(() => {
    if (flowchartData && flowchartData.nodes && flowchartData.edges) {
      // Build adjacency map to understand the graph structure
      const edgeMap = {};
      flowchartData.edges.forEach(edge => {
        if (!edgeMap[edge.source]) edgeMap[edge.source] = [];
        edgeMap[edge.source].push({ target: edge.target, label: edge.label });
      });

      // Calculate positions with branching support
      const positions = {};
      const nodeById = {};
      flowchartData.nodes.forEach(node => {
        nodeById[node.id] = node;
      });

      let yOffset = 80;
      const centerX = 400;
      const branchOffset = 300; // Horizontal offset for branches
      const verticalSpacing = 150;

      // BFS layout with branch detection
      const visited = new Set();
      const queue = [{ id: flowchartData.nodes[0].id, x: centerX, depth: 0 }];
      while (queue.length > 0) {
        const { id, x, depth } = queue.shift();
        if (visited.has(id)) continue;
        visited.add(id);
        positions[id] = { x, y: yOffset };
        yOffset += verticalSpacing;

        const children = edgeMap[id] || [];
        const currentNode = nodeById[id];

        // If this is a decision node with multiple children, branch them horizontally
        if (currentNode && currentNode.type === 'decision' && children.length >= 2) {
          // Sort children by label (True/False) for consistent positioning
          const sortedChildren = children.sort((a, b) => {
            if (a.label === 'True' || a.label === 'true') return 1; // True goes right
            if (b.label === 'True' || b.label === 'true') return -1;
            return 0;
          });

          sortedChildren.forEach((child, index) => {
            if (index === 0) {
              // First branch (usually False) - go left
              queue.push({ id: child.target, x: x - branchOffset, depth: depth + 1 });
            } else {
              // Second branch (usually True) - go right
              queue.push({ id: child.target, x: x + branchOffset, depth: depth + 1 });
            }
          });
        } else {
          // Normal sequential flow - stay centered
          children.forEach(child => {
            queue.push({ id: child.target, x, depth: depth + 1 });
          });
        }
      }

      // Create React Flow nodes with calculated positions
      const flowNodes = flowchartData.nodes.map((node) => {
        let nodeType = 'default';
        let style = {
          background: 'rgba(30,22,41,0.9)',
          color: '#e2e8f0',
          border: '2px solid rgba(168,85,247,0.3)',
        };

        // Customize type and styles based on node type
        if (node.type === 'input') {
          nodeType = 'rounded';
          style.background = 'rgba(16,185,129,0.15)';
          style.border = '2px solid rgba(16,185,129,0.6)';
          style.color = '#6ee7b7';
        } else if (node.type === 'output') {
          nodeType = 'rounded';
          style.background = 'rgba(239,68,68,0.15)';
          style.border = '2px solid rgba(239,68,68,0.6)';
          style.color = '#fca5a5';
        } else if (node.type === 'decision') {
          nodeType = 'decision';
          // Decision styling is handled in DiamondNode component
        }

        return {
          id: node.id,
          type: nodeType,
          data: { 
            label: node.data.label,
            style: style
          },
          position: positions[node.id] || { x: centerX, y: 0 },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };
      });

      const flowEdges = flowchartData.edges.map(edge => {
        // Determine source and target positions for better edge routing
        const sourceNode = nodeById[edge.source];
        const targetNode = nodeById[edge.target];
        
        let sourceHandle = 'bottom';
        
        // For decision nodes, route edges to left/right based on label
        if (sourceNode && sourceNode.type === 'decision') {
          const sourcePos = positions[edge.source];
          const targetPos = positions[edge.target];
          
          if (targetPos && sourcePos) {
            if (targetPos.x < sourcePos.x) {
              sourceHandle = 'left';
            } else if (targetPos.x > sourcePos.x) {
              sourceHandle = 'right';
            } else {
              sourceHandle = 'bottom';
            }
          }
        }

        return {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: sourceHandle,
          label: edge.label || '',
          type: 'smoothstep',
          animated: edge.label ? true : false,
          style: { 
            stroke: edge.label ? '#a855f7' : 'rgba(168,85,247,0.6)',
            strokeWidth: 2.5
          },
          labelStyle: { 
            fill: '#e9d5ff', 
            fontSize: 12, 
            fontWeight: 700,
          },
          labelBgStyle: { 
            fill: 'rgba(10,6,18,0.95)', 
            fillOpacity: 0.95 
          },
          labelBgPadding: [8, 6],
          labelBgBorderRadius: 6,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: edge.label ? '#a855f7' : 'rgba(168,85,247,0.6)',
          },
        };
      });

      setNodes(flowNodes);
      setEdges(flowEdges);
    }
  }, [flowchartData, setNodes, setEdges]);

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

  // Mobile Warning Screen
  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        backgroundColor: '#050309',
        padding: '20px',
        textAlign: 'center',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}>
        <GitBranch
          size={64}
          color="#a855f7"
          style={{ marginBottom: '24px' }}
        />
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#e2e8f0',
          marginBottom: '16px',
          letterSpacing: '0.05em'
        }}>
          FLOWCHART VISUALIZER
        </h1>
        <p style={{
          fontSize: '16px',
          color: '#94a3b8',
          marginBottom: '12px',
          lineHeight: '1.6',
          maxWidth: '400px'
        }}>
          Please use a laptop or desktop computer to access the Flowchart Visualizer.
        </p>
        <p style={{
          fontSize: '14px',
          color: '#64748b',
          lineHeight: '1.6',
          maxWidth: '400px'
        }}>
          Our flowchart visualization tools are optimized for larger screens to provide you with the best viewing experience.
        </p>
        <div style={{
          marginTop: '32px',
          padding: '12px 24px',
          borderRadius: '8px',
          border: '1px solid rgba(168,85,247,0.3)',
          backgroundColor: 'rgba(168,85,247,0.1)',
          fontSize: '13px',
          color: '#a855f7'
        }}>
          Minimum screen width: 1024px
        </div>
      </div>
    );
  }

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
          background: transparent;
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

        /* React Flow Controls Styling */
        .react-flow__controls {
          background: rgba(10,6,18,0.95) !important;
          border: 1px solid rgba(168,85,247,0.4) !important;
          border-radius: 8px !important;
          overflow: hidden !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .react-flow__controls-button {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid rgba(168,85,247,0.2) !important;
          color: #cbd5e1 !important;
          transition: all 0.2s !important;
          width: 32px !important;
          height: 32px !important;
        }
        .react-flow__controls-button:hover {
          background: rgba(168,85,247,0.2) !important;
          color: #e9d5ff !important;
        }
        .react-flow__controls-button:last-child {
          border-bottom: none !important;
        }
        .react-flow__controls-button svg {
          fill: currentColor !important;
          width: 16px !important;
          height: 16px !important;
        }

        /* React Flow MiniMap Styling */
        .react-flow__minimap {
          background: rgba(10,6,18,0.95) !important;
          border: 2px solid rgba(168,85,247,0.5) !important;
          border-radius: 8px !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .react-flow__minimap-mask {
          fill: rgba(5,3,9,0.7) !important;
        }
        .react-flow__minimap-node {
          fill: rgba(168,85,247,0.6) !important;
        }

        /* Fix React Flow default node backgrounds */
        .react-flow__node {
          background: transparent !important;
        }
        .react-flow__node-default {
          background: transparent !important;
          padding: 0 !important;
          border: none !important;
        }

      `}</style>

      {/* Header */}
      <div className="toolbar">
        <div className="toolbar-title">
          <GitBranch color="#a855f7" />
          <span>Algorithm Flowchart</span>
        </div>
        <div className="toolbar-controls">
           <div className="btn" onClick={() => setShowCodeViewer(!showCodeViewer)} style={{ 
             background: showCodeViewer ? 'rgba(168,85,247,0.2)' : 'rgba(255,255,255,0.05)'
           }}>
             <Code size={14}/> {showCodeViewer ? 'Hide' : 'Show'} Code
           </div>
           {flowchartData?.meta && (
             <div style={{ 
               display: 'flex', 
               gap: '12px', 
               fontSize: '0.85rem', 
               color: '#94a3b8',
               padding: '0 12px',
               borderLeft: '1px solid rgba(255,255,255,0.1)'
             }}>
               <span>Time: <strong style={{color: '#e9d5ff'}}>{flowchartData.meta.timeComplexity}</strong></span>
               <span>Space: <strong style={{color: '#e9d5ff'}}>{flowchartData.meta.spaceComplexity}</strong></span>
             </div>
           )}
        </div>
      </div>

      {/* Main Canvas */}
      <div className="canvas-container" ref={containerRef}>
        {isLoading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '16px'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              border: '4px solid rgba(168,85,247,0.2)',
              borderTop: '4px solid #a855f7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Analyzing your code...</p>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        ) : !flowchartData ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            gap: '12px',
            color: '#64748b'
          }}>
            <GitBranch size={48} color="#475569" />
            <p style={{ fontSize: '14px' }}>Click "Visualize" to generate flowchart</p>
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={4}
            defaultEdgeOptions={{
              type: 'default',
              animated: false,
            }}
            style={{ background: '#0c0915' }}
          >
            <Background
              variant="dots"
              color="#a855f7"
              gap={20}
              size={3}
              style={{ opacity: 0.35 }}
            />
            <Controls
              showInteractive={false}
              position="bottom-left"
              style={{
                background: 'rgba(10,6,18,0.95)',
                border: '1px solid rgba(168,85,247,0.4)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                bottom: '100px',
                left: '20px',
              }}
            />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === 'decision') return 'rgba(251,191,36,0.8)';
                if (node.type === 'rounded') {
                  const label = node.data.label.toLowerCase();
                  if (label.includes('start')) return 'rgba(16,185,129,0.8)';
                  return 'rgba(239,68,68,0.8)';
                }
                return 'rgba(168,85,247,0.6)';
              }}
              maskColor="rgba(5,3,9,0.7)"
              position="bottom-right"
              style={{
                background: 'rgba(10,6,18,0.95)',
                border: '2px solid rgba(168,85,247,0.5)',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                height: 120,
                width: 180,
                bottom: '100px',
                right: '20px',
              }}
            />
          </ReactFlow>
        )}
      </div>

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