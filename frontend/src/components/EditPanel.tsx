import React, { useState, useEffect, useMemo } from 'react';
import { Input, Button, Space, message, Popconfirm, Select, Switch, Divider } from 'antd';
import {
  EditOutlined,
  SaveOutlined,
  CloseOutlined,
  PlusOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  ShareAltOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';
import type { Property, Entity, Relationship, RelationType } from '../types/graph';

interface EditingRelationship {
  id?: string;
  sourceEntityId: string | null;
  sourceLabel: string;
  targetEntityId: string | null;
  targetLabel: string;
  typeId: string;
  label: string;
  properties: Property[];
  directed: boolean;
}

const EditPanel: React.FC = () => {
  const { state, actions } = useGraph();
  const { tokens } = useTheme();
  const [editing, setEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editProps, setEditProps] = useState<Property[]>([]);

  const [showRelationshipManager, setShowRelationshipManager] = useState(false);
  const [editingRelationship, setEditingRelationship] = useState<EditingRelationship | null>(null);
  const [editingRelProps, setEditingRelProps] = useState<Property[]>([]);

  const [sourceInputValue, setSourceInputValue] = useState('');
  const [targetInputValue, setTargetInputValue] = useState('');

  const selectedEntity = state.selectedNodeId
    ? state.entities.find((e) => e.id === state.selectedNodeId)
    : null;
  const selectedRelationship = state.selectedEdgeId
    ? state.relationships.find((r) => r.id === state.selectedEdgeId)
    : null;
  const selectedItem = selectedEntity || selectedRelationship;

  const entityLabelMap = useMemo(() => {
    const map = new Map<string, Entity>();
    state.entities.forEach((e) => map.set(e.label, e));
    return map;
  }, [state.entities]);

  useEffect(() => {
    setEditing(false);
    if (selectedItem) {
      setEditLabel(selectedItem.label);
      setEditProps([...(selectedItem.properties || [])]);
    }
  }, [state.selectedNodeId, state.selectedEdgeId]);

  useEffect(() => {
    if (state.selectedEntityForSource && editingRelationship) {
      const entity = state.selectedEntityForSource;
      setEditingRelationship({
        ...editingRelationship,
        sourceEntityId: entity.id,
        sourceLabel: entity.label,
      });
      setSourceInputValue(entity.label);
    }
  }, [state.selectedEntityForSource]);

  useEffect(() => {
    if (state.selectedEntityForTarget && editingRelationship) {
      const entity = state.selectedEntityForTarget;
      setEditingRelationship({
        ...editingRelationship,
        targetEntityId: entity.id,
        targetLabel: entity.label,
      });
      setTargetInputValue(entity.label);
    }
  }, [state.selectedEntityForTarget]);

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

  const startAddRelationship = () => {
    const defaultType = state.relationTypes[0];
    setEditingRelationship({
      sourceEntityId: null,
      sourceLabel: '',
      targetEntityId: null,
      targetLabel: '',
      typeId: defaultType?.id || 'associate',
      label: defaultType?.name || '',
      properties: [],
      directed: false,
    });
    setEditingRelProps([]);
    setSourceInputValue('');
    setTargetInputValue('');
    actions.clearEntitySelection();
  };

  const startEditRelationship = (rel: Relationship) => {
    const sourceEntity = state.entities.find((e) => e.id === rel.source);
    const targetEntity = state.entities.find((e) => e.id === rel.target);
    setEditingRelationship({
      id: rel.id,
      sourceEntityId: rel.source,
      sourceLabel: sourceEntity?.label || '',
      targetEntityId: rel.target,
      targetLabel: targetEntity?.label || '',
      typeId: rel.typeId,
      label: rel.label,
      properties: [...(rel.properties || [])],
      directed: rel.directed,
    });
    setEditingRelProps([...(rel.properties || [])]);
    setSourceInputValue(sourceEntity?.label || '');
    setTargetInputValue(targetEntity?.label || '');
    actions.clearEntitySelection();
  };

  const cancelEditRelationship = () => {
    setEditingRelationship(null);
    setEditingRelProps([]);
    setSourceInputValue('');
    setTargetInputValue('');
    actions.clearEntitySelection();
    actions.setSelectingEntityTarget(null);
  };

  const resolveEntityFromLabel = (label: string): Entity | null => {
    return entityLabelMap.get(label) || null;
  };

  const saveRelationship = async () => {
    if (!editingRelationship) return;

    let sourceEntity: Entity | null = null;
    let targetEntity: Entity | null = null;

    if (editingRelationship.sourceEntityId) {
      sourceEntity = state.entities.find((e) => e.id === editingRelationship.sourceEntityId) || null;
    }
    if (!sourceEntity && sourceInputValue.trim()) {
      sourceEntity = resolveEntityFromLabel(sourceInputValue.trim());
    }

    if (editingRelationship.targetEntityId) {
      targetEntity = state.entities.find((e) => e.id === editingRelationship.targetEntityId) || null;
    }
    if (!targetEntity && targetInputValue.trim()) {
      targetEntity = resolveEntityFromLabel(targetInputValue.trim());
    }

    if (!sourceEntity) {
      message.error('源实体不能为空，请输入有效的实体名称或从画布选择');
      return;
    }
    if (!targetEntity) {
      message.error('目标实体不能为空，请输入有效的实体名称或从画布选择');
      return;
    }
    if (sourceEntity.id === targetEntity.id) {
      message.error('源实体和目标实体不能相同');
      return;
    }

    const properties: Property[] = editingRelProps
      .filter((p) => p.key.trim())
      .map((p) => ({ key: p.key.trim(), value: p.value || '' }));

    if (editingRelationship.id) {
      await actions.updateRelationship({
        id: editingRelationship.id,
        source: sourceEntity.id,
        target: targetEntity.id,
        typeId: editingRelationship.typeId,
        label: editingRelationship.label.trim(),
        properties,
        directed: editingRelationship.directed,
      });
      message.success('关系已更新');
    } else {
      await actions.addRelationship({
        source: sourceEntity.id,
        target: targetEntity.id,
        typeId: editingRelationship.typeId,
        label: editingRelationship.label.trim(),
        properties,
        directed: editingRelationship.directed,
      });
      message.success('关系已添加');
    }

    cancelEditRelationship();
  };

  const deleteRelationship = async (relId: string) => {
    await actions.deleteRelationship(relId);
    message.success('关系已删除');
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

  const inputStyle: React.CSSProperties = {
    background: tokens.bgInput,
    borderColor: tokens.borderInput,
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

  const renderRelationshipManager = () => {
    if (!showRelationshipManager) {
      return (
        <div style={sectionStyle}>
          <Button
            type="text"
            icon={<ShareAltOutlined />}
            onClick={() => setShowRelationshipManager(true)}
            style={{ width: '100%', justifyContent: 'flex-start', color: tokens.textSecondary }}
          >
            关系管理
          </Button>
        </div>
      );
    }

    if (editingRelationship) {
      return (
        <div style={sectionStyle}>
          <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{editingRelationship.id ? '编辑关系' : '添加关系'}</span>
            <Button
              size="small"
              type="text"
              icon={<CloseOutlined />}
              onClick={cancelEditRelationship}
              style={{ color: tokens.textMuted }}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4 }}>
              源实体
              {state.selectingEntityTarget === 'source' && (
                <span style={{ color: tokens.primary, marginLeft: 4 }}>(点击画布选择)</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Input
                size="small"
                value={sourceInputValue}
                onChange={(e) => setSourceInputValue(e.target.value)}
                placeholder="输入实体名称或点击画布选择"
                style={{ ...inputStyle, flex: 1 }}
              />
              <Button
                size="small"
                type={state.selectingEntityTarget === 'source' ? 'primary' : 'default'}
                icon={<LeftOutlined />}
                onClick={() => {
                  if (state.selectingEntityTarget === 'source') {
                    actions.setSelectingEntityTarget(null);
                  } else {
                    actions.setSelectingEntityTarget('source');
                  }
                }}
              />
            </div>
            {sourceInputValue.trim() && !resolveEntityFromLabel(sourceInputValue.trim()) && (
              <div style={{ fontSize: 10, color: '#faad14', marginTop: 2 }}>
                提示：当前输入的名称未匹配到现有实体
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4 }}>
              目标实体
              {state.selectingEntityTarget === 'target' && (
                <span style={{ color: tokens.primary, marginLeft: 4 }}>(点击画布选择)</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <Input
                size="small"
                value={targetInputValue}
                onChange={(e) => setTargetInputValue(e.target.value)}
                placeholder="输入实体名称或点击画布选择"
                style={{ ...inputStyle, flex: 1 }}
              />
              <Button
                size="small"
                type={state.selectingEntityTarget === 'target' ? 'primary' : 'default'}
                icon={<RightOutlined />}
                onClick={() => {
                  if (state.selectingEntityTarget === 'target') {
                    actions.setSelectingEntityTarget(null);
                  } else {
                    actions.setSelectingEntityTarget('target');
                  }
                }}
              />
            </div>
            {targetInputValue.trim() && !resolveEntityFromLabel(targetInputValue.trim()) && (
              <div style={{ fontSize: 10, color: '#faad14', marginTop: 2 }}>
                提示：当前输入的名称未匹配到现有实体
              </div>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4 }}>关系类型</div>
            <Select
              size="small"
              value={editingRelationship.typeId}
              onChange={(v) => setEditingRelationship({ ...editingRelationship, typeId: v })}
              style={{ width: '100%' }}
            >
              {state.relationTypes.map((type) => (
                <Select.Option key={type.id} value={type.id}>
                  <Space>
                    <span
                      style={{
                        display: 'inline-block',
                        width: 12,
                        height: 3,
                        backgroundColor: type.color,
                      }}
                    />
                    {type.name}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4 }}>标签</div>
            <Input
              size="small"
              value={editingRelationship.label}
              onChange={(e) => setEditingRelationship({ ...editingRelationship, label: e.target.value })}
              placeholder="关系描述"
              style={inputStyle}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: tokens.textMuted }}>有向关系</span>
              <Switch
                size="small"
                checked={editingRelationship.directed}
                onChange={(v) => setEditingRelationship({ ...editingRelationship, directed: v })}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: 11, color: tokens.textMuted }}>属性</span>
              <Button
                size="small"
                type="text"
                icon={<PlusOutlined />}
                onClick={() => setEditingRelProps([...editingRelProps, { key: '', value: '' }])}
                style={{ fontSize: 10 }}
              >
                添加
              </Button>
            </div>
            {editingRelProps.map((prop, i) => (
              <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                <Input
                  size="small"
                  placeholder="名"
                  value={prop.key}
                  onChange={(e) => {
                    const u = [...editingRelProps];
                    u[i] = { ...u[i], key: e.target.value };
                    setEditingRelProps(u);
                  }}
                  style={{ width: 80, ...inputStyle }}
                />
                <Input
                  size="small"
                  placeholder="值"
                  value={prop.value}
                  onChange={(e) => {
                    const u = [...editingRelProps];
                    u[i] = { ...u[i], value: e.target.value };
                    setEditingRelProps(u);
                  }}
                  style={{ flex: 1, ...inputStyle }}
                />
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<MinusCircleOutlined />}
                  onClick={() => setEditingRelProps(editingRelProps.filter((_, j) => j !== i))}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <Button type="primary" size="small" onClick={saveRelationship} style={{ flex: 1 }}>
              保存
            </Button>
            <Button size="small" onClick={cancelEditRelationship}>
              取消
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div style={sectionStyle}>
        <div style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>关系管理</span>
          <Space size={2}>
            <Button size="small" type="text" icon={<PlusOutlined />} onClick={startAddRelationship}>
              添加
            </Button>
            <Button
              size="small"
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setShowRelationshipManager(false)}
              style={{ color: tokens.textMuted }}
            />
          </Space>
        </div>

        {state.relationships.length === 0 ? (
          <div style={{ fontSize: 11, color: tokens.textDim, padding: '8px 0' }}>
            暂无关系，点击上方按钮添加
          </div>
        ) : (
          <div style={{ maxHeight: 300, overflow: 'auto' }}>
            {state.relationships.map((rel) => {
              const sourceEntity = state.entities.find((e) => e.id === rel.source);
              const targetEntity = state.entities.find((e) => e.id === rel.target);
              const relType = state.relationTypes.find((t) => t.id === rel.typeId);

              return (
                <div
                  key={rel.id}
                  style={{
                    padding: '6px 8px',
                    marginBottom: 4,
                    background: tokens.bgCard,
                    borderRadius: 4,
                    border: `1px solid ${tokens.border}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: tokens.textSecondary, fontWeight: 500 }}>
                      {rel.label || relType?.name || '关系'}
                    </span>
                    <Space size={2}>
                      <Button
                        size="small"
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => startEditRelationship(rel)}
                        style={{ fontSize: 10 }}
                      />
                      <Popconfirm title="确认删除此关系？" onConfirm={() => deleteRelationship(rel.id)}>
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          style={{ fontSize: 10 }}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                  <div style={{ fontSize: 10, color: tokens.textTertiary }}>
                    <span style={{ color: '#7b9aff' }}>{sourceEntity?.label || rel.source}</span>
                    <span style={{ margin: '0 4px' }}>{rel.directed ? '→' : '—'}</span>
                    <span style={{ color: '#7b9aff' }}>{targetEntity?.label || rel.target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
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
          flexDirection: 'column',
          height: '100%',
          transition: 'background 0.3s, border-color 0.3s',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: tokens.textDim,
            fontSize: 12,
          }}
        >
          选择实体或关系查看详情
        </div>
        {renderRelationshipManager()}
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
      <div
        style={{
          padding: '8px 14px',
          borderBottom: `1px solid ${tokens.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 11, color: tokens.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
          编辑面板
        </span>
      </div>

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
                  style={inputStyle}
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
                      style={{ width: 80, ...inputStyle }}
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
                      style={{ flex: 1, ...inputStyle }}
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

      {renderRelationshipManager()}
      {renderAnalysisResult()}
    </div>
  );
};

export default EditPanel;
