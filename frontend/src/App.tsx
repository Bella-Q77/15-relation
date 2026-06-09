import React, { useState, useEffect, useCallback } from 'react';
import { ConfigProvider, message, Modal, theme as antdTheme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { GraphProvider, useGraph } from './context/GraphContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import type { ThemeMode } from './context/ThemeContext';
import Sidebar from './components/Sidebar';
import GraphCanvas from './components/GraphCanvas';
import SearchOverlay from './components/SearchOverlay';
import CanvasToolbar from './components/CanvasToolbar';
import PropertyPanel from './components/PropertyPanel';
import StatusBar from './components/StatusBar';
import AddEntityModal from './components/AddEntityModal';
import AddEdgeModal from './components/AddEdgeModal';
import ImportModal from './components/ImportModal';
import PathAnalysisModal from './components/PathAnalysisModal';
import HistoryDrawer from './components/HistoryDrawer';
import '@antv/graphin/dist/index.css';
import '@antv/graphin-components/dist/index.css';
import './App.css';

function generateDemoData() {
  const seed = (s: number) => {
    let v = s;
    return () => { v = (v * 16807 + 0) % 2147483647; return (v - 1) / 2147483646; };
  };
  const rng = seed(42);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const randInt = (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min;

  const surnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏窦章苏潘葛奚范彭鲁韦昌马苗凤花方任袁柳唐罗薛雷贺倪汤滕殷罗毕郝邬安常于时傅皮齐康伍余元顾孟黄穆萧尹姚邵'.split('');
  const givenParts = '伟芳敏静丽强磊洋勇艳杰娟涛明超秀霞平刚桂英华建国文辉力志永健世广义兴良海山仁波宁贵福生龙元全胜学祥才发武新利清飞彬富顺信子杰涵'.split('');
  const orgPre = ['华', '中', '恒', '信', '明', '博', '盛', '远', '新', '瑞', '金', '天', '国', '龙', '鑫', '源', '泰', '德', '安', '宏'];
  const orgMid = ['达', '通', '丰', '隆', '创', '联', '合', '诚', '宇', '泽', '锐', '昌', '正', '翔', '凯', '辉', '利', '益', '科', '邦'];
  const orgSuf = ['科技', '贸易', '投资', '实业', '集团', '传媒', '咨询', '物流', '地产', '能源', '制药', '环保', '电子', '网络', '材料'];
  const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '天津', '苏州', '西安', '长沙', '青岛', '大连', '厦门', '合肥', '济南', '福州', '昆明', '哈尔滨', '沈阳', '郑州', '长春', '东莞', '无锡', '宁波', '佛山', '温州', '贵阳'];
  const districts = ['朝阳区', '海淀区', '浦东新区', '天河区', '南山区', '江干区', '武侯区', '洪山区', '鼓楼区', '渝北区', '和平区', '高新区', '岳麓区', '市南区', '中山区', '思明区', '蜀山区', '历下区', '台江区', '盘龙区'];
  const banks = ['工商银行', '建设银行', '农业银行', '中国银行', '交通银行', '招商银行', '中信银行', '浦发银行', '民生银行', '光大银行'];
  const platePre = ['京', '沪', '粤', '浙', '苏', '川', '鄂', '湘', '鲁', '豫', '闽', '赣', '皖', '渝', '冀'];
  const eventTypes = ['资金转移', '合同签署', '股权变更', '诉讼案件', '行政处罚', '商业谈判', '并购交易', '项目投标', '信息泄露', '担保纠纷'];

  const entities: any[] = [];
  const relationships: any[] = [];
  const relSet = new Set<string>();
  const addRel = (s: string, t: string, typeId: string, label: string, dir: boolean, props: any[] = []) => {
    const key = s < t ? `${s}|${t}` : `${t}|${s}`;
    if (relSet.has(key) || s === t) return;
    relSet.add(key);
    relationships.push({ source: s, target: t, typeId, label, directed: dir, properties: props });
  };

  const personIds: string[] = [];
  for (let i = 1; i <= 25; i++) {
    const id = `p${i}`;
    personIds.push(id);
    const name = pick(surnames) + pick(givenParts) + (rng() > 0.5 ? pick(givenParts) : '');
    entities.push({ id, typeId: 'person', label: name, properties: [{ key: '年龄', value: `${randInt(22, 65)}` }] });
  }

  const orgIds: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const id = `o${i}`;
    orgIds.push(id);
    entities.push({ id, typeId: 'organization', label: `${pick(orgPre)}${pick(orgMid)}${pick(orgSuf)}有限公司`, properties: [{ key: '注册资本', value: `${randInt(100, 9000)}万` }] });
  }

  const eventIds: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const id = `ev${i}`;
    eventIds.push(id);
    const y = randInt(2020, 2025);
    const m = String(randInt(1, 12)).padStart(2, '0');
    entities.push({ id, typeId: 'event', label: `${y}年${pick(eventTypes)}事件`, properties: [{ key: '时间', value: `${y}-${m}-${String(randInt(1, 28)).padStart(2, '0')}` }] });
  }

  const locIds: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const id = `l${i}`;
    locIds.push(id);
    entities.push({ id, typeId: 'location', label: `${pick(cities)}${pick(districts)}`, properties: [] });
  }

  const phoneIds: string[] = [];
  for (let i = 1; i <= 16; i++) {
    const id = `ph${i}`;
    phoneIds.push(id);
    const pre = pick(['130', '131', '132', '133', '135', '136', '137', '138', '139', '150', '151', '152', '153', '155', '156', '157', '158', '159', '186', '187', '188', '189']);
    entities.push({ id, typeId: 'phone', label: `${pre}****${String(randInt(1000, 9999))}`, properties: [] });
  }

  const accIds: string[] = [];
  for (let i = 1; i <= 13; i++) {
    const id = `a${i}`;
    accIds.push(id);
    entities.push({ id, typeId: 'account', label: `${pick(banks)}****${String(randInt(1000, 9999))}`, properties: [] });
  }

  const vehIds: string[] = [];
  for (let i = 1; i <= 8; i++) {
    const id = `v${i}`;
    vehIds.push(id);
    const letter = String.fromCharCode(65 + randInt(0, 25));
    entities.push({ id, typeId: 'vehicle', label: `${pick(platePre)}${letter}·${String(randInt(10000, 99999))}`, properties: [] });
  }

  const docIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const id = `d${i}`;
    docIds.push(id);
    entities.push({ id, typeId: 'document', label: `文件-${String(randInt(100000, 999999))}`, properties: [] });
  }

  orgIds.forEach((oid) => {
    const owner = pick(personIds);
    addRel(owner, oid, 'ownership', '法人代表', true);
    const mc = randInt(1, 2);
    for (let j = 0; j < mc; j++) addRel(pick(personIds), oid, 'membership', pick(['员工', '经理', '总监', '顾问']), true);
    addRel(oid, pick(locIds), 'associate', '注册地', true);
  });

  for (let i = 0; i < 12; i++) addRel(pick(personIds), pick(personIds), pick(['colleague', 'associate', 'family']), pick(['同事', '认识', '朋友', '亲属', '合作']), false);

  for (let i = 0; i < 8; i++) addRel(pick(orgIds), pick(orgIds), 'transaction', pick(['业务往来', '投资', '采购', '合作']), true, [{ key: '金额', value: `${randInt(50, 5000)}万` }]);

  personIds.forEach((pid) => { if (rng() > 0.3) addRel(pid, pick(phoneIds), 'communication', '使用', true); });
  for (let i = 0; i < 20; i++) addRel(pick(phoneIds), pick(phoneIds), 'communication', '通话记录', false, [{ key: '频次', value: `${randInt(1, 50)}次/月` }]);

  for (let i = 0; i < 18; i++) addRel(pick(personIds), pick(accIds), 'ownership', '持有', true);
  for (let i = 0; i < 15; i++) addRel(pick(accIds), pick(accIds), 'transaction', '转账', true, [{ key: '金额', value: `${randInt(1, 3000)}万` }]);

  for (let i = 0; i < 8; i++) addRel(pick(personIds), pick(vehIds), 'ownership', '车主', true);
  for (let i = 0; i < 10; i++) addRel(pick(personIds), pick(locIds), 'travel', pick(['居住地', '出差', '出行']), true);

  eventIds.forEach((eid) => {
    const pc = randInt(1, 2);
    for (let j = 0; j < pc; j++) addRel(pick(personIds), eid, 'associate', '参与', true);
    if (rng() > 0.4) addRel(pick(orgIds), eid, 'associate', '涉及', true);
  });

  for (let i = 0; i < 6; i++) addRel(pick(personIds), pick(docIds), 'associate', pick(['签署', '持有', '提交']), true);
  for (let i = 0; i < 3; i++) addRel(pick(orgIds), pick(docIds), 'associate', pick(['备案', '签发', '存档']), true);

  return { entities, relationships };
}

const DEMO_DATA = generateDemoData();

function AppInner() {
  const { state, dispatch, actions } = useGraph();
  const { tokens, setMode } = useTheme();
  const [addEntityVisible, setAddEntityVisible] = useState(false);
  const [addEdgeVisible, setAddEdgeVisible] = useState(false);
  const [importVisible, setImportVisible] = useState(false);
  const [pathModalVisible, setPathModalVisible] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showPanel, setShowPanel] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);

  const handleExport = useCallback(async () => {
    const json = await actions.exportJSON();
    if (!json) return;
    const backend = window?.go?.main?.App;
    if (backend) {
      const path = await backend.SaveFileDialog('导出图数据', 'graph_data.json', [
        { DisplayName: 'JSON Files', Pattern: '*.json' },
      ]);
      if (path) {
        await backend.WriteFile(path, json);
        message.success('数据已导出');
      }
    } else {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'graph_data.json';
      a.click();
      URL.revokeObjectURL(url);
      message.success('数据已导出');
    }
  }, [actions]);

  const handleDeleteSelected = useCallback(async () => {
    if (state.selectedNodeId) {
      Modal.confirm({
        title: '确认删除',
        content: '删除该实体将同时删除与之相关的所有关系，确认删除？',
        onOk: async () => {
          await actions.deleteEntity(state.selectedNodeId!);
          message.success('实体已删除');
        },
      });
    } else if (state.selectedEdgeId) {
      await actions.deleteRelationship(state.selectedEdgeId);
      message.success('关系已删除');
    }
  }, [state.selectedNodeId, state.selectedEdgeId, actions]);

  const handleLinkAnalysis = useCallback(
    async (depth: number) => {
      if (!state.selectedNodeId) {
        message.info('请先在画布中选择一个实体节点');
        return;
      }
      const result = await actions.linkAnalysis(state.selectedNodeId, depth);
      if (result) {
        const ids = result.entities.map((e) => e.id);
        dispatch({ type: 'SET_HIGHLIGHT', payload: ids });
        dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { type: 'link', data: result } });
        message.success(`找到 ${result.entities.length} 个关联实体`);
      }
    },
    [state.selectedNodeId, actions, dispatch],
  );

  const handleClusterAnalysis = useCallback(async () => {
    if (state.entities.length === 0) {
      message.info('暂无数据');
      return;
    }
    const result = await actions.clusterAnalysis();
    if (result) {
      const clusterCount = new Set(Object.values(result.clusters)).size;
      dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { type: 'cluster', data: result } });
      dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
      message.success(`识别出 ${clusterCount} 个群集`);
    }
  }, [state.entities, actions, dispatch]);

  const handleSNAAnalysis = useCallback(async () => {
    if (state.entities.length === 0) {
      message.info('暂无数据');
      return;
    }
    const result = await actions.snaAnalysis();
    if (result) {
      dispatch({ type: 'SET_ANALYSIS_RESULT', payload: { type: 'sna', data: result } });
      dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
      message.success('社会网络分析完成');
    }
  }, [state.entities, actions, dispatch]);

  useEffect(() => {
    const runtime = (window as any).runtime;
    if (!runtime?.EventsOn) return;

    const unsubs: (() => void)[] = [];
    const on = (event: string, fn: (...args: any[]) => void) => {
      runtime.EventsOn(event, fn);
      unsubs.push(() => runtime.EventsOff(event));
    };

    on('menu:import', () => setImportVisible(true));
    on('menu:export', () => handleExport());
    on('menu:load-demo', async () => {
      await actions.importJSON(JSON.stringify(DEMO_DATA));
      message.success('示例数据加载成功');
    });
    on('menu:clear-all', () => {
      Modal.confirm({
        title: '清空所有数据',
        content: '此操作将清除所有实体和关系数据，是否继续？',
        okText: '确认清空',
        okType: 'danger',
        onOk: async () => {
          await actions.clearData();
          message.success('数据已清空');
        },
      });
    });
    on('menu:add-entity', () => setAddEntityVisible(true));
    on('menu:add-relationship', () => setAddEdgeVisible(true));
    on('menu:delete-selected', () => handleDeleteSelected());
    on('menu:layout', (layoutType: string) => {
      dispatch({ type: 'SET_LAYOUT', payload: layoutType as any });
      message.success('布局已切换');
    });
    on('menu:link-analysis', (depth: number) => handleLinkAnalysis(depth));
    on('menu:path-analysis', () => setPathModalVisible(true));
    on('menu:cluster-analysis', () => handleClusterAnalysis());
    on('menu:sna-analysis', () => handleSNAAnalysis());
    on('menu:clear-analysis', () => {
      dispatch({ type: 'SET_HIGHLIGHT', payload: [] });
      dispatch({ type: 'SET_ANALYSIS_RESULT', payload: null });
      message.success('分析结果已清除');
    });
    on('menu:fit-view', () => {
      runtime.EventsEmit('graph:fit-view');
    });
    on('menu:zoom-in', () => {
      runtime.EventsEmit('graph:zoom-in');
    });
    on('menu:zoom-out', () => {
      runtime.EventsEmit('graph:zoom-out');
    });
    on('menu:toggle-sidebar', () => setShowSidebar((v) => !v));
    on('menu:toggle-panel', () => setShowPanel((v) => !v));
    on('menu:toggle-history', () => setHistoryOpen((v) => !v));
    on('menu:theme', (theme: string) => {
      setMode(theme as ThemeMode);
      message.success(theme === 'dark' ? '已切换到暗黑模式' : '已切换到明亮模式');
    });

    return () => unsubs.forEach((fn) => fn());
  }, [handleExport, handleDeleteSelected, handleLinkAnalysis, handleClusterAnalysis, handleSNAAnalysis, actions, dispatch, setMode]);

  return (
    <>
      <div className="app-container">
        <div className="app-drag-bar" style={{ background: tokens.bgDragBar }} />
        <div className="app-content">
          {showSidebar && <Sidebar />}
          <div className="graph-area">
            <GraphCanvas />
            <CanvasToolbar
              onAddEntity={() => setAddEntityVisible(true)}
              onAddRelationship={() => setAddEdgeVisible(true)}
              onPathAnalysis={() => setPathModalVisible(true)}
              onToggleHistory={() => setHistoryOpen(true)}
            />
            <SearchOverlay />
          </div>
          {showPanel && <PropertyPanel />}
        </div>
        <StatusBar />
      </div>

      <AddEntityModal visible={addEntityVisible} onClose={() => setAddEntityVisible(false)} />
      <AddEdgeModal visible={addEdgeVisible} onClose={() => setAddEdgeVisible(false)} />
      <ImportModal visible={importVisible} onClose={() => setImportVisible(false)} />
      <PathAnalysisModal visible={pathModalVisible} onClose={() => setPathModalVisible(false)} />
      <HistoryDrawer open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </>
  );
}

function ThemedApp() {
  const { mode } = useTheme();
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#4f6ef7',
          borderRadius: 6,
          fontSize: 13,
        },
      }}
    >
      <GraphProvider>
        <AppInner />
      </GraphProvider>
    </ConfigProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default App;
