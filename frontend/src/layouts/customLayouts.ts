import G6 from '@antv/g6';

interface LayoutNode {
  id: string;
  x: number;
  y: number;
}

interface LayoutEdge {
  source: string;
  target: string;
}

function buildAdjacency(nodes: LayoutNode[], edges: LayoutEdge[]) {
  const adj = new Map<string, Set<string>>();
  nodes.forEach((n) => adj.set(n.id, new Set()));
  edges.forEach((e) => {
    const sid = typeof e.source === 'object' ? (e.source as any).id : e.source;
    const tid = typeof e.target === 'object' ? (e.target as any).id : e.target;
    adj.get(sid)?.add(tid);
    adj.get(tid)?.add(sid);
  });
  return adj;
}

function findRoot(nodes: LayoutNode[], adj: Map<string, Set<string>>): string {
  let maxDeg = -1;
  let rootId = nodes[0]?.id || '';
  nodes.forEach((n) => {
    const deg = adj.get(n.id)?.size || 0;
    if (deg > maxDeg) {
      maxDeg = deg;
      rootId = n.id;
    }
  });
  return rootId;
}

function bfsTree(rootId: string, adj: Map<string, Set<string>>) {
  const parent = new Map<string, string | null>();
  const children = new Map<string, string[]>();
  const depth = new Map<string, number>();
  const queue: string[] = [rootId];
  parent.set(rootId, null);
  depth.set(rootId, 0);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const curChildren: string[] = [];
    const neighbors = adj.get(cur) || new Set();
    neighbors.forEach((nb) => {
      if (!parent.has(nb)) {
        parent.set(nb, cur);
        depth.set(nb, (depth.get(cur) || 0) + 1);
        queue.push(nb);
        curChildren.push(nb);
      }
    });
    children.set(cur, curChildren);
  }
  return { parent, children, depth };
}

function subtreeSize(nodeId: string, children: Map<string, string[]>): number {
  const ch = children.get(nodeId) || [];
  if (ch.length === 0) return 1;
  return ch.reduce((sum, c) => sum + subtreeSize(c, children), 0);
}

/* ================================================================
 * 鱼骨布局 (Fishbone / Ishikawa)
 * ================================================================ */
G6.registerLayout('fishbone', {
  getDefaultCfg() {
    return { hGap: 120, vGap: 60 };
  },
  execute() {
    const self = this as any;
    const { nodes, edges } = self;
    if (!nodes || nodes.length === 0) return;
    if (nodes.length === 1) { nodes[0].x = 0; nodes[0].y = 0; return; }

    const hGap: number = self.hGap;
    const vGap: number = self.vGap;
    const adj = buildAdjacency(nodes, edges);
    const rootId = findRoot(nodes, adj);
    const { children } = bfsTree(rootId, adj);

    const posMap = new Map<string, { x: number; y: number }>();
    const spineChildren = children.get(rootId) || [];
    const totalW = spineChildren.length * hGap;
    posMap.set(rootId, { x: totalW / 2 + hGap, y: 0 });

    spineChildren.forEach((spineId, i) => {
      const spineX = totalW / 2 - i * hGap;
      posMap.set(spineId, { x: spineX, y: 0 });
      const direction = i % 2 === 0 ? -1 : 1;
      const branchChildren = children.get(spineId) || [];
      branchChildren.forEach((bId, bIdx) => {
        const bx = spineX - (bIdx + 1) * hGap * 0.4;
        const by = direction * (bIdx + 1) * vGap;
        posMap.set(bId, { x: bx, y: by });
        const layoutSub = (pid: string, px: number, py: number, dir: number, lvl: number) => {
          (children.get(pid) || []).forEach((cId, ci) => {
            const cx = px - (ci + 0.8) * hGap * 0.35;
            const cy = py + dir * (ci + 1) * vGap * 0.6;
            posMap.set(cId, { x: cx, y: cy });
            if (lvl < 5) layoutSub(cId, cx, cy, dir, lvl + 1);
          });
        };
        layoutSub(bId, bx, by, direction, 2);
      });
    });

    const nodeMap = new Map<string, LayoutNode>(nodes.map((n: LayoutNode) => [n.id, n]));
    posMap.forEach((pos, id) => { const n = nodeMap.get(id); if (n) { n.x = pos.x; n.y = pos.y; } });
    nodes.forEach((n: LayoutNode) => { if (!posMap.has(n.id)) { n.x = 0; n.y = (Math.random() - 0.5) * 200; } });
  },
});

/* ================================================================
 * 活动图布局 (Activity Chart)
 * ================================================================ */
G6.registerLayout('activity', {
  getDefaultCfg() {
    return { vGap: 80, hGap: 55 };
  },
  execute() {
    const self = this as any;
    const { nodes } = self;
    if (!nodes || nodes.length === 0) return;

    const vGap: number = self.vGap;
    const hGap: number = self.hGap;

    let maxRow = 0;
    nodes.forEach((n: any) => { const r = n._activityRow ?? 0; if (r > maxRow) maxRow = r; });
    const totalH = maxRow * vGap;

    nodes.forEach((n: LayoutNode) => {
      const row = (n as any)._activityRow ?? 0;
      const col = (n as any)._activityCol ?? 0;
      n.x = col * hGap;
      n.y = -totalH / 2 + row * vGap;
    });
  },
});

/* ================================================================
 * 生态树布局 (Eco-tree / Mindmap)
 * ================================================================ */
G6.registerLayout('eco-tree', {
  getDefaultCfg() {
    return { hGap: 100, vGap: 40 };
  },
  execute() {
    const self = this as any;
    const { nodes, edges } = self;
    if (!nodes || nodes.length === 0) return;
    if (nodes.length === 1) { nodes[0].x = 0; nodes[0].y = 0; return; }

    const hGap: number = self.hGap;
    const vGap: number = self.vGap;
    const adj = buildAdjacency(nodes, edges);
    const rootId = findRoot(nodes, adj);
    const { children: childMap } = bfsTree(rootId, adj);

    const posMap = new Map<string, { x: number; y: number }>();
    const sizeCache = new Map<string, number>();
    const getSize = (id: string): number => {
      if (sizeCache.has(id)) return sizeCache.get(id)!;
      const s = subtreeSize(id, childMap);
      sizeCache.set(id, s);
      return s;
    };

    const layoutSubtree = (nodeId: string, x: number, y: number, direction: 1 | -1) => {
      posMap.set(nodeId, { x, y });
      const ch = childMap.get(nodeId) || [];
      if (ch.length === 0) return;
      const totalLeaves = ch.reduce((s, c) => s + getSize(c), 0);
      const totalHeight = Math.max(totalLeaves - 1, 0) * vGap;
      let curY = y - totalHeight / 2;
      ch.forEach((cId) => {
        const sz = getSize(cId);
        const blockH = (sz - 1) * vGap;
        layoutSubtree(cId, x + direction * hGap, curY + blockH / 2, direction);
        curY += sz * vGap;
      });
    };

    posMap.set(rootId, { x: 0, y: 0 });
    const rootChildren = childMap.get(rootId) || [];
    const rightChildren = rootChildren.filter((_, i) => i % 2 === 0);
    const leftChildren = rootChildren.filter((_, i) => i % 2 !== 0);

    const layoutSide = (list: string[], dir: 1 | -1) => {
      if (list.length === 0) return;
      const totalLeaves = list.reduce((s, c) => s + getSize(c), 0);
      const totalHeight = Math.max(totalLeaves - 1, 0) * vGap;
      let curY = -totalHeight / 2;
      list.forEach((cId) => {
        const sz = getSize(cId);
        const blockH = (sz - 1) * vGap;
        layoutSubtree(cId, dir * hGap, curY + blockH / 2, dir);
        curY += sz * vGap;
      });
    };

    layoutSide(rightChildren, 1);
    layoutSide(leftChildren, -1);

    const nodeMap = new Map<string, LayoutNode>(nodes.map((n: LayoutNode) => [n.id, n]));
    posMap.forEach((pos, id) => { const n = nodeMap.get(id); if (n) { n.x = pos.x; n.y = pos.y; } });
    nodes.forEach((n: LayoutNode) => { if (!posMap.has(n.id)) { n.x = 0; n.y = (Math.random() - 0.5) * 200; } });
  },
});
