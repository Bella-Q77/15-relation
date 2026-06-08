import React, { useState } from 'react';
import { Modal, Select, Space, message } from 'antd';
import { useGraph } from '../context/GraphContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const PathAnalysisModal: React.FC<Props> = ({ visible, onClose }) => {
  const { state, dispatch, actions } = useGraph();
  const [source, setSource] = useState<string>('');
  const [target, setTarget] = useState<string>('');

  const handleOk = async () => {
    if (!source || !target) {
      message.warning('请选择起点和终点');
      return;
    }
    if (source === target) {
      message.warning('起点和终点不能相同');
      return;
    }
    const result = await actions.pathAnalysis(source, target);
    if (result && result.paths.length > 0) {
      const allNodeIds = new Set<string>();
      result.paths.forEach((path) => path.forEach((id) => allNodeIds.add(id)));
      dispatch({ type: 'SET_HIGHLIGHT', payload: Array.from(allNodeIds) });

      const highlightEdges: string[] = [];
      result.paths.forEach((path) => {
        for (let i = 0; i < path.length - 1; i++) {
          const rel = state.relationships.find(
            (r) =>
              (r.source === path[i] && r.target === path[i + 1]) ||
              (r.source === path[i + 1] && r.target === path[i]),
          );
          if (rel) highlightEdges.push(rel.id);
        }
      });

      dispatch({
        type: 'SET_ANALYSIS_RESULT',
        payload: { type: 'path', data: { ...result, highlightEdges } },
      });
      message.success(`找到 ${result.paths.length} 条路径`);
    } else {
      message.info('未找到连接路径');
    }
    onClose();
  };

  return (
    <Modal
      title="路径分析"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      okText="开始分析"
      cancelText="取消"
      destroyOnClose
    >
      <div style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 6, fontWeight: 500 }}>起点实体</div>
        <Select
          style={{ width: '100%' }}
          placeholder="选择起点"
          value={source || undefined}
          onChange={setSource}
          showSearch
          optionFilterProp="children"
        >
          {state.entities.map((e) => {
            const t = state.entityTypes.find((et) => et.id === e.typeId);
            return (
              <Select.Option key={e.id} value={e.id}>
                <Space>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: t?.color || '#999',
                    }}
                  />
                  {e.label}
                </Space>
              </Select.Option>
            );
          })}
        </Select>
      </div>
      <div>
        <div style={{ marginBottom: 6, fontWeight: 500 }}>终点实体</div>
        <Select
          style={{ width: '100%' }}
          placeholder="选择终点"
          value={target || undefined}
          onChange={setTarget}
          showSearch
          optionFilterProp="children"
        >
          {state.entities.map((e) => {
            const t = state.entityTypes.find((et) => et.id === e.typeId);
            return (
              <Select.Option key={e.id} value={e.id}>
                <Space>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: t?.color || '#999',
                    }}
                  />
                  {e.label}
                </Space>
              </Select.Option>
            );
          })}
        </Select>
      </div>
    </Modal>
  );
};

export default PathAnalysisModal;
