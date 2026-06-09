import React from 'react';
import { Modal, Radio, Typography, Space } from 'antd';
import {
  MergeOutlined,
  SwapOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { ImportMode } from '../context/GraphContext';

const { Text, Paragraph } = Typography;

interface ImportModeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (mode: ImportMode) => void;
  currentEntityCount: number;
  currentRelationCount: number;
}

const ImportModeModal: React.FC<ImportModeModalProps> = ({
  visible,
  onClose,
  onConfirm,
  currentEntityCount,
  currentRelationCount,
}) => {
  const [selectedMode, setSelectedMode] = React.useState<ImportMode>('append');

  const handleOk = () => {
    onConfirm(selectedMode);
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      title="导入模式选择"
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="确认"
      cancelText="取消"
      width={520}
      destroyOnClose
    >
      <div style={{ marginBottom: 20 }}>
        <Space align="start" style={{ marginBottom: 16 }}>
          <InfoCircleOutlined style={{ fontSize: 16, color: '#1890ff' }} />
          <div>
            <Text strong>当前画布已有数据</Text>
            <Paragraph style={{ margin: '4px 0 0 0', fontSize: 12, color: '#666' }}>
              实体: {currentEntityCount} 个 &nbsp;|&nbsp; 关系: {currentRelationCount} 条
            </Paragraph>
          </div>
        </Space>
      </div>

      <Radio.Group
        value={selectedMode}
        onChange={(e) => setSelectedMode(e.target.value as ImportMode)}
        style={{ width: '100%' }}
      >
        <Radio
          value="append"
          style={{
            display: 'block',
            marginBottom: 16,
            padding: 16,
            borderRadius: 8,
            border: selectedMode === 'append' ? '2px solid #4f6ef7' : '2px solid #f0f0f0',
            backgroundColor: selectedMode === 'append' ? 'rgba(79, 110, 247, 0.04)' : '#fafafa',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <MergeOutlined
              style={{
                fontSize: 24,
                marginTop: 2,
                color: selectedMode === 'append' ? '#4f6ef7' : '#999',
              }}
            />
            <div>
              <Text strong style={{ fontSize: 14 }}>
                与原图同时显示
              </Text>
              <Paragraph
                style={{
                  margin: '4px 0 0 0',
                  fontSize: 12,
                  color: '#666',
                }}
              >
                新导入的数据将添加到当前画布中，与现有数据同时显示。
                <br />
                <Text type="success">✓ 新关系图会在画布右侧独立区域展示，与原图分开布局</Text>
                <br />
                <Text type="success">✓ 系统自动处理实体ID冲突，确保两个图完全独立</Text>
              </Paragraph>
            </div>
          </div>
        </Radio>

        <Radio
          value="replace"
          style={{
            display: 'block',
            padding: 16,
            borderRadius: 8,
            border: selectedMode === 'replace' ? '2px solid #4f6ef7' : '2px solid #f0f0f0',
            backgroundColor: selectedMode === 'replace' ? 'rgba(79, 110, 247, 0.04)' : '#fafafa',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <SwapOutlined
              style={{
                fontSize: 24,
                marginTop: 2,
                color: selectedMode === 'replace' ? '#4f6ef7' : '#999',
              }}
            />
            <div>
              <Text strong style={{ fontSize: 14 }}>
                只显示新数据
              </Text>
              <Paragraph
                style={{
                  margin: '4px 0 0 0',
                  fontSize: 12,
                  color: '#666',
                }}
              >
                清空当前画布上的所有数据，只显示新导入的数据。
                <br />
                <Text type="danger">警告：此操作将删除现有数据，且无法撤销。</Text>
              </Paragraph>
            </div>
          </div>
        </Radio>
      </Radio.Group>
    </Modal>
  );
};

export default ImportModeModal;
