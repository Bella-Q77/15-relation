import React, { useState } from 'react';
import { Tooltip, Popover, message } from 'antd';
import {
  CompressOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  PlusOutlined,
  ApartmentOutlined,
  DeleteOutlined,
  LayoutOutlined,
  BulbOutlined,
  ClearOutlined,
  DoubleLeftOutlined,
  DoubleRightOutlined,
  NodeIndexOutlined,
  RadarChartOutlined,
  ClusterOutlined,
  ShareAltOutlined,
  ForkOutlined,
  CameraOutlined,
  HistoryOutlined,
  ExportOutlined,
  FileTextOutlined,
  PictureOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';
import { LAYOUT_OPTIONS } from '../types/graph';
import type { LayoutType } from '../types/graph';

interface CanvasToolbarProps {
  onAddEntity: () => void;
  onAddRelationship: () => void;
  onPathAnalysis: () => void;
  onToggleHistory?: () => void;
}

const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  onAddEntity,
  onAddRelationship,
  onPathAnalysis,
  onToggleHistory,
}) => {
  const { state, dispatch, actions } = useGraph();
  const { tokens, mode, toggle } = useTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [layoutPopOpen, setLayoutPopOpen] = useState(false);
  const [exportPopOpen, setExportPopOpen] = useState(false);
  const [dataExportPopOpen, setDataExportPopOpen] = useState(false);

  const isDark = mode === 'dark';
  const barBg = isDark ? 'rgba(32,36,44,0.92)' : 'rgba(255,255,255,0.92)';

  const emit = (event: string) => {
    const runtime = (window as any).runtime;
    if (runtime?.EventsEmit) runtime.EventsEmit(event);
  };

  const handleLayout = (type: LayoutType) => {
    dispatch({ type: 'SET_LAYOUT', payload: type });
    setLayoutPopOpen(false);
  };

  const handleClearAnalysis = () => {
    dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
    dispatch({ type: 'SET_ANALYSIS_RESULT', payload: null });
  };

  const handleExportAnalysisJSON = () => {
    const result = state.analysisResult;
    if (!result) return;

    const highlightSet = new Set(state.highlightIds);
    const analysisType = result.type as string;

    let exportEntities = state.entities;
    let exportRelationships = state.relationships;
    let summary: Record<string, any> = { type: analysisType };

    if (analysisType === 'link') {
      exportEntities = state.entities.filter((e) => highlightSet.has(e.id));
      const eIds = new Set(exportEntities.map((e) => e.id));
      exportRelationships = state.relationships.filter((r) => eIds.has(r.source) && eIds.has(r.target));
      summary.entityCount = exportEntities.length;
      summary.relationshipCount = exportRelationships.length;
    } else if (analysisType === 'path') {
      const pathNodes = new Set<string>();
      (result.data?.paths as string[][] || []).forEach((p: string[]) => p.forEach((id: string) => pathNodes.add(id)));
      exportEntities = state.entities.filter((e) => pathNodes.has(e.id));
      const highlightEdges = new Set(result.data?.highlightEdges || []);
      exportRelationships = state.relationships.filter((r) => highlightEdges.has(r.id));
      summary.paths = result.data?.paths;
      summary.entityCount = exportEntities.length;
      summary.relationshipCount = exportRelationships.length;
    } else if (analysisType === 'cluster') {
      summary.clusters = result.data?.clusters;
      summary.clusterCount = new Set(Object.values(result.data?.clusters || {})).size;
    } else if (analysisType === 'sna') {
      summary.metrics = result.data?.metrics;
    }

    const exportData = {
      analysisType,
      summary,
      entities: exportEntities.map((e) => ({
        id: e.id,
        label: e.label,
        type: state.entityTypes.find((t) => t.id === e.typeId)?.name || e.typeId,
        properties: e.properties,
        ...(analysisType === 'cluster' ? { clusterId: (result.data?.clusters || {})[e.id] } : {}),
        ...(analysisType === 'sna' ? { metrics: (result.data?.metrics || []).find((m: any) => m.entityId === e.id) } : {}),
      })),
      relationships: exportRelationships.map((r) => ({
        id: r.id,
        source: r.source,
        target: r.target,
        label: r.label,
        type: state.relationTypes.find((t) => t.id === r.typeId)?.name || r.typeId,
        properties: r.properties,
      })),
      exportedAt: new Date().toISOString(),
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const backend = (window as any)?.go?.main?.App;
    if (backend?.SaveFileDialog && backend?.WriteFile) {
      const defaultName = `analysis-${analysisType}-${new Date().toISOString().slice(0, 10)}.json`;
      backend.SaveFileDialog('导出分析结果', defaultName, [
        { DisplayName: 'JSON 文件 (*.json)', Pattern: '*.json' },
        { DisplayName: '所有文件 (*.*)', Pattern: '*.*' },
      ]).then((filePath: string) => {
        if (!filePath) return;
        backend.WriteFile(filePath, jsonContent).then((ok: boolean) => {
          if (ok) message.success(`分析结果已导出到: ${filePath}`);
          else message.error('导出失败');
        });
      });
    } else {
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analysis-${analysisType}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      message.success('分析结果已导出');
    }
  };

  const handleDelete = async () => {
    if (state.selectedNodeId) {
      await actions.deleteEntity(state.selectedNodeId);
    } else if (state.selectedEdgeId) {
      await actions.deleteRelationship(state.selectedEdgeId);
    }
  };

  const exportFormatItems = [
    { key: 'json', icon: <FileTextOutlined />, label: 'JSON 数据', desc: '实体、关系、分析指标' },
    { key: 'png', icon: <PictureOutlined />, label: 'PNG 图片', desc: '导出当前画布截图' },
    { key: 'svg', icon: <FileImageOutlined />, label: 'SVG 矢量图', desc: '可缩放矢量格式' },
  ];

  const exportAnalysisContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160 }}>
      {exportFormatItems.map((item) => (
        <div
          key={item.key}
          onClick={() => {
            setExportPopOpen(false);
            if (item.key === 'json') handleExportAnalysisJSON();
            else if (item.key === 'png') emit('graph:export-png');
            else if (item.key === 'svg') emit('graph:export-svg');
          }}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: tokens.text,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = tokens.primaryBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 14, color: tokens.primary }}>{item.icon}</span>
          <div>
            <div style={{ fontWeight: 500 }}>{item.label}</div>
            <div style={{ fontSize: 10, color: tokens.textDim, marginTop: 1 }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const handleExportDataJSON = async () => {
    const json = await actions.exportJSON();
    if (!json) return;
    const backend = (window as any)?.go?.main?.App;
    if (backend?.SaveFileDialog && backend?.WriteFile) {
      const defaultName = `graph-data-${new Date().toISOString().slice(0, 10)}.json`;
      backend.SaveFileDialog('导出图数据', defaultName, [
        { DisplayName: 'JSON 文件 (*.json)', Pattern: '*.json' },
      ]).then((filePath: string) => {
        if (!filePath) return;
        backend.WriteFile(filePath, json).then((ok: boolean) => {
          if (ok) message.success(`数据已导出到: ${filePath}`);
          else message.error('导出失败');
        });
      });
    } else {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graph-data.json';
      a.click();
      URL.revokeObjectURL(url);
      message.success('数据已导出');
    }
  };

  const dataExportItems = [
    { key: 'json', icon: <FileTextOutlined />, label: 'JSON 数据', desc: '全量实体与关系数据' },
    { key: 'png', icon: <PictureOutlined />, label: 'PNG 图片', desc: '导出当前画布截图' },
    { key: 'svg', icon: <FileImageOutlined />, label: 'SVG 矢量图', desc: '可缩放矢量格式' },
  ];

  const dataExportContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 160 }}>
      {dataExportItems.map((item) => (
        <div
          key={item.key}
          onClick={() => {
            setDataExportPopOpen(false);
            if (item.key === 'json') handleExportDataJSON();
            else if (item.key === 'png') emit('graph:export-png');
            else if (item.key === 'svg') emit('graph:export-svg');
          }}
          style={{
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: tokens.text,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = tokens.primaryBg)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span style={{ fontSize: 14, color: tokens.primary }}>{item.icon}</span>
          <div>
            <div style={{ fontWeight: 500 }}>{item.label}</div>
            <div style={{ fontSize: 10, color: tokens.textDim, marginTop: 1 }}>{item.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const layoutContent = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 120 }}>
      {LAYOUT_OPTIONS.map((opt) => (
        <div
          key={opt.type}
          onClick={() => handleLayout(opt.type)}
          style={{
            padding: '5px 10px',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 12,
            color: state.layoutType === opt.type ? tokens.primary : tokens.text,
            fontWeight: state.layoutType === opt.type ? 600 : 400,
            background: state.layoutType === opt.type ? tokens.primaryBg : 'transparent',
            transition: 'all 0.15s',
          }}
        >
          {opt.label}
        </div>
      ))}
    </div>
  );

  type ToolItem =
    | { type: 'button'; icon: React.ReactNode; label: string; onClick: () => void; active?: boolean; danger?: boolean; disabled?: boolean }
    | { type: 'divider' }
    | { type: 'popover'; icon: React.ReactNode; label: string; content: React.ReactNode; open: boolean; onOpenChange: (v: boolean) => void; disabled?: boolean };

  const tools: ToolItem[] = [
    { type: 'button', icon: <CompressOutlined />, label: '适配画布', onClick: () => emit('graph:fit-view') },
    { type: 'button', icon: <ZoomInOutlined />, label: '放大', onClick: () => emit('graph:zoom-in') },
    { type: 'button', icon: <ZoomOutOutlined />, label: '缩小', onClick: () => emit('graph:zoom-out') },
    { type: 'divider' },
    { type: 'button', icon: <PlusOutlined />, label: '添加实体', onClick: onAddEntity },
    { type: 'button', icon: <ApartmentOutlined />, label: '添加关系', onClick: onAddRelationship },
    { type: 'button', icon: <NodeIndexOutlined />, label: state.linkMode ? '退出连线' : '连线模式', onClick: () => dispatch({ type: 'SET_LINK_MODE' as any, payload: !state.linkMode }), active: state.linkMode },
    { type: 'button', icon: <DeleteOutlined />, label: '删除选中', onClick: handleDelete, danger: true, disabled: !state.selectedNodeId && !state.selectedEdgeId },
    { type: 'divider' },
    { type: 'popover', icon: <LayoutOutlined />, label: '布局', content: layoutContent, open: layoutPopOpen, onOpenChange: setLayoutPopOpen },
    { type: 'divider' },
    { type: 'button', icon: <ShareAltOutlined />, label: '链接分析', onClick: async () => {
      if (!state.selectedNodeId) return;
      const result = await actions.linkAnalysis(state.selectedNodeId, 2);
      if (result) {
        dispatch({ type: 'SET_HIGHLIGHT', payload: result.entities.map((e) => e.id) });
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { type: 'link', data: result } });
      }
    }, disabled: !state.selectedNodeId },
    { type: 'button', icon: <ForkOutlined />, label: '路径分析', onClick: onPathAnalysis },
    { type: 'button', icon: <ClusterOutlined />, label: '群集分析', onClick: async () => {
      const result = await actions.clusterAnalysis();
      if (result) {
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { type: 'cluster', data: result } });
        dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
      }
    }, disabled: state.entities.length === 0 },
    { type: 'button', icon: <RadarChartOutlined />, label: 'SNA分析', onClick: async () => {
      const result = await actions.snaAnalysis();
      if (result) {
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { type: 'sna', data: result } });
        dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
      }
    }, disabled: state.entities.length === 0 },
    { type: 'button', icon: <ClearOutlined />, label: '清除分析', onClick: handleClearAnalysis, disabled: !state.analysisResult },
    { type: 'popover', icon: <ExportOutlined />, label: '导出分析结果', content: exportAnalysisContent, open: exportPopOpen, onOpenChange: setExportPopOpen, disabled: !state.analysisResult },
    { type: 'divider' },
    { type: 'popover', icon: <CameraOutlined />, label: '导出数据', content: dataExportContent, open: dataExportPopOpen, onOpenChange: setDataExportPopOpen, disabled: state.entities.length === 0 },
    { type: 'button', icon: <HistoryOutlined />, label: '历史记录', onClick: () => onToggleHistory?.() },
    { type: 'divider' },
    { type: 'button', icon: <BulbOutlined />, label: isDark ? '明亮模式' : '暗黑模式', onClick: toggle, active: isDark },
  ];

  if (collapsed) {
    return (
      <div
        style={{
          position: 'absolute',
          left: 8,
          top: 10,
          zIndex: 20,
        }}
      >
        <Tooltip title="展开工具栏" placement="right">
          <div
            onClick={() => setCollapsed(false)}
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: barBg,
              backdropFilter: 'blur(12px)',
              boxShadow: tokens.shadowPanel,
              border: `1px solid ${tokens.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: tokens.textMuted,
              fontSize: 12,
              transition: 'all 0.2s',
            }}
          >
            <DoubleRightOutlined />
          </div>
        </Tooltip>
      </div>
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: 8,
        top: 10,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        padding: '6px 0',
        borderRadius: 10,
        background: barBg,
        backdropFilter: 'blur(12px)',
        boxShadow: tokens.shadowPanel,
        border: `1px solid ${tokens.border}`,
        transition: 'background 0.3s, box-shadow 0.3s',
      }}
    >
      <Tooltip title="收起工具栏" placement="right">
        <div
          onClick={() => setCollapsed(true)}
          style={{
            width: 32,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: tokens.textDim,
            fontSize: 10,
            marginBottom: 2,
          }}
        >
          <DoubleLeftOutlined />
        </div>
      </Tooltip>

      {tools.map((item, idx) => {
        if (item.type === 'divider') {
          return (
            <div
              key={`d-${idx}`}
              style={{
                width: 20,
                height: 1,
                background: tokens.border,
                margin: '3px 0',
              }}
            />
          );
        }

        if (item.type === 'popover') {
          if (item.disabled) {
            return (
              <Tooltip key={idx} title={item.label} placement="right">
                <div style={toolBtnStyle(tokens, false, true, false)}>
                  {item.icon}
                </div>
              </Tooltip>
            );
          }
          return (
            <Popover
              key={idx}
              content={item.content}
              trigger="click"
              placement="rightTop"
              open={item.open}
              onOpenChange={item.onOpenChange}
            >
              <Tooltip title={item.label} placement="right">
                <div style={toolBtnStyle(tokens, false, false, false)}>
                  {item.icon}
                </div>
              </Tooltip>
            </Popover>
          );
        }

        return (
          <Tooltip key={idx} title={item.label} placement="right">
            <div
              onClick={item.disabled ? undefined : item.onClick}
              style={toolBtnStyle(tokens, !!item.danger, !!item.disabled, !!item.active)}
            >
              {item.icon}
            </div>
          </Tooltip>
        );
      })}
    </div>
  );
};

function toolBtnStyle(
  tokens: any,
  danger: boolean,
  disabled: boolean,
  active: boolean,
): React.CSSProperties {
  return {
    width: 32,
    height: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'not-allowed' : 'pointer',
    color: disabled
      ? tokens.textDim
      : danger
        ? '#f5222d'
        : active
          ? tokens.primary
          : tokens.textTertiary,
    fontSize: 14,
    borderRadius: 6,
    transition: 'all 0.15s',
    opacity: disabled ? 0.4 : 1,
  };
}

export default CanvasToolbar;
