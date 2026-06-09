import React, { useState, useEffect } from 'react';
import { Input, Button, Space, message, Popconfirm } from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';
import type { Property } from '../types/graph';

const PropertyPanel: React.FC = () => {
  const { state, actions } = useGraph();
  const { tokens } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editProps, setEditProps] = useState<Property[]>([]);

  const selectedEntity = state.selectedNodeId
    ? state.entities.find((e) => e.id === state.selectedNodeId)
    : null;
  const selectedRelationship = state.selectedEdgeId
    ? state.relationships.find((r) => r.id === state.selectedEdgeId)
    : null;
  const selectedItem = selectedEntity || selectedRelationship;

  useEffect(() => {
    setEditing(false);
    if (selectedItem) {
      setEditLabel(selectedItem.label);
      setEditProps([...(selectedItem.properties || [])]);
    }
  }, [state.selectedNodeId, state.selectedEdgeId]);

  const handleSave = async () => {
    if (selectedEntity) {
      await actions.updateEntity({
        ...selectedEntity,
        label: editLabel,
        properties: editProps.filter((p) => p.key.trim()),
      });
    } else if (selectedRelationship) {
      await actions.updateRelationship({
        ...selectedRelationship,
        label: editLabel,
        properties: editProps.filter((p) => p.key.trim()),
      });
    }
    setEditing(false);
    message.success('保存成功');
  };

  const handleDelete = async () => {
    if (selectedEntity) {
      await actions.deleteEntity(selectedEntity.id);
      message.success('已删除');
    } else if (selectedRelationship) {
      await actions.deleteRelationship(selectedRelationship.id);
      message.success('已删除');
    }
  };

  const sectionStyle: React.CSSProperties = {
    padding: '12px 14px',
    borderBottom: `1px solid ${tokens.border}`,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: tokens.textMuted,
    marginBottom: 8,
    fontWeight: 600,
  };

  const renderAnalysisResult = () => {
    if (!state.analysisResult) return null;
    const { type, data } = state.analysisResult;

    if (type === 'sna' && data?.metrics) {
      const sorted = [...data.metrics].sort((a: any, b: any) => b.degreeCentrality - a.degreeCentrality);
      return (
        <div style={sectionStyle}>
          <div style={labelStyle}>社会网络分析</div>
          {sorted.slice(0, 10).map((m: any, i: number) => {
            const entity = state.entities.find((e) => e.id === m.entityId);
            return (
              <div
                key={m.entityId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  fontSize: 11,
                  borderBottom: `1px solid ${tokens.bgCard}`,
                }}
              >
                <span style={{ color: tokens.textSecondary }}>
                  {i + 1}. {entity?.label || m.entityId}
                </span>
                <span style={{ color: tokens.primary, fontFamily: 'monospace', fontSize: 10 }}>
                  {m.degreeCentrality.toFixed(3)}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    if (type === 'path' && data?.paths) {
      return (
        <div style={sectionStyle}>
          <div style={labelStyle}>路径分析 · {data.paths.length} 条</div>
          {data.paths.map((path: string[], idx: number) => (
            <div
              key={idx}
              style={{
                padding: 8,
                marginBottom: 6,
                background: tokens.bgCard,
                borderRadius: 6,
                border: `1px solid ${tokens.border}`,
              }}
            >
              <div style={{ fontSize: 10, color: tokens.textTertiary, marginBottom: 4 }}>
                路径 {idx + 1}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                {path.map((id: string, i: number) => {
                  const entity = state.entities.find((e) => e.id === id);
                  return (
                    <React.Fragment key={id}>
                      <span
                        style={{
                          background: tokens.primaryBg,
                          color: '#7b9aff',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                        }}
                      >
                        {entity?.label || id}
                      </span>
                      {i < path.length - 1 && (
                        <span style={{ color: tokens.textDim, fontSize: 10 }}>→</span>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (type === 'cluster' && data?.clusters) {
      const groups: Record<number, string[]> = {};
      Object.entries(data.clusters).forEach(([id, cid]) => {
        const c = cid as number;
        if (!groups[c]) groups[c] = [];
        groups[c].push(id);
      });
      const colors = ['#4f6ef7', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#eb2f96', '#13c2c2'];
      return (
        <div style={sectionStyle}>
          <div style={labelStyle}>群集分析 · {Object.keys(groups).length} 个</div>
          {Object.entries(groups).map(([cid, ids], idx) => (
            <div
              key={cid}
              style={{
                padding: 8,
                marginBottom: 6,
                background: tokens.bgCard,
                borderRadius: 6,
                borderLeft: `3px solid ${colors[idx % colors.length]}`,
              }}
            >
              <div style={{ fontSize: 10, color: tokens.textTertiary, marginBottom: 4 }}>
                群集 {idx + 1} · {ids.length} 成员
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {ids.map((id) => {
                  const entity = state.entities.find((e) => e.id === id);
                  return (
                    <span
                      key={id}
                      style={{
                        background: `${colors[idx % colors.length]}18`,
                        color: colors[idx % colors.length],
                        padding: '1px 6px',
                        borderRadius: 4,
                        fontSize: 11,
                      }}
                    >
                      {entity?.label || id}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (type === 'link' && data) {
      return (
        <div style={sectionStyle}>
          <div style={labelStyle}>链接分析</div>
          <div style={{ fontSize: 12, color: tokens.textTertiary }}>
            关联实体 {data.entities?.length || 0} · 关联关系 {data.relationships?.length || 0}
          </div>
        </div>
      );
    }

    return null;
  };

  if (!selectedItem && !state.analysisResult) {
    return (
      <div
        style={{
          width: 280,
          minWidth: 280,
          background: tokens.bgPanel,
          borderLeft: `1px solid ${tokens.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: tokens.textDim,
          fontSize: 12,
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        选择实体或关系查看详情
      </div>
    );
  }

  const entityType = selectedEntity
    ? state.entityTypes.find((t) => t.id === selectedEntity.typeId)
    : null;
  const relationType = selectedRelationship
    ? state.relationTypes.find((t) => t.id === selectedRelationship.typeId)
    : null;

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        background: tokens.bgPanel,
        borderLeft: `1px solid ${tokens.border}`,
        overflow: 'auto',
        height: '100%',
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      {selectedItem && (
        <>
          <div
            style={{
              ...sectionStyle,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${entityType?.color || relationType?.color || '#555'}, ${entityType?.color || relationType?.color || '#555'}aa)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: `0 3px 8px ${entityType?.color || '#000'}44`,
              }}
            >
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>
                {entityType?.name?.charAt(0) || relationType?.name?.charAt(0) || '?'}
              </span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              {editing ? (
                <Input
                  size="small"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  style={{
                    background: tokens.bgInput,
                    borderColor: tokens.borderInput,
                  }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: tokens.text,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {selectedItem.label}
                </div>
              )}
              <div style={{ fontSize: 11, color: tokens.textTertiary, marginTop: 2 }}>
                {entityType?.name || relationType?.name} · {selectedItem.id.substring(0, 8)}
              </div>
            </div>
            <Space size={2}>
              {editing ? (
                <>
                  <Button size="small" type="primary" icon={<SaveOutlined />} onClick={handleSave} />
                  <Button size="small" icon={<CloseOutlined />} onClick={() => setEditing(false)} />
                </>
              ) : (
                <>
                  <Button size="small" type="text" icon={<EditOutlined />} onClick={() => setEditing(true)} style={{ color: tokens.textTertiary }} />
                  <Popconfirm title="确认删除？" onConfirm={handleDelete}>
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </>
              )}
            </Space>
          </div>

          {selectedRelationship && (
            <div style={sectionStyle}>
              <div style={labelStyle}>连接</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <span style={{ color: '#7b9aff' }}>
                  {state.entities.find((e) => e.id === selectedRelationship.source)?.label}
                </span>
                <span style={{ color: tokens.textMuted }}>
                  {selectedRelationship.directed ? '→' : '—'}
                </span>
                <span style={{ color: '#7b9aff' }}>
                  {state.entities.find((e) => e.id === selectedRelationship.target)?.label}
                </span>
              </div>
            </div>
          )}

          <div style={sectionStyle}>
            <div
              style={{
                ...labelStyle,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>属性</span>
              {editing && (
                <Button
                  size="small"
                  type="text"
                  icon={<PlusOutlined />}
                  onClick={() => setEditProps([...editProps, { key: '', value: '' }])}
                  style={{ color: tokens.textTertiary, fontSize: 10 }}
                >
                  添加
                </Button>
              )}
            </div>
            {editing
              ? editProps.map((prop, i) => (
                  <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <Input
                      size="small"
                      placeholder="名"
                      value={prop.key}
                      onChange={(e) => {
                        const u = [...editProps];
                        u[i] = { ...u[i], key: e.target.value };
                        setEditProps(u);
                      }}
                      style={{ width: 80, background: tokens.bgInput, borderColor: tokens.borderInput }}
                    />
                    <Input
                      size="small"
                      placeholder="值"
                      value={prop.value}
                      onChange={(e) => {
                        const u = [...editProps];
                        u[i] = { ...u[i], value: e.target.value };
                        setEditProps(u);
                      }}
                      style={{ flex: 1, background: tokens.bgInput, borderColor: tokens.borderInput }}
                    />
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      onClick={() => setEditProps(editProps.filter((_, j) => j !== i))}
                    />
                  </div>
                ))
              : selectedItem.properties?.length
                ? selectedItem.properties.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 0',
                        borderBottom: `1px solid ${tokens.bgCard}`,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: tokens.textTertiary }}>{p.key}</span>
                      <span style={{ color: tokens.textSecondary }}>{p.value}</span>
                    </div>
                  ))
                : (
                    <div style={{ fontSize: 11, color: tokens.textDim }}>暂无属性</div>
                  )}
          </div>
        </>
      )}

      {renderAnalysisResult()}
    </div>
  );
};

export default PropertyPanel;
