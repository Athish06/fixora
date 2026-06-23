import React, { useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  Panel,
  useReactFlow,
  getNodesBounds,
  getViewportForBounds
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import dagre from 'dagre';
import { AlertTriangle, Code, PlayCircle, Download } from 'lucide-react';
import { Badge } from '../ui/badge';
import { toPng, toSvg } from 'html-to-image';

// DAGRE layout setup
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 260;
const nodeHeight = 100;

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const newNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const newNode = {
      ...node,
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      // Shift to center
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
    return newNode;
  });

  return { nodes: newNodes, edges };
};

// Custom Node Component
const CustomASTNode = ({ data }) => {
  const { label, type, is_sink, category, note } = data;

  let borderColor = 'border-border/50';
  let bgColor = 'bg-card';
  let shadow = 'shadow-sm dark:shadow-none';
  let icon = <Code className="w-4 h-4 text-muted-foreground/60" />;

  if (is_sink) {
    if (category === 'Name Match' || category === 'Import Resolved' || category === 'Builtin') {
      borderColor = 'border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)] dark:shadow-[0_0_15px_rgba(239,68,68,0.3)]';
      bgColor = 'bg-red-50 dark:bg-red-500/10';
      shadow = '';
      icon = <AlertTriangle className="w-4 h-4 text-red-500" />;
    } else {
      borderColor = 'border-orange-500/40 shadow-[0_0_15px_rgba(249,115,22,0.2)] dark:shadow-[0_0_15px_rgba(249,115,22,0.3)]';
      bgColor = 'bg-orange-50 dark:bg-orange-500/10';
      shadow = '';
      icon = <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  } else if (type === 'Call') {
    borderColor = 'border-blue-500/30';
    bgColor = 'bg-blue-50 dark:bg-blue-500/5';
    icon = <PlayCircle className="w-4 h-4 text-blue-500" />;
  }

  return (
    <div
      className={`min-w-[200px] max-w-[280px] p-3 rounded-lg border ${borderColor} ${bgColor} ${shadow} backdrop-blur-sm transition-all`}
    >
      <Handle type="target" position={Position.Top} className="!bg-muted-foreground" />
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground bg-black/40">
          {type}
        </Badge>
      </div>
      <div className="text-sm font-semibold text-primary font-mono truncate" title={label}>
        {label}
      </div>
      {note && (
        <p className="text-[10px] text-muted-foreground mt-2 leading-tight line-clamp-3" title={note}>
          {note}
        </p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-muted-foreground" />
    </div>
  );
};

const nodeTypes = {
  astNode: CustomASTNode,
};

function DownloadPanel() {
  const { getNodes } = useReactFlow();

  const downloadImage = (format) => {
    const nodesBounds = getNodesBounds(getNodes());
    // Adding 100px padding around the tree
    const imageWidth = nodesBounds.width + 100;
    const imageHeight = nodesBounds.height + 100;

    const transform = getViewportForBounds(
      nodesBounds,
      imageWidth,
      imageHeight,
      0.5,
      2
    );

    const viewport = document.querySelector('.react-flow__viewport');
    if (!viewport) return;

    const func = format === 'png' ? toPng : toSvg;

    func(viewport, {
      backgroundColor: document.documentElement.classList.contains('dark') ? '#020817' : '#f8fafc',
      width: imageWidth,
      height: imageHeight,
      style: {
        width: `${imageWidth}px`,
        height: `${imageHeight}px`,
        transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.zoom})`,
      },
    }).then((dataUrl) => {
      const a = document.createElement('a');
      a.setAttribute('download', `fixora-ast.${format}`);
      a.setAttribute('href', dataUrl);
      a.click();
    }).catch((err) => {
      console.error('Failed to export image', err);
    });
  };

  return (
    <Panel position="top-right" className="flex gap-2">
      <button 
        onClick={() => downloadImage('png')}
        className="bg-card border border-border/50 text-xs font-semibold py-1.5 px-3 rounded-md shadow-sm hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5" /> PNG
      </button>
      <button 
        onClick={() => downloadImage('svg')}
        className="bg-card border border-border/50 text-xs font-semibold py-1.5 px-3 rounded-md shadow-sm hover:bg-muted text-foreground transition-colors flex items-center gap-1.5"
      >
        <Download className="w-3.5 h-3.5" /> SVG
      </button>
    </Panel>
  );
}

const ReactFlowAST = ({ treeData }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (!treeData) return;

    const initialNodes = [];
    const initialEdges = [];

    // Recursive function to flatten the tree into nodes and edges
    const flattenTree = (node, parentId = null) => {
      if (!node) return;

      const nodeId = node.id;
      
      initialNodes.push({
        id: nodeId,
        type: 'astNode',
        data: {
          label: node.label,
          type: node.type,
          is_sink: node.is_sink,
          confidence: node.confidence,
          category: node.category,
          note: node.note,
        },
        position: { x: 0, y: 0 }, // Will be set by dagre
      });

      if (parentId) {
        initialEdges.push({
          id: `e-${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          animated: node.is_sink, // Animate paths leading to sinks
          style: { stroke: node.is_sink ? '#ef4444' : '#64748b' },
        });
      }

      if (node.children && node.children.length > 0) {
        node.children.forEach((child) => flattenTree(child, nodeId));
      }
    };

    flattenTree(treeData);

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [treeData, setNodes, setEdges]);

  return (
    <div className="w-full h-full border border-border/50 rounded-xl overflow-hidden bg-muted/20 dark:bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-right"
      >
        <Background color="#888" gap={16} className="opacity-20 dark:opacity-40" />
        <Controls />
        <DownloadPanel />
      </ReactFlow>
    </div>
  );
};

export default ReactFlowAST;
