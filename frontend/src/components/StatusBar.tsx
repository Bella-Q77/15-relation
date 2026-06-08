import React from 'react';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';
import { LAYOUT_OPTIONS } from '../types/graph';

const StatusBar: React.FC = () => {
  const { state } = useGraph();
  const { tokens } = useTheme();
  const layoutLabel = LAYOUT_OPTIONS.find((l) => l.type === state.layoutType)?.label || '力导向';

  return (
    <div
      style={{
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        background: tokens.bgStatusBar,
        borderTop: `1px solid ${tokens.border}`,
        fontSize: 11,
        color: tokens.textTertiary,
        flexShrink: 0,
        gap: 16,
        transition: 'background 0.3s, border-color 0.3s, color 0.3s',
      }}
    >
      <div style={{ display: 'flex', gap: 16 }}>
        <span>实体: {state.entities.length}</span>
        <span>关系: {state.relationships.length}</span>
        {state.analysisResult && (
          <span style={{ color: tokens.primary }}>
            {state.analysisResult.type === 'cluster' && '群集分析'}
            {state.analysisResult.type === 'sna' && 'SNA分析'}
            {state.analysisResult.type === 'link' && '链接分析'}
            {state.analysisResult.type === 'path' && '路径分析'}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <span>布局: {layoutLabel}</span>
        {state.selectedNodeId && (
          <span style={{ color: tokens.primary }}>
            已选: {state.entities.find((e) => e.id === state.selectedNodeId)?.label}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
