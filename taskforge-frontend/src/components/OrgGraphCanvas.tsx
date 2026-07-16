import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { GraphNode, AGENT_LABELS } from '../types';
import { layoutTree, flattenTree, treeBounds, LayoutNode } from '../lib/treeLayout';

const NODE_COLORS: Record<string, { fill: string; ring: string; text: string }> = {
  organization: { fill: '#1E1B4B', ring: '#6366F1', text: '#C7D2FE' },
  department:   { fill: '#1E293B', ring: '#818CF8', text: '#C7D2FE' },
  team:         { fill: '#172033', ring: '#38BDF8', text: '#BAE6FD' },
  member:       { fill: '#111113', ring: '#3F3F46', text: '#E4E4E7' },
};

const STATUS_COLOR: Record<string, string> = { online: '#22C55E', idle: '#F59E0B', offline: '#52525B' };

interface Props {
  nodes: GraphNode[];
  onSelectMember: (node: GraphNode) => void;
}

export default function OrgGraphCanvas({ nodes, onSelectMember }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, w: 1000, h: 700 });
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tree = useMemo(() => layoutTree(nodes), [nodes]);
  const flat = useMemo(() => (tree ? flattenTree(tree) : []), [tree]);
  const bounds = useMemo(() => (flat.length ? treeBounds(flat) : { minX: 0, maxX: 0, minY: 0, maxY: 0 }), [flat]);

  useEffect(() => {
    if (!flat.length) return;
    const width = bounds.maxX - bounds.minX + 400;
    const height = bounds.maxY - bounds.minY + 300;
    setViewBox({ x: bounds.minX - 200, y: bounds.minY - 120, w: width, h: height });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes.length]);

  const clientToSvgDelta = useCallback((dx: number, dy: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return { x: (dx / rect.width) * viewBox.w, y: (dy / rect.height) * viewBox.h };
  }, [viewBox.w, viewBox.h]);

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, vx: viewBox.x, vy: viewBox.y };
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging || !dragStart.current) return;
    const delta = clientToSvgDelta(e.clientX - dragStart.current.x, e.clientY - dragStart.current.y);
    setViewBox(v => ({ ...v, x: dragStart.current!.vx - delta.x, y: dragStart.current!.vy - delta.y }));
  }
  function onMouseUp() { setDragging(false); dragStart.current = null; }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cursorX = viewBox.x + ((e.clientX - rect.left) / rect.width) * viewBox.w;
    const cursorY = viewBox.y + ((e.clientY - rect.top) / rect.height) * viewBox.h;
    const zoomFactor = e.deltaY > 0 ? 1.12 : 1 / 1.12;
    const newW = Math.min(Math.max(viewBox.w * zoomFactor, 300), 4000);
    const newH = Math.min(Math.max(viewBox.h * zoomFactor, 210), 2800);
    const newX = cursorX - ((cursorX - viewBox.x) / viewBox.w) * newW;
    const newY = cursorY - ((cursorY - viewBox.y) / viewBox.h) * newH;
    setViewBox({ x: newX, y: newY, w: newW, h: newH });
  }

  /** Smoothly zooms toward a node — driven by a real animation loop over viewBox values. */
  function animateViewBox(end: { x: number; y: number; w: number; h: number }, duration = 480) {
    const start = { ...viewBox };
    const startTime = performance.now();
    function step(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setViewBox({
        x: start.x + (end.x - start.x) * eased,
        y: start.y + (end.y - start.y) * eased,
        w: start.w + (end.w - start.w) * eased,
        h: start.h + (end.h - start.h) * eased,
      });
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function zoomToNode(node: LayoutNode, targetW: number, targetH: number) {
    animateViewBox({ x: node.x - targetW / 2, y: node.y - targetH / 2, w: targetW, h: targetH });
  }

  function resetView() {
    if (!flat.length) return;
    const width = bounds.maxX - bounds.minX + 400;
    const height = bounds.maxY - bounds.minY + 300;
    animateViewBox({ x: bounds.minX - 200, y: bounds.minY - 120, w: width, h: height }, 420);
  }

  function handleNodeClick(node: LayoutNode) {
    setSelectedId(node.id);
    if (node.type === 'member') {
      onSelectMember(node);
    } else {
      const size = node.type === 'organization' ? [1400, 900] : node.type === 'department' ? [900, 600] : [600, 420];
      zoomToNode(node, size[0], size[1]);
    }
  }

  const edges: { from: LayoutNode; to: LayoutNode }[] = [];
  flat.forEach(n => n.children.forEach(c => edges.push({ from: n, to: c })));

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden select-none"
         style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 20%, rgba(99,102,241,0.06) 0%, transparent 70%), #050507', border: '1px solid #1F1F23' }}>
      <svg
        ref={svgRef}
        viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
        className="w-full h-full"
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      >
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          {Object.keys(NODE_COLORS).map(type => (
            <filter key={type} id={`glow-${type}`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          ))}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#141417" strokeWidth="1" />
          </pattern>
        </defs>

        <rect x={viewBox.x - 2000} y={viewBox.y - 2000} width={viewBox.w + 4000} height={viewBox.h + 4000} fill="url(#grid)" />

        {edges.map(({ from, to }) => (
          <path
            key={`${from.id}-${to.id}`}
            d={`M ${from.x} ${from.y + 26} C ${from.x} ${(from.y + to.y) / 2}, ${to.x} ${(from.y + to.y) / 2}, ${to.x} ${to.y - 26}`}
            fill="none"
            stroke={hoveredId === from.id || hoveredId === to.id ? '#818CF8' : '#27272A'}
            strokeWidth={hoveredId === from.id || hoveredId === to.id ? 1.6 : 1}
            className="transition-all duration-200"
          />
        ))}

        {flat.map(node => {
          const colors = NODE_COLORS[node.type];
          const isMember = node.type === 'member';
          const radius = node.type === 'organization' ? 34 : node.type === 'department' ? 28 : node.type === 'team' ? 24 : 20;
          const isHovered = hoveredId === node.id;
          const isSelected = selectedId === node.id;

          return (
            <g key={node.id}
               transform={`translate(${node.x}, ${node.y})`}
               onMouseEnter={() => setHoveredId(node.id)}
               onMouseLeave={() => setHoveredId(null)}
               onClick={(e) => { e.stopPropagation(); handleNodeClick(node); }}
               style={{ cursor: 'pointer' }}>

              {isHovered && <circle r={radius + 10} fill="url(#nodeGlow)" />}

              <circle r={radius}
                      fill={colors.fill}
                      stroke={node.isAi ? '#22D3EE' : colors.ring}
                      strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.4}
                      filter={isHovered ? `url(#glow-${node.type})` : undefined}
                      className="transition-all duration-200" />

              {isMember && node.status && (
                <circle cx={radius - 4} cy={radius - 4} r={4} fill={STATUS_COLOR[node.status]} stroke="#050507" strokeWidth={1.5} />
              )}

              {node.isAi && (
                <text textAnchor="middle" dy="4" fontSize="10" fontWeight="700" fill="#22D3EE">
                  {(AGENT_LABELS[node.agentType || ''] || 'AI').slice(0, 2).toUpperCase()}
                </text>
              )}
              {!node.isAi && isMember && (
                <text textAnchor="middle" dy="4" fontSize="10" fontWeight="600" fill={colors.text}>
                  {node.label.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()}
                </text>
              )}
              {!isMember && (
                <text textAnchor="middle" dy="4" fontSize="11" fontWeight="600" fill={colors.text}>
                  {node.type === 'organization' ? '⌂' : node.type === 'department' ? '▤' : '◆'}
                </text>
              )}

              <text textAnchor="middle" y={radius + 16} fontSize="11" fontWeight={isMember ? 500 : 600}
                    fill={isHovered ? '#FAFAFA' : '#A1A1AA'} className="transition-colors duration-200">
                {node.label}
              </text>
              {node.subtitle && (
                <text textAnchor="middle" y={radius + 30} fontSize="9.5" fill="#52525B">
                  {node.subtitle}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button onClick={() => setViewBox(v => ({ ...v, w: v.w * 0.8, h: v.h * 0.8, x: v.x + v.w * 0.1, y: v.y + v.h * 0.1 }))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px] font-medium"
                style={{ background: '#111113', border: '1px solid #27272A', color: '#E4E4E7' }}>+</button>
        <button onClick={() => setViewBox(v => ({ ...v, w: v.w * 1.25, h: v.h * 1.25, x: v.x - v.w * 0.125, y: v.y - v.h * 0.125 }))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px] font-medium"
                style={{ background: '#111113', border: '1px solid #27272A', color: '#E4E4E7' }}>−</button>
        <button onClick={resetView}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px]"
                style={{ background: '#111113', border: '1px solid #27272A', color: '#A1A1AA' }} data-tooltip="Reset view">⤢</button>
      </div>

      <div className="absolute top-4 left-4 flex items-center gap-4 px-3 py-2 rounded-lg text-[11px]"
           style={{ background: 'rgba(17,17,19,0.8)', backdropFilter: 'blur(8px)', border: '1px solid #1F1F23', color: '#A1A1AA' }}>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#22C55E' }}/>Online</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#F59E0B' }}/>Idle</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#52525B' }}/>Offline</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: '#22D3EE' }}/>AI agent</span>
      </div>

      <div className="absolute bottom-4 left-4 text-[11px]" style={{ color: '#52525B' }}>
        Scroll to zoom · Drag to pan · Click to explore
      </div>
    </div>
  );
}
