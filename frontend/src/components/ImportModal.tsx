import React, { useState, useCallback } from 'react';
import { Modal, Tabs, Upload, Button, Input, message, Alert, Typography } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import { useGraph, ImportMode } from '../context/GraphContext';
import ImportModeModal from './ImportModeModal';

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;

type PendingImport =
  | { type: 'json'; data: string }
  | { type: 'csv-entities'; data: string }
  | { type: 'csv-relationships'; data: string };

interface ImportModalProps {
  visible: boolean;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ visible, onClose }) => {
  const { state, actions } = useGraph();
  const [activeTab, setActiveTab] = useState('json');
  const [jsonText, setJsonText] = useState('');
  const [csvText, setCsvText] = useState('');
  const [csvType, setCsvType] = useState<'entities' | 'relationships'>('entities');

  const [importModeModalVisible, setImportModeModalVisible] = useState(false);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);

  const hasExistingData = state.entities.length > 0;

  const executeImport = useCallback(
    async (importData: PendingImport, mode: ImportMode) => {
      try {
        if (importData.type === 'json') {
          await actions.importJSON(importData.data, mode);
          message.success('JSON数据导入成功');
        } else if (importData.type === 'csv-entities') {
          await actions.importCSVEntities(importData.data, mode);
          message.success('CSV实体数据导入成功');
        } else if (importData.type === 'csv-relationships') {
          await actions.importCSVRelationships(importData.data, mode);
          message.success('CSV关系数据导入成功');
        }

        setJsonText('');
        setCsvText('');
        onClose();
      } catch (e) {
        console.error('导入失败:', e);
        message.error('导入失败，请检查数据格式');
      }
    },
    [actions, onClose]
  );

  const handleImportWithModeCheck = useCallback(
    async (importData: PendingImport) => {
      if (hasExistingData) {
        setPendingImport(importData);
        setImportModeModalVisible(true);
      } else {
        await executeImport(importData, 'append');
      }
    },
    [hasExistingData, executeImport]
  );

  const handleImportModeConfirm = useCallback(
    async (mode: ImportMode) => {
      if (pendingImport) {
        await executeImport(pendingImport, mode);
      }
      setPendingImport(null);
    },
    [pendingImport, executeImport]
  );

  const handleImportJSON = async () => {
    if (!jsonText.trim()) {
      message.warning('请输入JSON数据');
      return;
    }
    try {
      JSON.parse(jsonText);
    } catch {
      message.error('JSON格式不正确');
      return;
    }
    await handleImportWithModeCheck({ type: 'json', data: jsonText });
  };

  const handleImportCSV = async () => {
    if (!csvText.trim()) {
      message.warning('请输入CSV数据');
      return;
    }
    if (csvType === 'entities') {
      await handleImportWithModeCheck({ type: 'csv-entities', data: csvText });
    } else {
      await handleImportWithModeCheck({ type: 'csv-relationships', data: csvText });
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (file.name.endsWith('.json')) {
        setJsonText(text);
        setActiveTab('json');
      } else if (file.name.endsWith('.csv')) {
        setCsvText(text);
        setActiveTab('csv');
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleImportFromFile = async () => {
    const backend = window?.go?.main?.App;
    if (!backend) {
      message.info('文件导入功能仅在桌面应用中可用');
      return;
    }
    const path = await backend.OpenFileDialog('选择数据文件', [
      { DisplayName: 'JSON Files', Pattern: '*.json' },
      { DisplayName: 'CSV Files', Pattern: '*.csv' },
    ]);
    if (!path) return;
    const content = await backend.ReadFile(path);
    if (!content) {
      message.error('读取文件失败');
      return;
    }
    if (path.endsWith('.json')) {
      setJsonText(content);
      setActiveTab('json');
    } else if (path.endsWith('.csv')) {
      setCsvText(content);
      setActiveTab('csv');
    }
    message.info('文件已加载，请确认后点击导入');
  };

  return (
    <>
      <Modal
        title="导入数据"
        open={visible}
        onCancel={onClose}
        width={640}
        footer={null}
        destroyOnClose
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'json',
              label: 'JSON 导入',
              children: (
                <div>
                  <Alert
                    message="JSON 数据格式"
                    description={
                      <pre style={{ fontSize: 11, margin: 0 }}>
{`{
  "entities": [
    { "id": "1", "typeId": "person", "label": "张三", 
      "properties": [{"key": "年龄", "value": "30"}] }
  ],
  "relationships": [
    { "source": "1", "target": "2", "typeId": "associate", 
      "label": "同事", "directed": false }
  ]
}`}
                      </pre>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <TextArea
                    rows={10}
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    placeholder="粘贴JSON数据..."
                  />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button onClick={handleImportFromFile}>从文件加载</Button>
                    <Button type="primary" onClick={handleImportJSON}>
                      导入
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              key: 'csv',
              label: 'CSV 导入',
              children: (
                <div>
                  <Alert
                    message="CSV 数据格式"
                    description={
                      <div>
                        <Text strong>实体CSV:</Text>
                        <pre style={{ fontSize: 11, margin: '4px 0' }}>
                          {`label,type,年龄,职业\n张三,person,30,工程师\n李四,person,25,设计师`}
                        </pre>
                        <Text strong>关系CSV:</Text>
                        <pre style={{ fontSize: 11, margin: '4px 0' }}>
                          {`source,target,type,label\n张三ID,李四ID,colleague,同事`}
                        </pre>
                      </div>
                    }
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <div style={{ marginBottom: 8 }}>
                    <Button.Group>
                      <Button
                        type={csvType === 'entities' ? 'primary' : 'default'}
                        onClick={() => setCsvType('entities')}
                      >
                        实体数据
                      </Button>
                      <Button
                        type={csvType === 'relationships' ? 'primary' : 'default'}
                        onClick={() => setCsvType('relationships')}
                      >
                        关系数据
                      </Button>
                    </Button.Group>
                  </div>
                  <TextArea
                    rows={10}
                    value={csvText}
                    onChange={(e) => setCsvText(e.target.value)}
                    placeholder="粘贴CSV数据..."
                  />
                  <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <Button onClick={handleImportFromFile}>从文件加载</Button>
                    <Button type="primary" onClick={handleImportCSV}>
                      导入
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              key: 'demo',
              label: '示例数据',
              children: (
                <div>
                  <Alert
                    message="加载示例数据"
                    description="点击下方按钮加载一组示例数据，帮助你快速了解系统功能。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 12 }}
                  />
                  <Button
                    type="primary"
                    block
                    onClick={async () => {
                      const demoData = {
                        entities: [
                          { id: 'p1', typeId: 'person', label: '张三', properties: [{ key: '年龄', value: '35' }, { key: '职业', value: '企业主' }] },
                          { id: 'p2', typeId: 'person', label: '李四', properties: [{ key: '年龄', value: '42' }, { key: '职业', value: '财务总监' }] },
                          { id: 'p3', typeId: 'person', label: '王五', properties: [{ key: '年龄', value: '28' }, { key: '职业', value: '销售经理' }] },
                          { id: 'p4', typeId: 'person', label: '赵六', properties: [{ key: '年龄', value: '31' }] },
                          { id: 'p5', typeId: 'person', label: '钱七', properties: [{ key: '年龄', value: '55' }] },
                          { id: 'p6', typeId: 'person', label: '孙八', properties: [] },
                          { id: 'o1', typeId: 'organization', label: '明达科技有限公司', properties: [{ key: '注册资本', value: '5000万' }] },
                          { id: 'o2', typeId: 'organization', label: '恒通贸易公司', properties: [{ key: '注册资本', value: '2000万' }] },
                          { id: 'o3', typeId: 'organization', label: '信达投资', properties: [] },
                          { id: 'e1', typeId: 'event', label: '2024年资金转移事件', properties: [{ key: '时间', value: '2024-03-15' }, { key: '金额', value: '500万' }] },
                          { id: 'l1', typeId: 'location', label: '北京市朝阳区', properties: [] },
                          { id: 'l2', typeId: 'location', label: '上海市浦东新区', properties: [] },
                          { id: 'ph1', typeId: 'phone', label: '138****1234', properties: [] },
                          { id: 'ph2', typeId: 'phone', label: '139****5678', properties: [] },
                          { id: 'a1', typeId: 'account', label: '工商银行****8901', properties: [{ key: '开户行', value: '工商银行北京分行' }] },
                          { id: 'a2', typeId: 'account', label: '建设银行****2345', properties: [] },
                          { id: 'v1', typeId: 'vehicle', label: '京A·12345', properties: [{ key: '车型', value: '奔驰S600' }] },
                        ],
                        relationships: [
                          { source: 'p1', target: 'o1', typeId: 'ownership', label: '法人代表', directed: true, properties: [] },
                          { source: 'p2', target: 'o1', typeId: 'membership', label: '财务总监', directed: true, properties: [] },
                          { source: 'p3', target: 'o2', typeId: 'membership', label: '销售经理', directed: true, properties: [] },
                          { source: 'p1', target: 'p2', typeId: 'colleague', label: '同事', directed: false, properties: [] },
                          { source: 'p1', target: 'p4', typeId: 'family', label: '兄弟', directed: false, properties: [] },
                          { source: 'p2', target: 'p3', typeId: 'associate', label: '认识', directed: false, properties: [] },
                          { source: 'p4', target: 'p5', typeId: 'associate', label: '合作伙伴', directed: false, properties: [] },
                          { source: 'p5', target: 'o3', typeId: 'ownership', label: '实际控制人', directed: true, properties: [] },
                          { source: 'o1', target: 'o2', typeId: 'transaction', label: '业务往来', directed: true, properties: [{ key: '金额', value: '200万' }] },
                          { source: 'o1', target: 'o3', typeId: 'transaction', label: '投资', directed: true, properties: [{ key: '金额', value: '1000万' }] },
                          { source: 'p1', target: 'e1', typeId: 'associate', label: '参与', directed: true, properties: [] },
                          { source: 'o1', target: 'e1', typeId: 'associate', label: '涉及', directed: true, properties: [] },
                          { source: 'p1', target: 'l1', typeId: 'travel', label: '居住地', directed: true, properties: [] },
                          { source: 'o1', target: 'l1', typeId: 'associate', label: '注册地', directed: true, properties: [] },
                          { source: 'p3', target: 'l2', typeId: 'travel', label: '居住地', directed: true, properties: [] },
                          { source: 'o2', target: 'l2', typeId: 'associate', label: '注册地', directed: true, properties: [] },
                          { source: 'p1', target: 'ph1', typeId: 'communication', label: '使用', directed: true, properties: [] },
                          { source: 'p2', target: 'ph2', typeId: 'communication', label: '使用', directed: true, properties: [] },
                          { source: 'ph1', target: 'ph2', typeId: 'communication', label: '通话记录', directed: false, properties: [{ key: '频次', value: '23次/月' }] },
                          { source: 'p1', target: 'a1', typeId: 'ownership', label: '持有', directed: true, properties: [] },
                          { source: 'a1', target: 'a2', typeId: 'transaction', label: '转账', directed: true, properties: [{ key: '金额', value: '500万' }, { key: '时间', value: '2024-03-15' }] },
                          { source: 'p2', target: 'a2', typeId: 'ownership', label: '持有', directed: true, properties: [] },
                          { source: 'p1', target: 'v1', typeId: 'ownership', label: '车主', directed: true, properties: [] },
                          { source: 'p5', target: 'p6', typeId: 'family', label: '父子', directed: true, properties: [] },
                          { source: 'p6', target: 'o2', typeId: 'membership', label: '员工', directed: true, properties: [] },
                        ],
                      };
                      await handleImportWithModeCheck({ type: 'json', data: JSON.stringify(demoData) });
                    }}
                  >
                    加载示例数据（关系网络分析场景）
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Modal>

      <ImportModeModal
        visible={importModeModalVisible}
        onClose={() => {
          setImportModeModalVisible(false);
          setPendingImport(null);
        }}
        onConfirm={handleImportModeConfirm}
        currentEntityCount={state.entities.length}
        currentRelationCount={state.relationships.length}
      />
    </>
  );
};

export default ImportModal;
