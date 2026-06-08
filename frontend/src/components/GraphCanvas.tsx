import React, { useMemo, useEffect, useLayoutEffect, useRef, useState, useCallback } from 'react';
import Graphin, { Behaviors, GraphinData } from '@antv/graphin';
import G6 from '@antv/g6';
import { message, Switch, Tooltip } from 'antd';
import {
  ShareAltOutlined,
  DeleteOutlined,
  EyeInvisibleOutlined,
  AimOutlined,
  HighlightOutlined,
  ShrinkOutlined,
  ArrowsAltOutlined,
  ExpandOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';
import type { ThemeTokens } from '../context/ThemeContext';
import '../layouts/customLayouts';

const { DragCanvas, ZoomCanvas, DragNode, ActivateRelations, FitView } = Behaviors;

const FORCE_LAYOUTS = new Set(['forceAtlas2', 'force']);
const CUSTOM_LAYOUTS = new Set(['fishbone', 'eco-tree', 'activity']);

const CLUSTER_COLORS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#eb2f96', '#13c2c2', '#fa541c', '#2f54eb', '#a0d911',
];

const GraphCanvas: React.FC = () => {
  const { state, dispatch, actions } = useGraph();
  const { tokens } = useTheme();
  const graphRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const minimapContainerRef = useRef<HTMLDivElement>(null);
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;
  const minimapRef = useRef<any>(null);
  const lastGraphForMinimap = useRef<any>(null);
  const pendingExpandRef = useRef<string[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [gpuAccel, setGpuAccel] = useState(true);
  const graphWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const { width, height } = el.getBoundingClientRect();
      setSize((prev) => {
        if (Math.abs(prev.w - width) > 2 || Math.abs(prev.h - height) > 2) {
          return { w: Math.floor(width), h: Math.floor(height) };
        }
        return prev;
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const hiddenNodeIds = useMemo(() => {
    const hidden = new Set<string>();
    Object.values(state.collapsedNodes).forEach((ids) => ids.forEach((id) => hidden.add(id)));
    return hidden;
  }, [state.collapsedNodes]);

  const collapsedParentIds = useMemo(
    () => new Set(Object.keys(state.collapsedNodes)),
    [state.collapsedNodes],
  );

  const graphinData: GraphinData = useMemo(() => {
    const entityTypeMap = new Map(state.entityTypes.map((t) => [t.id, t]));
    const relationTypeMap = new Map(state.relationTypes.map((t) => [t.id, t]));

    const visibleEntities = state.entities.filter((e) => !hiddenNodeIds.has(e.id));

    const isDark = tokens.bg.startsWith('#1');
    const hasAnalysis = !!state.analysisResult;
    const analysisType = state.analysisResult?.type as string | undefined;
    const hasHighlights = state.highlightIds.length > 0;
    const highlightSet = new Set(state.highlightIds);

    const clusterMap = analysisType === 'cluster' ? (state.analysisResult.data?.clusters || {}) as Record<string, number> : {};
    const snaMetrics = analysisType === 'sna' ? (state.analysisResult.data?.metrics || []) as any[] : [];
    const snaMap = new Map(snaMetrics.map((m: any) => [m.entityId, m]));
    const pathNodeIds = new Set<string>();
    if (analysisType === 'path' && state.analysisResult.data?.paths) {
      (state.analysisResult.data.paths as string[][]).forEach((p: string[]) => p.forEach((id: string) => pathNodeIds.add(id)));
    }

    const nodes = visibleEntities.map((entity) => {
      const entityType = entityTypeMap.get(entity.typeId);
      const color = entityType?.color || '#1890ff';
      const isHighlighted = !hasHighlights || highlightSet.has(entity.id);
      const isCollapsed = collapsedParentIds.has(entity.id);

      let clusterColor: string | undefined;
      if (analysisType === 'cluster') {
        const clusterId = clusterMap[entity.id];
        if (clusterId !== undefined) {
          clusterColor = CLUSTER_COLORS[clusterId % CLUSTER_COLORS.length];
        }
      }

      let nodeSize = 26;
      if (analysisType === 'sna') {
        const metric = snaMap.get(entity.id);
        if (metric) {
          nodeSize = 20 + Math.round(metric.degreeCentrality * 40);
        }
      }

      const isAnalysisTarget = hasAnalysis && (
        (analysisType === 'link' && highlightSet.has(entity.id)) ||
        (analysisType === 'path' && pathNodeIds.has(entity.id)) ||
        (analysisType === 'cluster' && clusterMap[entity.id] !== undefined) ||
        (analysisType === 'sna' && snaMap.has(entity.id))
      );

      const glowColor = clusterColor || color;
      const emphSize = isAnalysisTarget
        ? Math.max(nodeSize + 10, 36) : nodeSize;
      const dimSize = hasAnalysis && !isAnalysisTarget ? Math.max(nodeSize - 4, 16) : nodeSize;
      const finalSize = isAnalysisTarget ? emphSize : dimSize;

      const hiddenCount = isCollapsed ? (state.collapsedNodes[entity.id]?.length || 0) : 0;

      return {
        id: entity.id,
        style: {
          keyshape: {
            size: finalSize,
            fill: clusterColor || color,
            stroke: isCollapsed ? tokens.primary
              : isAnalysisTarget ? (isDark ? '#fff' : '#fff')
              : isDark ? 'rgba(255,255,255,0.2)' : (clusterColor || color),
            lineWidth: isCollapsed ? 2.5 : isAnalysisTarget ? 3.5 : 1,
            fillOpacity: hasAnalysis ? (isAnalysisTarget ? 1 : 0.08) : (isHighlighted ? 1 : 0.3),
            lineDash: isCollapsed ? [4, 3] : undefined,
            shadowColor: isAnalysisTarget ? glowColor : undefined,
            shadowBlur: isAnalysisTarget ? 28 : 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
          },
          halo: isAnalysisTarget ? {
            visible: true,
            fill: glowColor,
            fillOpacity: 0.15,
            lineWidth: 0,
            size: finalSize + 20,
          } : undefined,
          label: {
            value: isCollapsed ? `${entity.label} (+${hiddenCount})` : entity.label,
            position: 'bottom' as const,
            fill: hasAnalysis
              ? (isAnalysisTarget ? tokens.graphNodeLabel : tokens.graphNodeLabelDim)
              : (isHighlighted ? tokens.graphNodeLabel : tokens.graphNodeLabelDim),
            fontSize: isAnalysisTarget ? 14 : (hasAnalysis && !isAnalysisTarget ? 10 : 12),
            fontWeight: isAnalysisTarget ? 700 : 400,
            opacity: hasAnalysis && !isAnalysisTarget ? 0.3 : 1,
          },
          icon: {
            type: 'text' as const,
            value: entityType?.name?.charAt(0) || '?',
            size: finalSize * 0.6,
            fill: '#fff',
          },
        },
      };
    });

    const pathEdgeSet = new Set<string>();
    if (analysisType === 'path' && state.analysisResult.data?.highlightEdges) {
      (state.analysisResult.data.highlightEdges as string[]).forEach((id: string) => pathEdgeSet.add(id));
    }

    const visibleSet = new Set(visibleEntities.map((e) => e.id));
    const edges = state.relationships
      .filter((rel) => visibleSet.has(rel.source) && visibleSet.has(rel.target))
      .map((rel) => {
        const relType = relationTypeMap.get(rel.typeId);
        const defaultEdgeColor = isDark ? 'rgba(255,255,255,0.35)' : '#999';
        const color = relType?.color || defaultEdgeColor;
        const isHighlighted = !hasHighlights ||
          (highlightSet.has(rel.source) && highlightSet.has(rel.target));

        const isOnPath = pathEdgeSet.has(rel.id);

        const isLinkEdge = analysisType === 'link' && highlightSet.has(rel.source) && highlightSet.has(rel.target);

        let edgeClusterColor: string | undefined;
        if (analysisType === 'cluster') {
          const sc = clusterMap[rel.source];
          const tc = clusterMap[rel.target];
          if (sc !== undefined && sc === tc) {
            edgeClusterColor = CLUSTER_COLORS[sc % CLUSTER_COLORS.length];
          }
        }

        const isSnaEdge = analysisType === 'sna' && snaMap.has(rel.source) && snaMap.has(rel.target);

        const isAnalysisEdge = isOnPath || isLinkEdge || !!edgeClusterColor || isSnaEdge;

        let edgeStroke = color;
        let edgeLW = 1;
        let edgeShadow: string | undefined;
        let edgeShadowBlur = 0;
        let edgeDash: number[] | undefined;

        if (isOnPath) {
          edgeStroke = '#f5222d';
          edgeLW = 4.5;
          edgeShadow = 'rgba(245,34,45,0.6)';
          edgeShadowBlur = 16;
        } else if (isLinkEdge) {
          edgeStroke = tokens.primary;
          edgeLW = 3.5;
          edgeShadow = tokens.primary;
          edgeShadowBlur = 12;
        } else if (edgeClusterColor) {
          edgeStroke = edgeClusterColor;
          edgeLW = 2.5;
          edgeShadow = edgeClusterColor;
          edgeShadowBlur = 8;
        } else if (isSnaEdge) {
          const srcM = snaMap.get(rel.source);
          const tgtM = snaMap.get(rel.target);
          const avgCentrality = ((srcM?.degreeCentrality || 0) + (tgtM?.degreeCentrality || 0)) / 2;
          edgeLW = 1.5 + avgCentrality * 4;
          edgeShadow = color;
          edgeShadowBlur = 6;
        }

        if (hasAnalysis && !isAnalysisEdge) {
          edgeDash = [3, 4];
        }

        return {
          source: rel.source,
          target: rel.target,
          id: rel.id,
          style: {
            keyshape: {
              stroke: edgeStroke,
              lineWidth: edgeLW,
              opacity: hasAnalysis ? (isAnalysisEdge ? 1 : 0.05) : (isHighlighted ? 1 : 0.2),
              shadowColor: edgeShadow,
              shadowBlur: edgeShadowBlur,
              lineDash: edgeDash,
            },
            label: {
              value: rel.label || relType?.name || '',
              fill: (hasAnalysis ? isAnalysisEdge : isHighlighted) ? tokens.graphEdgeLabel : tokens.graphEdgeLabelDim,
              fontSize: isAnalysisEdge ? 12 : 10,
              fontWeight: isAnalysisEdge ? 600 : 400,
              opacity: hasAnalysis && !isAnalysisEdge ? 0.2 : 1,
            },
          },
        };
      });

    if (state.layoutType !== 'activity') return { nodes, edges };

    /* ── 活动图模式：将实体+关系变换为泳道+事件节点+连接线 ── */
    const dotColor = isDark ? '#aaa' : '#333';
    const laneColor = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)';
    const connColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.6)';

    const degMap = new Map<string, number>();
    visibleEntities.forEach((e) => degMap.set(e.id, 0));
    const filteredRels = state.relationships.filter(
      (r) => visibleSet.has(r.source) && visibleSet.has(r.target) && r.source !== r.target,
    );
    filteredRels.forEach((r) => {
      degMap.set(r.source, (degMap.get(r.source) || 0) + 1);
      degMap.set(r.target, (degMap.get(r.target) || 0) + 1);
    });

    const sortedEntities = [...visibleEntities].sort(
      (a, b) => (degMap.get(b.id) || 0) - (degMap.get(a.id) || 0),
    );
    const rowOf = new Map<string, number>();
    sortedEntities.forEach((e, i) => rowOf.set(e.id, i));

    const sortedRels = [...filteredRels].sort((a, b) => {
      const aMin = Math.min(rowOf.get(a.source) ?? 99, rowOf.get(a.target) ?? 99);
      const bMin = Math.min(rowOf.get(b.source) ?? 99, rowOf.get(b.target) ?? 99);
      if (aMin !== bMin) return aMin - bMin;
      const aMax = Math.max(rowOf.get(a.source) ?? 0, rowOf.get(a.target) ?? 0);
      const bMax = Math.max(rowOf.get(b.source) ?? 0, rowOf.get(b.target) ?? 0);
      return aMax - bMax;
    });

    const actNodes: any[] = nodes.map((n: any) => ({
      ...n,
      _activityRow: rowOf.get(n.id) ?? 0,
      _activityCol: 0,
      style: {
        ...n.style,
        label: { ...n.style.label, position: 'left' as const },
      },
    }));
    const actEdges: any[] = [];

    const laneEvents = new Map<string, { id: string; col: number }[]>();
    sortedEntities.forEach((e) => laneEvents.set(e.id, []));

    sortedRels.forEach((rel, idx) => {
      const col = idx + 1;
      const relType = relationTypeMap.get(rel.typeId);
      const srcEvt = `_evt_${rel.id}_s`;
      const tgtEvt = `_evt_${rel.id}_t`;

      const evtStyle = {
        keyshape: { size: 7, fill: dotColor, stroke: dotColor, lineWidth: 0 },
        label: { value: '' },
        icon: { type: 'text' as const, value: '', size: 0, fill: 'transparent' },
      };
      actNodes.push({ id: srcEvt, _activityRow: rowOf.get(rel.source), _activityCol: col, style: evtStyle });
      actNodes.push({ id: tgtEvt, _activityRow: rowOf.get(rel.target), _activityCol: col, style: evtStyle });

      laneEvents.get(rel.source)?.push({ id: srcEvt, col });
      laneEvents.get(rel.target)?.push({ id: tgtEvt, col });

      actEdges.push({
        source: srcEvt,
        target: tgtEvt,
        id: `_conn_${rel.id}`,
        style: {
          keyshape: { stroke: connColor, lineWidth: 1.5 },
          label: { value: rel.label || relType?.name || '', fontSize: 9, fill: tokens.graphEdgeLabel },
        },
      });
    });

    const maxCol = sortedRels.length + 1;
    laneEvents.forEach((events, entityId) => {
      events.sort((a, b) => a.col - b.col);
      const tailId = `_tail_${entityId}`;
      actNodes.push({
        id: tailId,
        _activityRow: rowOf.get(entityId),
        _activityCol: maxCol,
        style: {
          keyshape: { size: 3, fill: laneColor, stroke: 'transparent', lineWidth: 0 },
          label: { value: '' },
          icon: { type: 'text' as const, value: '', size: 0, fill: 'transparent' },
        },
      });

      const chain = [entityId, ...events.map((e) => e.id), tailId];
      for (let i = 0; i < chain.length - 1; i++) {
        actEdges.push({
          source: chain[i],
          target: chain[i + 1],
          id: `_lane_${chain[i]}_${chain[i + 1]}`,
          style: { keyshape: { stroke: laneColor, lineWidth: 1 }, label: { value: '' } },
        });
      }
    });

    return { nodes: actNodes, edges: actEdges };
  }, [
    state.entities,
    state.relationships,
    state.entityTypes,
    state.relationTypes,
    state.highlightIds,
    state.analysisResult,
    state.collapsedNodes,
    state.layoutType,
    hiddenNodeIds,
    collapsedParentIds,
    tokens,
  ]);

  const layoutConfig = useMemo(() => {
    const w = Math.max(size.w || 800, 400);
    const h = Math.max(size.h || 600, 300);
    const center: [number, number] = [w / 2, h / 2];

    const configs: Record<string, any> = {
      forceAtlas2: {
        width: w,
        height: h,
        center,
        type: 'forceAtlas2',
        preventOverlap: true,
        nodeSize: 26,
        kr: 120,
        kg: 8,
        ks: 0.1,
        tao: 0.1,
        maxIteration: 1000,
        barnesHut: true,
        prune: true,
      },
      concentric: {
        type: 'concentric',
        width: w,
        height: h,
        center,
        minNodeSpacing: 60,
        preventOverlap: true,
        nodeSize: 26,
        equidistant: true,
      },
      circular: { type: 'circular', width: w, height: h, center, preventOverlap: true, nodeSize: 26 },
      grid: { type: 'grid', width: w, height: h, preventOverlap: true, nodeSize: 26 },
      dagre: { type: 'dagre', width: w, height: h, rankdir: 'TB', nodesep: 30, ranksep: 60 },
      radial: { type: 'radial', width: w, height: h, center, unitRadius: 150, preventOverlap: true, nodeSize: 26, nodeSpacing: 80 },
      fishbone: { type: 'fishbone', width: w, height: h, hGap: 120, vGap: 60 },
      'eco-tree': { type: 'eco-tree', width: w, height: h, hGap: 100, vGap: 40 },
      activity: { type: 'activity', width: w, height: h, vGap: 80, hGap: 55 },
    };

    let cfg = configs[state.layoutType] || configs['forceAtlas2'];

      if (gpuAccel) {
      if (FORCE_LAYOUTS.has(state.layoutType)) {
        cfg = {
          type: 'gForce',
          width: w,
          height: h,
          center,
          gpuEnabled: true,
          preventOverlap: true,
          nodeSize: 26,
          maxIteration: 2000,
          damping: 0.7,
          minMovement: 0.5,
          linkDistance: 120,
          nodeStrength: 800,
          edgeStrength: 200,
          gravity: 10,
        };
      } else if (!CUSTOM_LAYOUTS.has(state.layoutType)) {
        cfg = { ...cfg, workerEnabled: true };
      }
    }

    return cfg;
  }, [state.layoutType, gpuAccel, size.w, size.h]);

  const layoutKey = `${state.layoutType}-${gpuAccel}-${tokens.bgGraph}`;
  useLayoutEffect(() => {
    if (graphWrapperRef.current) {
      graphWrapperRef.current.style.transition = 'none';
      graphWrapperRef.current.style.opacity = '0';
    }
  }, [layoutKey]);

  const showGraph = useCallback(() => {
    if (graphWrapperRef.current && graphWrapperRef.current.style.opacity !== '1') {
      graphWrapperRef.current.style.transition = 'opacity 0.3s ease-out';
      graphWrapperRef.current.style.opacity = '1';
    }
  }, []);

  const ensureMinimap = useCallback((graph: any) => {
    if (!graph || graph.get('destroyed') || !minimapContainerRef.current) return;
    if (lastGraphForMinimap.current === graph && minimapRef.current) return;

    if (minimapRef.current) {
      try {
        const oldGraph = lastGraphForMinimap.current;
        if (oldGraph && !oldGraph.get('destroyed')) {
          oldGraph.removePlugin(minimapRef.current);
        }
      } catch (_) {}
      minimapRef.current = null;
    }

    minimapContainerRef.current.innerHTML = '';
    if (!graph.get('plugins')) graph.set('plugins', []);

    const minimap = new G6.Minimap({
      container: minimapContainerRef.current,
      size: [200, 120],
      type: 'keyShape',
    });
    minimapRef.current = minimap;
    lastGraphForMinimap.current = graph;
    graph.addPlugin(minimap);
  }, []);

  useEffect(() => {
    const graph = graphRef.current?.graph;
    if (!graph || graph.get('destroyed')) return;

    const animateShapes = (item: any, from: Record<string, any>, to: Record<string, any>, dur: number) => {
      const shapes = item?.getContainer()?.get('children');
      if (!shapes) return;
      shapes.forEach((s: any) => {
        if (from) Object.entries(from).forEach(([k, v]) => s.attr(k, v));
        s.animate?.(to, { duration: dur, easing: 'easeCubicOut' });
      });
    };

    const settleAndShow = () => {
      if (graph.get('destroyed')) return;
      graph.getEdges().forEach((edge: any) => { edge.refresh(); });

      setTimeout(() => {
        if (graph.get('destroyed')) return;
        graph.fitView(20);
        showGraph();
        ensureMinimap(graph);

        if (pendingExpandRef.current.length > 0) {
          const ids = pendingExpandRef.current;
          pendingExpandRef.current = [];
          const idSet = new Set(ids);

          ids.forEach((id) => {
            const item = graph.findById(id);
            if (item) animateShapes(item, { opacity: 0 }, { opacity: 1 }, 320);
          });
          graph.getEdges().forEach((edge: any) => {
            const m = edge.getModel();
            if (idSet.has(m.source as string) || idSet.has(m.target as string)) {
              animateShapes(edge, { opacity: 0 }, { opacity: 1 }, 320);
            }
          });
        }
      }, 120);
    };

    ensureMinimap(graph);

    graph.on('afterlayout', settleAndShow);

    const fallback = setTimeout(() => {
      if (graphWrapperRef.current && graphWrapperRef.current.style.opacity === '0') {
        if (!graph.get('destroyed')) graph.fitView(20);
        showGraph();
      }
    }, 1200);

    return () => {
      clearTimeout(fallback);
      if (!graph.get('destroyed')) {
        graph.off('afterlayout', settleAndShow);
      }
    };
  });

  useEffect(() => {
    const graph = graphRef.current?.graph;
    if (!graph) return;

    const isPhantom = (id: string) => id.startsWith('_evt_') || id.startsWith('_tail_');
    const onNodeClick = (e: any) => {
      const nodeId = e.item?.getModel()?.id;
      if (nodeId && !isPhantom(nodeId)) dispatch({ type: 'SELECT_NODE', payload: nodeId });
    };
    const onEdgeClick = (e: any) => {
      const edgeId = e.item?.getModel()?.id;
      if (edgeId && !edgeId.startsWith('_lane_') && !edgeId.startsWith('_conn_')) {
        dispatch({ type: 'SELECT_EDGE', payload: edgeId });
      }
    };
    const onCanvasClick = () => {
      dispatch({ type: 'SELECT_NODE', payload: null });
      dispatch({ type: 'SELECT_EDGE', payload: null });
    };

    graph.on('node:click', onNodeClick);
    graph.on('edge:click', onEdgeClick);
    graph.on('canvas:click', onCanvasClick);

    const runtime = (window as any).runtime;
    const graphUnsubs: (() => void)[] = [];
    if (runtime?.EventsOn) {
      runtime.EventsOn('graph:fit-view', () => graph.fitView(20));
      graphUnsubs.push(() => runtime.EventsOff('graph:fit-view'));
      runtime.EventsOn('graph:zoom-in', () => graph.zoom(1.2));
      graphUnsubs.push(() => runtime.EventsOff('graph:zoom-in'));
      runtime.EventsOn('graph:zoom-out', () => graph.zoom(0.8));
      graphUnsubs.push(() => runtime.EventsOff('graph:zoom-out'));

      runtime.EventsOn('graph:export-png', () => {
        const backend = (window as any)?.go?.main?.App;
        const bgColor = tokensRef.current.bgGraph;
        graph.toFullDataURL(
          (dataUrl: string) => {
            if (backend?.SaveFileDialog && backend?.WriteFile) {
              const defaultName = `graph-export-${new Date().toISOString().slice(0, 10)}.png`;
              backend.SaveFileDialog('导出 PNG', defaultName, [
                { DisplayName: 'PNG 图片 (*.png)', Pattern: '*.png' },
              ]).then((filePath: string) => {
                if (!filePath) return;
                const base64 = dataUrl.split(',')[1];
                backend.WriteBase64File(filePath, base64).then((ok: boolean) => {
                  if (ok) message.success(`画布已导出到: ${filePath}`);
                  else message.error('导出失败');
                });
              });
            } else {
              graph.downloadFullImage('graph-export', 'image/png', { backgroundColor: bgColor, padding: 20 });
              message.success('画布已导出为 PNG');
            }
          },
          'image/png',
          { backgroundColor: bgColor, padding: 20 },
        );
      });
      graphUnsubs.push(() => runtime.EventsOff('graph:export-png'));

      runtime.EventsOn('graph:export-svg', () => {
        const backend = (window as any)?.go?.main?.App;

        const canvasEl = graph.get('canvas')?.get('el') as HTMLCanvasElement | undefined;
        if (!canvasEl) { message.error('无法获取画布'); return; }

        const w = canvasEl.width;
        const h = canvasEl.height;
        const pngDataUrl = canvasEl.toDataURL('image/png');

        const svgBg = tokensRef.current.bgGraph;
        const svgXml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"`,
          `     width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
          `  <rect width="${w}" height="${h}" fill="${svgBg}"/>`,
          `  <image width="${w}" height="${h}" href="${pngDataUrl}"/>`,
          `</svg>`,
        ].join('\n');

        if (backend?.SaveFileDialog && backend?.WriteFile) {
          const defaultName = `graph-export-${new Date().toISOString().slice(0, 10)}.svg`;
          backend.SaveFileDialog('导出 SVG', defaultName, [
            { DisplayName: 'SVG 文件 (*.svg)', Pattern: '*.svg' },
          ]).then((filePath: string) => {
            if (!filePath) return;
            backend.WriteFile(filePath, svgXml).then((ok: boolean) => {
              if (ok) message.success(`画布已导出到: ${filePath}`);
              else message.error('导出失败');
            });
          });
        } else {
          const blob = new Blob([svgXml], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.download = 'graph-export.svg';
          a.href = url;
          a.click();
          URL.revokeObjectURL(url);
          message.success('画布已导出为 SVG');
        }
      });
      graphUnsubs.push(() => runtime.EventsOff('graph:export-svg'));
    }

    return () => {
      graph.off('node:click', onNodeClick);
      graph.off('edge:click', onEdgeClick);
      graph.off('canvas:click', onCanvasClick);
      graphUnsubs.forEach((fn) => fn());
    };
  });

  const prevSelNode = useRef<string | null>(null);
  const prevSelEdge = useRef<string | null>(null);
  useEffect(() => {
    const graph = graphRef.current?.graph;
    if (!graph || graph.get('destroyed')) return;

    const resetNode = (id: string | null) => {
      if (!id) return;
      const item = graph.findById(id);
      if (!item || item.destroyed) return;
      const model = item.getModel();
      const origStroke = model?.oriStyle?.keyshape?.stroke || model?.style?.keyshape?.stroke;
      const origLW = model?.oriStyle?.keyshape?.lineWidth || model?.style?.keyshape?.lineWidth;
      graph.updateItem(id, { style: { keyshape: { stroke: origStroke || '#1890ff', lineWidth: origLW || 1 } } });
    };

    const resetEdge = (id: string | null) => {
      if (!id) return;
      const item = graph.findById(id);
      if (!item || item.destroyed) return;
      const model = item.getModel();
      const origStroke = model?.oriStyle?.keyshape?.stroke || model?.style?.keyshape?.stroke;
      graph.updateItem(id, { style: { keyshape: { stroke: origStroke || '#999', lineWidth: 1 } } });
    };

    if (prevSelNode.current !== state.selectedNodeId) {
      resetNode(prevSelNode.current);
      if (state.selectedNodeId) {
        const item = graph.findById(state.selectedNodeId);
        if (item && !item.destroyed) {
          graph.updateItem(state.selectedNodeId, { style: { keyshape: { stroke: '#000', lineWidth: 3 } } });
        }
      }
      prevSelNode.current = state.selectedNodeId;
    }

    if (prevSelEdge.current !== state.selectedEdgeId) {
      resetEdge(prevSelEdge.current);
      if (state.selectedEdgeId) {
        const item = graph.findById(state.selectedEdgeId);
        if (item && !item.destroyed) {
          graph.updateItem(state.selectedEdgeId, { style: { keyshape: { stroke: '#000', lineWidth: 2 } } });
        }
      }
      prevSelEdge.current = state.selectedEdgeId;
    }
  }, [state.selectedNodeId, state.selectedEdgeId]);

  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const graph = graphRef.current?.graph;
    if (!graph || graph.get('destroyed')) return;

    const onCtx = (e: any) => {
      e.preventDefault?.();
      e.stopPropagation?.();
      const nodeId = e.item?.getModel()?.id;
      if (!nodeId || nodeId.startsWith('_evt_') || nodeId.startsWith('_tail_')) return;
      const { clientX, clientY } = e;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setCtxMenu({ x: clientX - rect.left, y: clientY - rect.top, nodeId });
    };
    const onHide = () => setCtxMenu(null);

    graph.on('node:contextmenu', onCtx);
    graph.on('canvas:click', onHide);
    graph.on('node:click', onHide);
    document.addEventListener('click', onHide);
    return () => {
      if (!graph.get('destroyed')) {
        graph.off('node:contextmenu', onCtx);
        graph.off('canvas:click', onHide);
        graph.off('node:click', onHide);
      }
      document.removeEventListener('click', onHide);
    };
  });

  const getNeighborIds = useCallback(
    (nodeId: string) => {
      const neighbors = new Set<string>();
      state.relationships.forEach((r) => {
        if (r.source === nodeId) neighbors.add(r.target);
        if (r.target === nodeId) neighbors.add(r.source);
      });
      neighbors.delete(nodeId);
      return Array.from(neighbors);
    },
    [state.relationships],
  );

  /**
   * i2 风格级联收缩：
   * 1. 从操作节点出发，找到直接邻居
   * 2. 如果邻居的所有连接都指向"已收缩集合"内的节点，则该邻居可被隐藏
   * 3. 新隐藏的邻居触发级联——重复检查直到不再有新的可隐藏节点
   * 效果：共享节点（连接到其他可见节点）保留显示，仅隐藏"专属子树"
   */
  const getCollapseTargets = useCallback(
    (nodeId: string) => {
      const adj = new Map<string, Set<string>>();
      state.entities.forEach((e) => adj.set(e.id, new Set()));
      state.relationships.forEach((r) => {
        if (adj.has(r.source) && adj.has(r.target)) {
          adj.get(r.source)!.add(r.target);
          adj.get(r.target)!.add(r.source);
        }
      });

      const toHide = new Set<string>();
      const anchored = new Set<string>([nodeId]);
      hiddenNodeIds.forEach((id) => anchored.add(id));
      Object.keys(state.collapsedNodes).forEach((id) => anchored.add(id));

      let changed = true;
      while (changed) {
        changed = false;
        const candidates = new Set<string>();
        const frontier = new Set([nodeId, ...toHide]);
        frontier.forEach((fId) => {
          (adj.get(fId) || new Set()).forEach((nb) => {
            if (!toHide.has(nb) && nb !== nodeId && !hiddenNodeIds.has(nb)) {
              candidates.add(nb);
            }
          });
        });

        candidates.forEach((cand) => {
          const nbs = adj.get(cand) || new Set();
          let allInCollapsed = true;
          nbs.forEach((nb) => {
            if (nb !== nodeId && !toHide.has(nb) && !hiddenNodeIds.has(nb) && !anchored.has(nb)) {
              allInCollapsed = false;
            }
          });
          if (allInCollapsed) {
            toHide.add(cand);
            changed = true;
          }
        });
      }

      return Array.from(toHide);
    },
    [state.entities, state.relationships, hiddenNodeIds, state.collapsedNodes],
  );

  const handleCtxAction = useCallback(
    async (key: string) => {
      const nodeId = ctxMenu?.nodeId;
      setCtxMenu(null);
      if (!nodeId) return;

      if (key === 'delete') {
        await actions.deleteEntity(nodeId);
        message.success('实体已删除');
      } else if (key.startsWith('link-')) {
        const depth = parseInt(key.split('-')[1]);
        const result = await actions.linkAnalysis(nodeId, depth);
        if (result) {
          dispatch({ type: 'SET_HIGHLIGHT', payload: result.entities.map((e) => e.id) });
          dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { type: 'link', data: result } });
          message.success(`找到 ${result.entities.length} 个关联实体`);
        }
      } else if (key === 'focus') {
        dispatch({ type: 'SELECT_NODE', payload: nodeId });
        dispatch({ type: 'SET_HIGHLIGHT', payload: [nodeId] });
      } else if (key === 'clear') {
        dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: null });
      } else if (key === 'collapse') {
        const targets = getCollapseTargets(nodeId);
        if (targets.length === 0) {
          message.info('该节点没有可收缩的专属子实体');
          return;
        }
        const graph = graphRef.current?.graph;
        if (graph && !graph.get('destroyed')) {
          const targetSet = new Set(targets);
          const fadeOut = (item: any) => {
            const shapes = item?.getContainer()?.get('children');
            if (!shapes) return;
            shapes.forEach((s: any) => s.animate?.({ opacity: 0 }, { duration: 260, easing: 'easeCubicIn' }));
          };
          targets.forEach((id) => { const it = graph.findById(id); if (it) fadeOut(it); });
          graph.getEdges().forEach((edge: any) => {
            const m = edge.getModel();
            if (targetSet.has(m.source as string) || targetSet.has(m.target as string)) fadeOut(edge);
          });
          setTimeout(() => {
            dispatch({ type: 'COLLAPSE_NODE', payload: { nodeId, hiddenIds: targets } });
            message.success(`已收缩 ${targets.length} 个子实体`);
          }, 280);
        } else {
          dispatch({ type: 'COLLAPSE_NODE', payload: { nodeId, hiddenIds: targets } });
          message.success(`已收缩 ${targets.length} 个子实体`);
        }
      } else if (key === 'expand') {
        const hidden = state.collapsedNodes[nodeId];
        if (!hidden || hidden.length === 0) return;
        pendingExpandRef.current = [...hidden];
        dispatch({ type: 'EXPAND_NODE', payload: nodeId });
        message.success(`已扩展 ${hidden.length} 个子实体`);
      } else if (key === 'expand-all') {
        const allHidden = Object.values(state.collapsedNodes).flat();
        if (allHidden.length > 0) pendingExpandRef.current = allHidden;
        dispatch({ type: 'EXPAND_ALL' });
        message.success('已展开所有收缩节点');
      }
    },
    [ctxMenu, actions, dispatch, getCollapseTargets, state.collapsedNodes],
  );

  /* ── 拖放创建实体 ── */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/entity-type')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const raw = e.dataTransfer.getData('application/entity-type');
      if (!raw) return;
      try {
        const entityType = JSON.parse(raw);
        const graph = graphRef.current?.graph;
        const container = containerRef.current;
        if (!container) return;
        const rect = container.getBoundingClientRect();

        let canvasX = e.clientX - rect.left;
        let canvasY = e.clientY - rect.top;
        if (graph && !graph.get('destroyed')) {
          const point = graph.getPointByClient(e.clientX, e.clientY);
          canvasX = point.x;
          canvasY = point.y;
        }

        const label = `${entityType.name}${(state.entities.length + 1)}`;
        await actions.addEntity({
          typeId: entityType.id,
          label,
          properties: [],
          x: canvasX,
          y: canvasY,
        });
        message.success(`已创建实体「${label}」`);
      } catch (err) {
        console.error('Drop create entity failed:', err);
      }
    },
    [actions, state.entities.length],
  );

  /* ── 点击连线模式 ── */
  const exitLinkMode = useCallback(() => {
    dispatch({ type: 'SET_LINK_MODE', payload: false });
    dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
  }, [dispatch]);

  useEffect(() => {
    if (!state.linkMode) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') exitLinkMode(); };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [state.linkMode, exitLinkMode]);

  useEffect(() => {
    const graph = graphRef.current?.graph;
    if (!graph || graph.get('destroyed') || !state.linkMode) return;

    const handler = async (e: any) => {
      const nodeId = e.item?.getModel()?.id;
      if (!nodeId || nodeId.startsWith('_evt_') || nodeId.startsWith('_tail_')) return;

      if (!state.linkSource) {
        dispatch({ type: 'SET_LINK_SOURCE', payload: nodeId });
        dispatch({ type: 'SET_HIGHLIGHT', payload: [nodeId] });
        return;
      }

      if (nodeId === state.linkSource) {
        message.info('不能连接自身，请点击另一个节点');
        return;
      }

      const defaultRelType = state.relationTypes[0];
      if (!defaultRelType) {
        message.warning('请先添加关系类型');
        exitLinkMode();
        return;
      }

      const srcLabel = state.entities.find((en) => en.id === state.linkSource)?.label || '';
      const tgtLabel = state.entities.find((en) => en.id === nodeId)?.label || '';

      await actions.addRelationship({
        source: state.linkSource,
        target: nodeId,
        typeId: defaultRelType.id,
        label: defaultRelType.name,
        properties: [],
        directed: false,
      });
      message.success(`已创建关系：${srcLabel} → ${tgtLabel}`);
      dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
      dispatch({ type: 'SET_LINK_SOURCE', payload: null });
    };

    graph.on('node:click', handler);
    return () => { if (!graph.get('destroyed')) graph.off('node:click', handler); };
  });

  const hasData = graphinData.nodes.length > 0;
  const ready = size.w > 0 && size.h > 0;

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      style={{
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: tokens.bgGraph,
        transition: 'background 0.3s ease',
      }}
    >
      {!hasData ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: tokens.textDim,
            fontSize: 14,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12, opacity: 0.5 }}>◇</div>
            <div style={{ fontWeight: 500 }}>暂无数据</div>
            <div style={{ fontSize: 12, marginTop: 4, color: tokens.textDim }}>
              从左侧拖拽实体类型到画布创建实体
            </div>
          </div>
        </div>
      ) : ready ? (
        <div
          ref={graphWrapperRef}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0,
            transition: 'opacity 0.3s ease-out',
          }}
        >
          <Graphin
            key={layoutKey}
            data={graphinData}
            layout={layoutConfig}
            ref={graphRef}
            width={size.w}
            height={size.h}
            animate={false}
            fitViewPadding={20}
            theme={{ mode: tokens.bg.startsWith('#1') ? 'dark' : 'light', background: tokens.bgGraph }}
          >
            <DragCanvas enableOptimize />
            <ZoomCanvas enableOptimize />
            <DragNode />
            <ActivateRelations />
            <FitView />
          </Graphin>
        </div>
      ) : null}
      {/* GPU acceleration toggle */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: gpuAccel
            ? 'linear-gradient(135deg, rgba(82,196,26,0.15), rgba(82,196,26,0.08))'
            : tokens.minimapBg,
          backdropFilter: 'blur(8px)',
          padding: '4px 12px',
          borderRadius: 16,
          fontSize: 11,
          fontWeight: 500,
          color: gpuAccel ? '#52c41a' : tokens.textDim,
          boxShadow: tokens.shadowPanel,
          border: `1px solid ${gpuAccel ? 'rgba(82,196,26,0.3)' : 'transparent'}`,
          transition: 'all 0.3s ease',
          userSelect: 'none',
        }}
      >
        <ThunderboltOutlined style={{ fontSize: 13 }} />
        <span>GPU</span>
        <Tooltip title={gpuAccel ? 'GPU加速已开启（WebGL布局计算）' : 'GPU加速已关闭'}>
          <Switch
            size="small"
            checked={gpuAccel}
            onChange={(checked) => {
              setGpuAccel(checked);
              message.info(checked ? 'GPU加速已开启' : 'GPU加速已关闭', 1);
            }}
            style={gpuAccel ? { background: '#52c41a' } : undefined}
          />
        </Tooltip>
      </div>
      {state.linkMode && (
        <div
          style={{
            position: 'absolute',
            top: 44,
            right: 10,
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: tokens.primary,
            color: '#fff',
            padding: '5px 16px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 500,
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            animation: 'ctxFadeIn 0.15s ease-out',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'linkPulse 1.2s infinite' }} />
          {!state.linkSource ? '连线模式：点击源节点' : `已选源节点，请点击目标节点`}
          <span
            onClick={exitLinkMode}
            style={{ marginLeft: 4, cursor: 'pointer', opacity: 0.8, fontSize: 10 }}
          >
            ESC 退出
          </span>
          <style>{`@keyframes linkPulse { 0%,100% { opacity:1; } 50% { opacity:0.3; } }`}</style>
        </div>
      )}
      {hasData && ready && (
        <div
          ref={minimapContainerRef}
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: tokens.minimapBg,
            boxShadow: tokens.shadowPanel,
            borderRadius: 4,
            overflow: 'hidden',
            width: 200,
            height: 120,
            zIndex: 10,
            pointerEvents: 'auto',
            transition: 'background 0.3s, box-shadow 0.3s',
          }}
        />
      )}
      {ctxMenu && (
        <NodeContextMenu
          ref={ctxRef}
          x={ctxMenu.x}
          y={ctxMenu.y}
          nodeId={ctxMenu.nodeId}
          tokens={tokens}
          onAction={handleCtxAction}
          entityLabel={state.entities.find((e) => e.id === ctxMenu.nodeId)?.label}
          isCollapsed={collapsedParentIds.has(ctxMenu.nodeId)}
          hasNeighbors={getNeighborIds(ctxMenu.nodeId).some((id) => !hiddenNodeIds.has(id))}
          hasAnyCollapsed={collapsedParentIds.size > 0}
        />
      )}
    </div>
  );
};

interface CtxMenuProps {
  x: number;
  y: number;
  nodeId: string;
  tokens: ThemeTokens;
  onAction: (key: string) => void;
  entityLabel?: string;
  isCollapsed: boolean;
  hasNeighbors: boolean;
  hasAnyCollapsed: boolean;
}

const NodeContextMenu = React.forwardRef<HTMLDivElement, CtxMenuProps>(
  ({ x, y, tokens, onAction, entityLabel, isCollapsed, hasNeighbors, hasAnyCollapsed }, ref) => {
    const [hoverKey, setHoverKey] = useState<string | null>(null);

    type MenuItem = { key: string; icon: React.ReactNode; label: string; danger?: boolean; disabled?: boolean; group?: string };
    const items: MenuItem[] = [
      { key: 'focus', icon: <AimOutlined />, label: '聚焦节点', group: '视图' },
      { key: 'collapse', icon: <ShrinkOutlined />, label: '收缩节点', group: '视图', disabled: !hasNeighbors || isCollapsed },
      { key: 'expand', icon: <ArrowsAltOutlined />, label: '扩展节点', group: '视图', disabled: !isCollapsed },
      { key: 'expand-all', icon: <ExpandOutlined />, label: '展开全部', group: '视图', disabled: !hasAnyCollapsed },
      { key: 'clear', icon: <EyeInvisibleOutlined />, label: '清除高亮', group: '视图' },
      { key: 'link-1', icon: <ShareAltOutlined />, label: '1度关联分析', group: '分析' },
      { key: 'link-2', icon: <ShareAltOutlined />, label: '2度关联分析', group: '分析' },
      { key: 'link-3', icon: <HighlightOutlined />, label: '3度关联分析', group: '分析' },
      { key: 'delete', icon: <DeleteOutlined />, label: '删除实体', danger: true, group: '操作' },
    ];

    let lastGroup = '';

    return (
      <div
        ref={ref}
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          zIndex: 200,
          minWidth: 180,
          borderRadius: 10,
          background: tokens.bgPanel,
          boxShadow: `0 6px 24px rgba(0,0,0,0.15), 0 0 0 1px ${tokens.border}`,
          backdropFilter: 'blur(16px)',
          padding: '6px 0',
          animation: 'ctxFadeIn 0.12s ease-out',
          overflow: 'hidden',
        }}
      >
        <style>{`@keyframes ctxFadeIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }`}</style>

        {entityLabel && (
          <div
            style={{
              padding: '6px 14px 8px',
              fontSize: 12,
              fontWeight: 600,
              color: tokens.text,
              borderBottom: `1px solid ${tokens.border}`,
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {entityLabel}
          </div>
        )}

        {items.map((item) => {
          const showDivider = item.group !== lastGroup && lastGroup !== '';
          lastGroup = item.group || '';
          return (
            <React.Fragment key={item.key}>
              {showDivider && (
                <div style={{ height: 1, background: tokens.border, margin: '4px 10px' }} />
              )}
              <div
                onClick={() => !item.disabled && onAction(item.key)}
                onMouseEnter={() => setHoverKey(item.key)}
                onMouseLeave={() => setHoverKey(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '7px 14px',
                  cursor: item.disabled ? 'not-allowed' : 'pointer',
                  fontSize: 12,
                  opacity: item.disabled ? 0.35 : 1,
                  color: item.disabled
                    ? tokens.textMuted
                    : item.danger
                      ? '#f5222d'
                      : hoverKey === item.key
                        ? tokens.primary
                        : tokens.text,
                  background: !item.disabled && hoverKey === item.key ? tokens.primaryBg : 'transparent',
                  transition: 'all 0.1s',
                }}
              >
                <span style={{ fontSize: 14, width: 16, textAlign: 'center', opacity: 0.7 }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);

export default GraphCanvas;
