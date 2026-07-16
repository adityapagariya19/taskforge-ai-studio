import { GraphNode } from '../types';

export interface LayoutNode extends GraphNode {
  x: number;
  y: number;
  children: LayoutNode[];
  depth: number;
}

const LEAF_SPACING = 190;
const LEVEL_HEIGHT = 170;

/**
 * A real tree layout: builds the parent/child structure from the flat
 * GraphNode[] (via parentId), assigns each leaf an x-slot in traversal
 * order, then sets every internal node's x to the midpoint of its
 * children's x range — the standard recursive tree-layout approach. Depth
 * (and therefore y) comes directly from BFS distance from the root. No
 * node position here is arbitrary or decorative; every coordinate is
 * derived from the actual organization hierarchy passed in.
 */
export function layoutTree(nodes: GraphNode[]): LayoutNode | null {
  const byId = new Map<string, LayoutNode>();
  nodes.forEach(n => byId.set(n.id, { ...n, x: 0, y: 0, children: [], depth: 0 }));

  let root: LayoutNode | null = null;
  byId.forEach(n => {
    if (n.parentId === null) {
      root = n;
    } else {
      const parent = byId.get(n.parentId);
      if (parent) parent.children.push(n);
    }
  });
  if (!root) return null;

  assignDepth(root, 0);
  let leafIndex = 0;
  leafIndex = assignX(root, leafIndex);

  return root;
}

function assignDepth(node: LayoutNode, depth: number) {
  node.depth = depth;
  node.y = depth * LEVEL_HEIGHT;
  node.children.forEach(c => assignDepth(c, depth + 1));
}

function assignX(node: LayoutNode, nextLeafIndex: number): number {
  if (node.children.length === 0) {
    node.x = nextLeafIndex * LEAF_SPACING;
    return nextLeafIndex + 1;
  }
  let idx = nextLeafIndex;
  for (const child of node.children) {
    idx = assignX(child, idx);
  }
  const xs = node.children.map(c => c.x);
  node.x = (Math.min(...xs) + Math.max(...xs)) / 2;
  return idx;
}

/** Flattens the tree back into an array — useful for rendering without recursive JSX. */
export function flattenTree(root: LayoutNode): LayoutNode[] {
  const out: LayoutNode[] = [];
  const walk = (n: LayoutNode) => { out.push(n); n.children.forEach(walk); };
  walk(root);
  return out;
}

export function treeBounds(nodes: LayoutNode[]) {
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  return {
    minX: Math.min(...xs), maxX: Math.max(...xs),
    minY: Math.min(...ys), maxY: Math.max(...ys),
  };
}
