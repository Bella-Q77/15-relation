import React, { useState, useEffect, useCallback } from 'react';
import { Drawer, Timeline, Tag, Button, Empty, Popconfirm, Tooltip, Space, Badge } from 'antd';
import {
  PlusCircleOutlined,
  EditOutlined,
  DeleteOutlined,
  ImportOutlined,
  ClearOutlined,
  CloudSyncOutlined,
  NodeIndexOutlined,
  ApiOutlined,
  DatabaseOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';
import type { HistoryEntry, NeuroDBStatus } from '../types/graph';

const ACTION_ICON: Record<string, React.ReactNode> = {
  add_entity: <PlusCircleOutlined style={{ color: '#52c41a' }} />,
  update_entity: <EditOutlined style={{ color: '#1890ff' }} />,
  delete_entity: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
  add_relationship: <NodeIndexOutlined style={{ color: '#52c41a' }} />,
  update_relationship: <EditOutlined style={{ color: '#1890ff' }} />,
  delete_relationship: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
  import_data: <ImportOutlined style={{ color: '#722ed1' }} />,
  clear_data: <ClearOutlined style={{ color: '#ff4d4f' }} />,
  add_entity_type: <PlusCircleOutlined style={{ color: '#13c2c2' }} />,
  add_relation_type: <PlusCircleOutlined style={{ color: '#13c2c2' }} />,
  neurodb_sync: <CloudSyncOutlined style={{ color: '#1890ff' }} />,
  neurodb_load: <DatabaseOutlined style={{ color: '#1890ff' }} />,
};

const ACTION_COLOR: Record<string, string> = {
  add_entity: 'green',
  update_entity: 'blue',
  delete_entity: 'red',
  add_relationship: 'green',
  update_relationship: 'blue',
  delete_relationship: 'red',
  import_data: 'purple',
  clear_data: 'red',
  add_entity_type: 'cyan',
  add_relation_type: 'cyan',
  neurodb_sync: 'blue',
  neurodb_load: 'blue',
};

const ACTION_LABEL: Record<string, string> = {
  add_entity: '添加实体',
  update_entity: '更新实体',
  delete_entity: '删除实体',
  add_relationship: '添加关系',
  update_relationship: '更新关系',
  delete_relationship: '删除关系',
  import_data: '导入数据',
  clear_data: '清空数据',
  add_entity_type: '添加类型',
  add_relation_type: '添加类型',
  neurodb_sync: 'NeuroDB同步',
  neurodb_load: 'NeuroDB加载',
};

interface HistoryDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function HistoryDrawer({ open, onClose }: HistoryDrawerProps) {
  const { actions } = useGraph();
  const { tokens } = useTheme();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [neuroStatus, setNeuroStatus] = useState<NeuroDBStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [history, status] = await Promise.all([
      actions.getHistory(),
      actions.getNeuroDBStatus(),
    ]);
    setEntries(history || []);
    setNeuroStatus(status);
    setLoading(false);
  }, [actions]);

  useEffect(() => {
    if (open) refresh();
  }, [open, refresh]);

  const handleClearHistory = useCallback(async () => {
    await actions.clearHistory();
    setEntries([]);
  }, [actions]);

  return (
    <Drawer
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <DatabaseOutlined />
          <span>历史记录 &amp; NeuroDB</span>
        </div>
      }
      placement="right"
      width={420}
      open={open}
      onClose={onClose}
      styles={{
        header: { background: tokens.bgPanel, borderBottom: `1px solid ${tokens.border}` },
        body: { background: tokens.bg, padding: '16px' },
      }}
      extra={
        <Space>
          <Tooltip title="刷新">
            <Button
              type="text"
              icon={<ReloadOutlined spin={loading} />}
              onClick={refresh}
              size="small"
            />
          </Tooltip>
        </Space>
      }
    >
      {/* NeuroDB Status */}
      <div
        style={{
          background: tokens.bgCard,
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 16,
          border: `1px solid ${tokens.border}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ApiOutlined style={{ fontSize: 16, color: tokens.primary }} />
          <span style={{ fontWeight: 600, color: tokens.text }}>NeuroDB 嵌入式引擎</span>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <Badge
            status={neuroStatus?.embedded ? 'processing' : 'default'}
            text={
              <span style={{ fontSize: 12, color: tokens.textSecondary }}>
                进程: {neuroStatus?.embedded ? '运行中' : '未启动'}
              </span>
            }
          />
          <Badge
            status={neuroStatus?.connected ? 'success' : 'error'}
            text={
              <span style={{ fontSize: 12, color: tokens.textSecondary }}>
                连接: {neuroStatus?.connected ? '已连接' : '未连接'}
              </span>
            }
          />
        </div>

        <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 8, lineHeight: '18px' }}>
          {neuroStatus?.binaryPath ? (
            <>端口: {neuroStatus.port}{neuroStatus.nodeCount > 0 && ` · ${neuroStatus.nodeCount} 节点`}</>
          ) : (
            <>
              未检测到 NEURO_SERVER 二进制文件
              <br />
              请放置到: <code style={{ fontSize: 10, background: tokens.bgInput, padding: '1px 4px', borderRadius: 3 }}>{neuroStatus?.installDir || '~/.relationship-analyzer/neurodb/bin/'}</code>
            </>
          )}
        </div>

        <Space size={4}>
          {!neuroStatus?.embedded ? (
            <Button
              size="small"
              type="primary"
              icon={<DatabaseOutlined />}
              onClick={async () => {
                const res = await actions.startNeuroDB();
                if (res === 'OK') refresh();
              }}
              disabled={!neuroStatus?.binaryPath}
            >
              启动
            </Button>
          ) : (
            <Button
              size="small"
              danger
              icon={<DatabaseOutlined />}
              onClick={async () => {
                await actions.stopNeuroDB();
                refresh();
              }}
            >
              停止
            </Button>
          )}
          <Button
            size="small"
            icon={<CloudSyncOutlined />}
            onClick={async () => {
              const res = await actions.syncToNeuroDB();
              if (res === 'OK') refresh();
            }}
            disabled={!neuroStatus?.connected}
          >
            同步
          </Button>
        </Space>
      </div>

      {/* History */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontWeight: 600, color: tokens.text }}>
          修改记录 ({entries.length})
        </span>
        {entries.length > 0 && (
          <Popconfirm title="确认清除所有历史记录？" onConfirm={handleClearHistory} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger>
              清除
            </Button>
          </Popconfirm>
        )}
      </div>

      {entries.length === 0 ? (
        <Empty description="暂无修改记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Timeline
          style={{ paddingTop: 4 }}
          items={entries.map((entry) => ({
            dot: ACTION_ICON[entry.action] || <EditOutlined />,
            children: (
              <div style={{ paddingBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Tag color={ACTION_COLOR[entry.action] || 'default'} style={{ margin: 0 }}>
                    {ACTION_LABEL[entry.action] || entry.action}
                  </Tag>
                  {entry.targetLabel && (
                    <span
                      style={{
                        fontSize: 13,
                        color: tokens.text,
                        fontWeight: 500,
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {entry.targetLabel}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: tokens.textMuted,
                    marginTop: 2,
                    lineHeight: '16px',
                  }}
                >
                  {entry.timestamp}
                </div>
              </div>
            ),
          }))}
        />
      )}
    </Drawer>
  );
}
