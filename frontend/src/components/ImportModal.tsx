import React, { useState } from 'react';
import { Modal, Tabs, Upload, Button, Input, message, Alert, Typography, Radio } from 'antd';
import { InboxOutlined, FileTextOutlined } from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';

const { TextArea } = Input;
const { Text } = Typography;
const { Dragger } = Upload;
const { Group: RadioGroup } = Radio;

type ImportMode = 'merge' | 'overwrite';
type ImportType = 'json' | 'csv-entities' | 'csv-relationships' | 'demo';

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

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingImportType, setPendingImportType] = useState<ImportType | null>(null);
  const [pendingData, setPendingData] = useState<string>('');
  const [importMode, setImportMode] = useState<ImportMode>('merge');

  const executeImport = async (type: ImportType, data: string, mode: ImportMode) => {
    const overwrite = mode === 'overwrite';
    switch (type) {
      case 'json':
        await actions.importJSON(data, overwrite);
        message.success('JSON数据导入成功');
        break;
      case 'csv-entities':
        await actions.importCSVEntities(data, overwrite);
        message.success('CSV实体数据导入成功');
        break;
      case 'csv-relationships':
        await actions.importCSVRelationships(data, overwrite);
        message.success('CSV关系数据导入成功');
        break;
      case 'demo':
        await actions.importJSON(data, overwrite);
        message.success('示例数据加载成功');
        break;
    }
    setJsonText('');
    setCsvText('');
    onClose();
  };

  const prepareImport = (type: ImportType, data: string) => {
    const currentHasData = state.entities.length > 0;
    
    if (!currentHasData) {
      executeImport(type, data, 'overwrite');
      return;
    }

    setPendingImportType(type);
    setPendingData(data);
    setImportMode('merge');
    setConfirmVisible(true);
  };

  const handleConfirmImport = async () => {
    if (pendingImportType) {
      await executeImport(pendingImportType, pendingData, importMode);
    }
    setConfirmVisible(false);
    setPendingImportType(null);
    setPendingData('');
  };

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
    prepareImport('json', jsonText);
  };

  const handleImportCSV = async () => {
    if (!csvText.trim()) {
      message.warning('请输入CSV数据');
      return;
    }
    const importType: ImportType = csvType === 'entities' ? 'csv-entities' : 'csv-relationships';
    prepareImport(importType, csvText);
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

  const zhenhuanData = {
    entities: [
      { id: 'zh_1', typeId: 'person', label: '甄嬛', properties: [{ key: '身份', value: '莞嫔/熹贵妃' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_2', typeId: 'person', label: '雍正皇帝', properties: [{ key: '身份', value: '皇帝' }, { key: '派系', value: '皇权' }] },
      { id: 'zh_3', typeId: 'person', label: '皇后', properties: [{ key: '身份', value: '皇后' }, { key: '派系', value: '皇后党' }] },
      { id: 'zh_4', typeId: 'person', label: '华妃', properties: [{ key: '身份', value: '华妃' }, { key: '派系', value: '华妃党' }] },
      { id: 'zh_5', typeId: 'person', label: '沈眉庄', properties: [{ key: '身份', value: '惠贵人' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_6', typeId: 'person', label: '安陵容', properties: [{ key: '身份', value: '鹂妃' }, { key: '派系', value: '皇后党' }] },
      { id: 'zh_7', typeId: 'person', label: '果郡王', properties: [{ key: '身份', value: '果郡王' }, { key: '派系', value: '中立' }] },
      { id: 'zh_8', typeId: 'person', label: '温实初', properties: [{ key: '身份', value: '太医' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_9', typeId: 'person', label: '苏培盛', properties: [{ key: '身份', value: '太监总管' }, { key: '派系', value: '皇帝' }] },
      { id: 'zh_10', typeId: 'person', label: '崔槿汐', properties: [{ key: '身份', value: '掌事宫女' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_11', typeId: 'person', label: '流朱', properties: [{ key: '身份', value: '陪嫁侍女' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_12', typeId: 'person', label: '浣碧', properties: [{ key: '身份', value: '陪嫁侍女' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_13', typeId: 'person', label: '端妃', properties: [{ key: '身份', value: '端妃' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_14', typeId: 'person', label: '敬妃', properties: [{ key: '身份', value: '敬妃' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_15', typeId: 'person', label: '祺嫔', properties: [{ key: '身份', value: '祺嫔' }, { key: '派系', value: '皇后党' }] },
      { id: 'zh_16', typeId: 'person', label: '齐妃', properties: [{ key: '身份', value: '齐妃' }, { key: '派系', value: '皇后党' }] },
      { id: 'zh_17', typeId: 'person', label: '欣贵人', properties: [{ key: '身份', value: '欣贵人' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_18', typeId: 'person', label: '淳常在', properties: [{ key: '身份', value: '淳常在' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_19', typeId: 'person', label: '年羹尧', properties: [{ key: '身份', value: '大将军' }, { key: '派系', value: '华妃党' }] },
      { id: 'zh_20', typeId: 'person', label: '甄远道', properties: [{ key: '身份', value: '吏部侍郎' }, { key: '派系', value: '中立' }] },
      { id: 'zh_21', typeId: 'person', label: '太后', properties: [{ key: '身份', value: '皇太后' }, { key: '派系', value: '皇权' }] },
      { id: 'zh_22', typeId: 'person', label: '玉娆', properties: [{ key: '身份', value: '甄嬛妹妹' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_23', typeId: 'person', label: '摩格', properties: [{ key: '身份', value: '准噶尔可汗' }, { key: '派系', value: '外敌' }] },
      { id: 'zh_24', typeId: 'person', label: '夏冬春', properties: [{ key: '身份', value: '夏常在' }, { key: '派系', value: '中立' }] },
      { id: 'zh_25', typeId: 'person', label: '颂芝', properties: [{ key: '身份', value: '华妃侍女' }, { key: '派系', value: '华妃党' }] },
      { id: 'zh_26', typeId: 'person', label: '宝鹃', properties: [{ key: '身份', value: '安陵容侍女' }, { key: '派系', value: '皇后党' }] },
      { id: 'zh_27', typeId: 'person', label: '剪秋', properties: [{ key: '身份', value: '皇后侍女' }, { key: '派系', value: '皇后党' }] },
      { id: 'zh_28', typeId: 'person', label: '周宁海', properties: [{ key: '身份', value: '翊坤宫首领太监' }, { key: '派系', value: '华妃党' }] },
      { id: 'zh_29', typeId: 'person', label: '小允子', properties: [{ key: '身份', value: '碎玉轩首领太监' }, { key: '派系', value: '甄嬛党' }] },
      { id: 'zh_30', typeId: 'person', label: '康禄海', properties: [{ key: '身份', value: '太监' }, { key: '派系', value: '中立' }] },
    ],
    relationships: [
      { source: 'zh_1', target: 'zh_2', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'zh_3', target: 'zh_2', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'zh_4', target: 'zh_2', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_5', typeId: 'colleague', label: '姐妹', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_6', typeId: 'colleague', label: '姐妹/反目', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_7', typeId: 'associate', label: '情人', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_8', typeId: 'associate', label: '爱慕者', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_10', typeId: 'membership', label: '主仆', directed: true, properties: [] },
      { source: 'zh_1', target: 'zh_11', typeId: 'membership', label: '主仆', directed: true, properties: [] },
      { source: 'zh_1', target: 'zh_12', typeId: 'membership', label: '主仆', directed: true, properties: [] },
      { source: 'zh_3', target: 'zh_6', typeId: 'membership', label: '依附', directed: true, properties: [] },
      { source: 'zh_3', target: 'zh_15', typeId: 'membership', label: '依附', directed: true, properties: [] },
      { source: 'zh_3', target: 'zh_16', typeId: 'membership', label: '依附', directed: true, properties: [] },
      { source: 'zh_4', target: 'zh_19', typeId: 'family', label: '兄妹', directed: false, properties: [] },
      { source: 'zh_4', target: 'zh_25', typeId: 'membership', label: '主仆', directed: true, properties: [] },
      { source: 'zh_1', target: 'zh_13', typeId: 'colleague', label: '同盟', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_14', typeId: 'colleague', label: '同盟', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_17', typeId: 'colleague', label: '同盟', directed: false, properties: [] },
      { source: 'zh_2', target: 'zh_21', typeId: 'family', label: '母子', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_20', typeId: 'family', label: '父女', directed: false, properties: [] },
      { source: 'zh_1', target: 'zh_22', typeId: 'family', label: '姐妹', directed: false, properties: [] },
    ],
  };

  const xiyoujiData = {
    entities: [
      { id: 'xy_1', typeId: 'person', label: '唐僧', properties: [{ key: '身份', value: '取经人' }, { key: '法器', value: '九环锡杖' }] },
      { id: 'xy_2', typeId: 'person', label: '孙悟空', properties: [{ key: '身份', value: '齐天大圣' }, { key: '法器', value: '金箍棒' }] },
      { id: 'xy_3', typeId: 'person', label: '猪八戒', properties: [{ key: '身份', value: '天蓬元帅' }, { key: '法器', value: '九齿钉耙' }] },
      { id: 'xy_4', typeId: 'person', label: '沙僧', properties: [{ key: '身份', value: '卷帘大将' }, { key: '法器', value: '降妖宝杖' }] },
      { id: 'xy_5', typeId: 'person', label: '白龙马', properties: [{ key: '身份', value: '龙王三太子' }, { key: '形态', value: '白马' }] },
      { id: 'xy_6', typeId: 'person', label: '如来佛祖', properties: [{ key: '身份', value: '佛祖' }, { key: '居所', value: '灵山雷音寺' }] },
      { id: 'xy_7', typeId: 'person', label: '观音菩萨', properties: [{ key: '身份', value: '菩萨' }, { key: '居所', value: '南海普陀山' }] },
      { id: 'xy_8', typeId: 'person', label: '玉皇大帝', properties: [{ key: '身份', value: '天帝' }, { key: '居所', value: '凌霄宝殿' }] },
      { id: 'xy_9', typeId: 'person', label: '王母娘娘', properties: [{ key: '身份', value: '王母' }, { key: '居所', value: '瑶池' }] },
      { id: 'xy_10', typeId: 'person', label: '太上老君', properties: [{ key: '身份', value: '道祖' }, { key: '居所', value: '兜率宫' }] },
      { id: 'xy_11', typeId: 'person', label: '托塔李天王', properties: [{ key: '身份', value: '天庭元帅' }, { key: '法器', value: '玲珑宝塔' }] },
      { id: 'xy_12', typeId: 'person', label: '哪吒', properties: [{ key: '身份', value: '三坛海会大神' }, { key: '法器', value: '风火轮' }] },
      { id: 'xy_13', typeId: 'person', label: '二郎神', properties: [{ key: '身份', value: '昭惠灵显王' }, { key: '法器', value: '三尖两刃刀' }] },
      { id: 'xy_14', typeId: 'person', label: '牛魔王', properties: [{ key: '身份', value: '平天大圣' }, { key: '居所', value: '积雷山摩云洞' }] },
      { id: 'xy_15', typeId: 'person', label: '铁扇公主', properties: [{ key: '身份', value: '罗刹女' }, { key: '法器', value: '芭蕉扇' }] },
      { id: 'xy_16', typeId: 'person', label: '红孩儿', properties: [{ key: '身份', value: '圣婴大王' }, { key: '法术', value: '三昧真火' }] },
      { id: 'xy_17', typeId: 'person', label: '白骨精', properties: [{ key: '身份', value: '白骨夫人' }, { key: '居所', value: '白虎岭' }] },
      { id: 'xy_18', typeId: 'person', label: '金角大王', properties: [{ key: '身份', value: '妖王' }, { key: '居所', value: '平顶山莲花洞' }] },
      { id: 'xy_19', typeId: 'person', label: '银角大王', properties: [{ key: '身份', value: '妖王' }, { key: '居所', value: '平顶山莲花洞' }] },
      { id: 'xy_20', typeId: 'person', label: '狮王', properties: [{ key: '身份', value: '妖王' }, { key: '居所', value: '狮驼岭' }] },
      { id: 'xy_21', typeId: 'person', label: '象王', properties: [{ key: '身份', value: '妖王' }, { key: '居所', value: '狮驼岭' }] },
      { id: 'xy_22', typeId: 'person', label: '大鹏金翅雕', properties: [{ key: '身份', value: '妖王' }, { key: '居所', value: '狮驼岭' }] },
      { id: 'xy_23', typeId: 'person', label: '唐太宗', properties: [{ key: '身份', value: '大唐皇帝' }, { key: '居所', value: '长安' }] },
      { id: 'xy_24', typeId: 'person', label: '魏征', properties: [{ key: '身份', value: '大唐丞相' }, { key: '居所', value: '长安' }] },
      { id: 'xy_25', typeId: 'person', label: '东海龙王', properties: [{ key: '身份', value: '四海龙王' }, { key: '居所', value: '东海龙宫' }] },
      { id: 'xy_26', typeId: 'person', label: '西海龙王', properties: [{ key: '身份', value: '四海龙王' }, { key: '居所', value: '西海龙宫' }] },
      { id: 'xy_27', typeId: 'person', label: '南海龙王', properties: [{ key: '身份', value: '四海龙王' }, { key: '居所', value: '南海龙宫' }] },
      { id: 'xy_28', typeId: 'person', label: '北海龙王', properties: [{ key: '身份', value: '四海龙王' }, { key: '居所', value: '北海龙宫' }] },
      { id: 'xy_29', typeId: 'person', label: '阎罗王', properties: [{ key: '身份', value: '十殿阎王' }, { key: '居所', value: '幽冥地府' }] },
      { id: 'xy_30', typeId: 'person', label: '菩提祖师', properties: [{ key: '身份', value: '祖师' }, { key: '居所', value: '灵台方寸山' }] },
    ],
    relationships: [
      { source: 'xy_1', target: 'xy_2', typeId: 'membership', label: '师徒', directed: true, properties: [] },
      { source: 'xy_1', target: 'xy_3', typeId: 'membership', label: '师徒', directed: true, properties: [] },
      { source: 'xy_1', target: 'xy_4', typeId: 'membership', label: '师徒', directed: true, properties: [] },
      { source: 'xy_1', target: 'xy_5', typeId: 'membership', label: '师徒', directed: true, properties: [] },
      { source: 'xy_2', target: 'xy_30', typeId: 'membership', label: '师徒', directed: true, properties: [] },
      { source: 'xy_2', target: 'xy_6', typeId: 'associate', label: '被降服', directed: true, properties: [] },
      { source: 'xy_2', target: 'xy_7', typeId: 'associate', label: '受教化', directed: true, properties: [] },
      { source: 'xy_7', target: 'xy_6', typeId: 'associate', label: '同属佛门', directed: false, properties: [] },
      { source: 'xy_8', target: 'xy_9', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'xy_8', target: 'xy_10', typeId: 'associate', label: '同属天庭', directed: false, properties: [] },
      { source: 'xy_11', target: 'xy_8', typeId: 'membership', label: '臣属', directed: true, properties: [] },
      { source: 'xy_12', target: 'xy_11', typeId: 'family', label: '父子', directed: false, properties: [] },
      { source: 'xy_2', target: 'xy_14', typeId: 'associate', label: '结义兄弟', directed: false, properties: [] },
      { source: 'xy_14', target: 'xy_15', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'xy_14', target: 'xy_16', typeId: 'family', label: '父子', directed: false, properties: [] },
      { source: 'xy_15', target: 'xy_16', typeId: 'family', label: '母子', directed: false, properties: [] },
      { source: 'xy_18', target: 'xy_19', typeId: 'family', label: '兄弟', directed: false, properties: [] },
      { source: 'xy_20', target: 'xy_21', typeId: 'associate', label: '结义兄弟', directed: false, properties: [] },
      { source: 'xy_21', target: 'xy_22', typeId: 'associate', label: '结义兄弟', directed: false, properties: [] },
      { source: 'xy_1', target: 'xy_23', typeId: 'associate', label: '君臣', directed: true, properties: [] },
      { source: 'xy_25', target: 'xy_26', typeId: 'family', label: '兄弟', directed: false, properties: [] },
      { source: 'xy_2', target: 'xy_29', typeId: 'associate', label: '大闹地府', directed: false, properties: [] },
    ],
  };

  const hongloumengData = {
    entities: [
      { id: 'hl_1', typeId: 'person', label: '贾宝玉', properties: [{ key: '身份', value: '荣国府公子' }, { key: '居所', value: '怡红院' }] },
      { id: 'hl_2', typeId: 'person', label: '林黛玉', properties: [{ key: '身份', value: '贾母外孙女' }, { key: '居所', value: '潇湘馆' }] },
      { id: 'hl_3', typeId: 'person', label: '薛宝钗', properties: [{ key: '身份', value: '薛姨妈之女' }, { key: '居所', value: '蘅芜苑' }] },
      { id: 'hl_4', typeId: 'person', label: '贾母', properties: [{ key: '身份', value: '史老太君' }, { key: '居所', value: '荣国府' }] },
      { id: 'hl_5', typeId: 'person', label: '贾政', properties: [{ key: '身份', value: '荣国府二老爷' }, { key: '官职', value: '员外郎' }] },
      { id: 'hl_6', typeId: 'person', label: '王夫人', properties: [{ key: '身份', value: '贾政夫人' }, { key: '居所', value: '荣国府' }] },
      { id: 'hl_7', typeId: 'person', label: '贾赦', properties: [{ key: '身份', value: '荣国府大老爷' }, { key: '官职', value: '世袭一等将军' }] },
      { id: 'hl_8', typeId: 'person', label: '邢夫人', properties: [{ key: '身份', value: '贾赦夫人' }, { key: '居所', value: '荣国府' }] },
      { id: 'hl_9', typeId: 'person', label: '王熙凤', properties: [{ key: '身份', value: '贾琏夫人' }, { key: '居所', value: '荣国府' }] },
      { id: 'hl_10', typeId: 'person', label: '贾琏', properties: [{ key: '身份', value: '贾赦之子' }, { key: '官职', value: '同知' }] },
      { id: 'hl_11', typeId: 'person', label: '元春', properties: [{ key: '身份', value: '贾政长女' }, { key: '居所', value: '皇宫' }] },
      { id: 'hl_12', typeId: 'person', label: '迎春', properties: [{ key: '身份', value: '贾赦庶女' }, { key: '居所', value: '紫菱洲' }] },
      { id: 'hl_13', typeId: 'person', label: '探春', properties: [{ key: '身份', value: '贾政庶女' }, { key: '居所', value: '秋爽斋' }] },
      { id: 'hl_14', typeId: 'person', label: '惜春', properties: [{ key: '身份', value: '贾珍胞妹' }, { key: '居所', value: '藕香榭' }] },
      { id: 'hl_15', typeId: 'person', label: '史湘云', properties: [{ key: '身份', value: '贾母侄孙女' }, { key: '居所', value: '史府' }] },
      { id: 'hl_16', typeId: 'person', label: '秦可卿', properties: [{ key: '身份', value: '贾蓉夫人' }, { key: '居所', value: '宁国府' }] },
      { id: 'hl_17', typeId: 'person', label: '妙玉', properties: [{ key: '身份', value: '栊翠庵尼姑' }, { key: '居所', value: '栊翠庵' }] },
      { id: 'hl_18', typeId: 'person', label: '李纨', properties: [{ key: '身份', value: '贾珠遗孀' }, { key: '居所', value: '稻香村' }] },
      { id: 'hl_19', typeId: 'person', label: '袭人', properties: [{ key: '身份', value: '宝玉大丫鬟' }, { key: '居所', value: '怡红院' }] },
      { id: 'hl_20', typeId: 'person', label: '晴雯', properties: [{ key: '身份', value: '宝玉丫鬟' }, { key: '居所', value: '怡红院' }] },
      { id: 'hl_21', typeId: 'person', label: '紫鹃', properties: [{ key: '身份', value: '黛玉丫鬟' }, { key: '居所', value: '潇湘馆' }] },
      { id: 'hl_22', typeId: 'person', label: '雪雁', properties: [{ key: '身份', value: '黛玉丫鬟' }, { key: '居所', value: '潇湘馆' }] },
      { id: 'hl_23', typeId: 'person', label: '平儿', properties: [{ key: '身份', value: '王熙凤丫鬟' }, { key: '居所', value: '荣国府' }] },
      { id: 'hl_24', typeId: 'person', label: '鸳鸯', properties: [{ key: '身份', value: '贾母丫鬟' }, { key: '居所', value: '荣国府' }] },
      { id: 'hl_25', typeId: 'person', label: '贾珠', properties: [{ key: '身份', value: '贾政长子' }, { key: '状态', value: '已故' }] },
      { id: 'hl_26', typeId: 'person', label: '贾珍', properties: [{ key: '身份', value: '宁国府当家人' }, { key: '官职', value: '世袭三品' }] },
      { id: 'hl_27', typeId: 'person', label: '尤氏', properties: [{ key: '身份', value: '贾珍夫人' }, { key: '居所', value: '宁国府' }] },
      { id: 'hl_28', typeId: 'person', label: '贾蓉', properties: [{ key: '身份', value: '贾珍之子' }, { key: '官职', value: '龙禁尉' }] },
      { id: 'hl_29', typeId: 'person', label: '薛姨妈', properties: [{ key: '身份', value: '王夫人之妹' }, { key: '居所', value: '荣国府' }] },
      { id: 'hl_30', typeId: 'person', label: '薛蟠', properties: [{ key: '身份', value: '薛姨妈之子' }, { key: '居所', value: '荣国府' }] },
    ],
    relationships: [
      { source: 'hl_1', target: 'hl_5', typeId: 'family', label: '父子', directed: false, properties: [] },
      { source: 'hl_1', target: 'hl_6', typeId: 'family', label: '母子', directed: false, properties: [] },
      { source: 'hl_1', target: 'hl_2', typeId: 'associate', label: '表兄妹/恋人', directed: false, properties: [] },
      { source: 'hl_1', target: 'hl_3', typeId: 'associate', label: '表姐弟/夫妻', directed: false, properties: [] },
      { source: 'hl_5', target: 'hl_6', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'hl_7', target: 'hl_8', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'hl_9', target: 'hl_10', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'hl_1', target: 'hl_11', typeId: 'family', label: '姐弟', directed: false, properties: [] },
      { source: 'hl_1', target: 'hl_12', typeId: 'family', label: '堂兄妹', directed: false, properties: [] },
      { source: 'hl_1', target: 'hl_13', typeId: 'family', label: '兄妹', directed: false, properties: [] },
      { source: 'hl_1', target: 'hl_14', typeId: 'family', label: '堂兄妹', directed: false, properties: [] },
      { source: 'hl_4', target: 'hl_5', typeId: 'family', label: '母子', directed: false, properties: [] },
      { source: 'hl_4', target: 'hl_7', typeId: 'family', label: '母子', directed: false, properties: [] },
      { source: 'hl_2', target: 'hl_4', typeId: 'family', label: '祖孙', directed: false, properties: [] },
      { source: 'hl_15', target: 'hl_4', typeId: 'family', label: '祖孙', directed: false, properties: [] },
      { source: 'hl_26', target: 'hl_27', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'hl_28', target: 'hl_16', typeId: 'family', label: '夫妻', directed: false, properties: [] },
      { source: 'hl_29', target: 'hl_30', typeId: 'family', label: '母子', directed: false, properties: [] },
      { source: 'hl_3', target: 'hl_29', typeId: 'family', label: '母女', directed: false, properties: [] },
      { source: 'hl_1', target: 'hl_19', typeId: 'membership', label: '主仆', directed: true, properties: [] },
      { source: 'hl_2', target: 'hl_21', typeId: 'membership', label: '主仆', directed: true, properties: [] },
      { source: 'hl_9', target: 'hl_23', typeId: 'membership', label: '主仆', directed: true, properties: [] },
    ],
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
                    description="点击下方按钮加载示例数据，帮助你快速了解系统功能。包含经典文学作品人物关系示例。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>通用示例</Text>
                  </div>
                  <Button
                    type="primary"
                    block
                    style={{ marginBottom: 16 }}
                    onClick={() => prepareImport('demo', JSON.stringify(demoData))}
                  >
                    加载示例数据（关系网络分析场景）
                  </Button>
                  <div style={{ marginBottom: 8 }}>
                    <Text strong>经典文学人物关系</Text>
                  </div>
                  <Button
                    block
                    style={{ marginBottom: 8 }}
                    onClick={() => prepareImport('demo', JSON.stringify(zhenhuanData))}
                  >
                    甄嬛传人物关系
                  </Button>
                  <Button
                    block
                    style={{ marginBottom: 8 }}
                    onClick={() => prepareImport('demo', JSON.stringify(xiyoujiData))}
                  >
                    西游记人物关系
                  </Button>
                  <Button
                    block
                    onClick={() => prepareImport('demo', JSON.stringify(hongloumengData))}
                  >
                    红楼梦人物关系
                  </Button>
                </div>
              ),
            },
          ]}
        />
      </Modal>

      <Modal
        title="导入方式选择"
        open={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onOk={handleConfirmImport}
        okText="确认导入"
        cancelText="取消"
      >
        <Alert
          message="当前画布已有数据"
          description={`画布上存在 ${state.entities.length} 个实体和 ${state.relationships.length} 条关系。请选择导入方式：`}
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
        <RadioGroup
          value={importMode}
          onChange={(e) => setImportMode(e.target.value as ImportMode)}
          style={{ width: '100%' }}
        >
          <Radio value="merge" style={{ display: 'block', marginBottom: 12, lineHeight: '1.8' }}>
            <Text strong>合并显示</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              保留原有数据，将新数据添加到画布中，与原有数据同时展示
            </Text>
          </Radio>
          <Radio value="overwrite" style={{ display: 'block', lineHeight: '1.8' }}>
            <Text strong>覆盖显示</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              清除原有数据，仅显示新导入的数据
            </Text>
          </Radio>
        </RadioGroup>
      </Modal>
    </>
  );
};

export default ImportModal;
