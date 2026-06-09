import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type {
  Entity,
  Relationship,
  EntityType,
  RelationType,
  GraphData,
  LayoutType,
  LinkAnalysisResult,
  PathResult,
  ClusterResult,
  SNAResult,
  HistoryEntry,
  NeuroDBStatus,
} from '../types/graph';

declare global {
  interface Window {
    go: {
      main: {
        App: {
          GetGraphData: () => Promise<GraphData>;
          AddEntity: (json: string) => Promise<Entity>;
          UpdateEntity: (json: string) => Promise<Entity>;
          DeleteEntity: (id: string) => Promise<boolean>;
          AddRelationship: (json: string) => Promise<Relationship>;
          UpdateRelationship: (json: string) => Promise<Relationship>;
          DeleteRelationship: (id: string) => Promise<boolean>;
          GetEntityTypes: () => Promise<EntityType[]>;
          GetRelationTypes: () => Promise<RelationType[]>;
          AddEntityType: (json: string) => Promise<EntityType>;
          AddRelationType: (json: string) => Promise<RelationType>;
          ImportJSONData: (json: string) => Promise<GraphData>;
          ExportJSONData: () => Promise<string>;
          ImportCSVEntities: (csv: string) => Promise<GraphData>;
          ImportCSVRelationships: (csv: string) => Promise<GraphData>;
          ClearData: () => Promise<void>;
          LinkAnalysis: (entityId: string, depth: number) => Promise<LinkAnalysisResult>;
          PathAnalysis: (sourceId: string, targetId: string) => Promise<PathResult>;
          ClusterAnalysis: () => Promise<ClusterResult>;
          SocialNetworkAnalysis: () => Promise<SNAResult>;
          OpenFileDialog: (title: string, filters: any[]) => Promise<string>;
          SaveFileDialog: (title: string, defaultFilename: string, filters: any[]) => Promise<string>;
          ReadFile: (path: string) => Promise<string>;
          WriteFile: (path: string, content: string) => Promise<boolean>;
          WriteBase64File: (path: string, base64Data: string) => Promise<boolean>;
          GetHistory: () => Promise<HistoryEntry[]>;
          GetRecentHistory: (count: number) => Promise<HistoryEntry[]>;
          ClearHistory: () => Promise<void>;
          GetNeuroDBStatus: () => Promise<NeuroDBStatus>;
          ConnectNeuroDB: (host: string, port: number) => Promise<string>;
          SyncToNeuroDB: () => Promise<string>;
          StartNeuroDB: () => Promise<string>;
          StopNeuroDB: () => Promise<string>;
          GetNeuroDBInfo: () => Promise<string>;
        };
      };
    };
  }
}

function getBackend() {
  return window?.go?.main?.App;
}

interface State {
  entities: Entity[];
  relationships: Relationship[];
  entityTypes: EntityType[];
  relationTypes: RelationType[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  layoutType: LayoutType;
  highlightIds: string[];
  analysisResult: any;
  loading: boolean;
  collapsedNodes: Record<string, string[]>;
  linkMode: boolean;
  linkSource: string | null;
}

type Action =
  | { type: 'SET_GRAPH_DATA'; payload: GraphData }
  | { type: 'ADD_ENTITY'; payload: Entity }
  | { type: 'UPDATE_ENTITY'; payload: Entity }
  | { type: 'DELETE_ENTITY'; payload: string }
  | { type: 'ADD_RELATIONSHIP'; payload: Relationship }
  | { type: 'UPDATE_RELATIONSHIP'; payload: Relationship }
  | { type: 'DELETE_RELATIONSHIP'; payload: string }
  | { type: 'SELECT_NODE'; payload: string | null }
  | { type: 'SELECT_EDGE'; payload: string | null }
  | { type: 'SET_LAYOUT'; payload: LayoutType }
  | { type: 'SET_HIGHLIGHT'; payload: string[] }
  | { type: 'SET_ANALYSIS_RESULT'; payload: any }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_DATA' }
  | { type: 'ADD_ENTITY_TYPE'; payload: EntityType }
  | { type: 'COLLAPSE_NODE'; payload: { nodeId: string; hiddenIds: string[] } }
  | { type: 'EXPAND_NODE'; payload: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'SET_LINK_MODE'; payload: boolean }
  | { type: 'SET_LINK_SOURCE'; payload: string | null };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SET_GRAPH_DATA':
      return {
        ...state,
        entities: action.payload.entities || [],
        relationships: action.payload.relationships || [],
        entityTypes: action.payload.entityTypes?.length ? action.payload.entityTypes : state.entityTypes,
        relationTypes: action.payload.relationTypes?.length ? action.payload.relationTypes : state.relationTypes,
      };
    case 'ADD_ENTITY':
      return { ...state, entities: [...state.entities, action.payload] };
    case 'UPDATE_ENTITY':
      return {
        ...state,
        entities: state.entities.map((e) =>
          e.id === action.payload.id ? action.payload : e
        ),
      };
    case 'DELETE_ENTITY':
      return {
        ...state,
        entities: state.entities.filter((e) => e.id !== action.payload),
        relationships: state.relationships.filter(
          (r) => r.source !== action.payload && r.target !== action.payload
        ),
        selectedNodeId: state.selectedNodeId === action.payload ? null : state.selectedNodeId,
      };
    case 'ADD_RELATIONSHIP':
      return { ...state, relationships: [...state.relationships, action.payload] };
    case 'UPDATE_RELATIONSHIP':
      return {
        ...state,
        relationships: state.relationships.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_RELATIONSHIP':
      return {
        ...state,
        relationships: state.relationships.filter((r) => r.id !== action.payload),
        selectedEdgeId: state.selectedEdgeId === action.payload ? null : state.selectedEdgeId,
      };
    case 'SELECT_NODE':
      return { ...state, selectedNodeId: action.payload, selectedEdgeId: null };
    case 'SELECT_EDGE':
      return { ...state, selectedEdgeId: action.payload, selectedNodeId: null };
    case 'SET_LAYOUT':
      return { ...state, layoutType: action.payload };
    case 'SET_HIGHLIGHT':
      return { ...state, highlightIds: action.payload };
    case 'SET_ANALYSIS_RESULT':
      return { ...state, analysisResult: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'CLEAR_DATA':
      return {
        ...state,
        entities: [],
        relationships: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        highlightIds: [],
        analysisResult: null,
        collapsedNodes: {},
      };
    case 'ADD_ENTITY_TYPE':
      if (state.entityTypes.some((t) => t.id === action.payload.id)) return state;
      return { ...state, entityTypes: [...state.entityTypes, action.payload] };
    case 'COLLAPSE_NODE':
      return {
        ...state,
        collapsedNodes: {
          ...state.collapsedNodes,
          [action.payload.nodeId]: action.payload.hiddenIds,
        },
      };
    case 'EXPAND_NODE': {
      const next = { ...state.collapsedNodes };
      delete next[action.payload];
      return { ...state, collapsedNodes: next };
    }
    case 'EXPAND_ALL':
      return { ...state, collapsedNodes: {} };
    case 'SET_LINK_MODE':
      return { ...state, linkMode: action.payload, linkSource: null };
    case 'SET_LINK_SOURCE':
      return { ...state, linkSource: action.payload };
    default:
      return state;
  }
}

const defaultEntityTypes: EntityType[] = [
  { id: 'person', name: '人物', color: '#1890ff', icon: 'user' },
  { id: 'organization', name: '组织', color: '#52c41a', icon: 'bank' },
  { id: 'event', name: '事件', color: '#faad14', icon: 'calendar' },
  { id: 'location', name: '地点', color: '#eb2f96', icon: 'environment' },
  { id: 'phone', name: '电话', color: '#722ed1', icon: 'phone' },
  { id: 'account', name: '账户', color: '#13c2c2', icon: 'credit-card' },
  { id: 'vehicle', name: '车辆', color: '#fa541c', icon: 'car' },
  { id: 'document', name: '文档', color: '#2f54eb', icon: 'file' },
];

const defaultRelationTypes: RelationType[] = [
  { id: 'associate', name: '关联', color: '#999999' },
  { id: 'family', name: '亲属', color: '#f5222d' },
  { id: 'colleague', name: '同事', color: '#1890ff' },
  { id: 'transaction', name: '交易', color: '#52c41a' },
  { id: 'communication', name: '通讯', color: '#722ed1' },
  { id: 'ownership', name: '所有权', color: '#fa8c16' },
  { id: 'membership', name: '成员', color: '#13c2c2' },
  { id: 'travel', name: '出行', color: '#eb2f96' },
];

const initialState: State = {
  entities: [],
  relationships: [],
  entityTypes: defaultEntityTypes,
  relationTypes: defaultRelationTypes,
  selectedNodeId: null,
  selectedEdgeId: null,
  layoutType: 'forceAtlas2',
  highlightIds: [],
  analysisResult: null,
  loading: false,
  collapsedNodes: {},
  linkMode: false,
  linkSource: null,
};

interface GraphContextType {
  state: State;
  dispatch: React.Dispatch<Action>;
  actions: {
    loadGraphData: () => Promise<void>;
    addEntity: (entity: Omit<Entity, 'id'>) => Promise<Entity | null>;
    updateEntity: (entity: Entity) => Promise<void>;
    deleteEntity: (id: string) => Promise<void>;
    addRelationship: (rel: Omit<Relationship, 'id'>) => Promise<Relationship | null>;
    updateRelationship: (rel: Relationship) => Promise<void>;
    deleteRelationship: (id: string) => Promise<void>;
    importJSON: (json: string, overwrite?: boolean) => Promise<void>;
    exportJSON: () => Promise<string>;
    importCSVEntities: (csv: string, overwrite?: boolean) => Promise<void>;
    importCSVRelationships: (csv: string, overwrite?: boolean) => Promise<void>;
    clearData: () => Promise<void>;
    linkAnalysis: (entityId: string, depth: number) => Promise<LinkAnalysisResult | null>;
    pathAnalysis: (sourceId: string, targetId: string) => Promise<PathResult | null>;
    clusterAnalysis: () => Promise<ClusterResult | null>;
    snaAnalysis: () => Promise<SNAResult | null>;
    addEntityType: (et: EntityType) => Promise<void>;
    getHistory: () => Promise<HistoryEntry[]>;
    clearHistory: () => Promise<void>;
    getNeuroDBStatus: () => Promise<NeuroDBStatus | null>;
    connectNeuroDB: (host: string, port: number) => Promise<string>;
    syncToNeuroDB: () => Promise<string>;
    startNeuroDB: () => Promise<string>;
    stopNeuroDB: () => Promise<string>;
  };
}

const GraphContext = createContext<GraphContextType | null>(null);

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadGraphData = useCallback(async () => {
    const backend = getBackend();
    if (!backend) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const data = await backend.GetGraphData();
      dispatch({ type: 'SET_GRAPH_DATA', payload: data });
    } catch (e) {
      console.error('加载数据失败:', e);
    }
    dispatch({ type: 'SET_LOADING', payload: false });
  }, []);

  const addEntity = useCallback(async (entity: Omit<Entity, 'id'>) => {
    const backend = getBackend();
    if (!backend) {
      const newEntity = { ...entity, id: crypto.randomUUID() } as Entity;
      dispatch({ type: 'ADD_ENTITY', payload: newEntity });
      return newEntity;
    }
    try {
      const result = await backend.AddEntity(JSON.stringify(entity));
      dispatch({ type: 'ADD_ENTITY', payload: result });
      return result;
    } catch (e) {
      console.error('添加实体失败:', e);
      return null;
    }
  }, []);

  const updateEntity = useCallback(async (entity: Entity) => {
    const backend = getBackend();
    if (!backend) {
      dispatch({ type: 'UPDATE_ENTITY', payload: entity });
      return;
    }
    try {
      const result = await backend.UpdateEntity(JSON.stringify(entity));
      dispatch({ type: 'UPDATE_ENTITY', payload: result });
    } catch (e) {
      console.error('更新实体失败:', e);
    }
  }, []);

  const deleteEntity = useCallback(async (id: string) => {
    const backend = getBackend();
    if (!backend) {
      dispatch({ type: 'DELETE_ENTITY', payload: id });
      return;
    }
    try {
      await backend.DeleteEntity(id);
      dispatch({ type: 'DELETE_ENTITY', payload: id });
    } catch (e) {
      console.error('删除实体失败:', e);
    }
  }, []);

  const addRelationship = useCallback(async (rel: Omit<Relationship, 'id'>) => {
    const backend = getBackend();
    if (!backend) {
      const newRel = { ...rel, id: crypto.randomUUID() } as Relationship;
      dispatch({ type: 'ADD_RELATIONSHIP', payload: newRel });
      return newRel;
    }
    try {
      const result = await backend.AddRelationship(JSON.stringify(rel));
      dispatch({ type: 'ADD_RELATIONSHIP', payload: result });
      return result;
    } catch (e) {
      console.error('添加关系失败:', e);
      return null;
    }
  }, []);

  const updateRelationship = useCallback(async (rel: Relationship) => {
    const backend = getBackend();
    if (!backend) {
      dispatch({ type: 'UPDATE_RELATIONSHIP', payload: rel });
      return;
    }
    try {
      const result = await backend.UpdateRelationship(JSON.stringify(rel));
      dispatch({ type: 'UPDATE_RELATIONSHIP', payload: result });
    } catch (e) {
      console.error('更新关系失败:', e);
    }
  }, []);

  const deleteRelationship = useCallback(async (id: string) => {
    const backend = getBackend();
    if (!backend) {
      dispatch({ type: 'DELETE_RELATIONSHIP', payload: id });
      return;
    }
    try {
      await backend.DeleteRelationship(id);
      dispatch({ type: 'DELETE_RELATIONSHIP', payload: id });
    } catch (e) {
      console.error('删除关系失败:', e);
    }
  }, []);

  const importJSON = useCallback(async (jsonStr: string, overwrite = false) => {
    if (overwrite) {
      await clearData();
    }
    const backend = getBackend();
    if (!backend) {
      try {
        const data = JSON.parse(jsonStr) as GraphData;
        if (overwrite) {
          dispatch({ type: 'SET_GRAPH_DATA', payload: data });
        } else {
          dispatch({
            type: 'SET_GRAPH_DATA',
            payload: {
              ...data,
              entities: [...state.entities, ...(data.entities || [])],
              relationships: [...state.relationships, ...(data.relationships || [])],
            },
          });
        }
      } catch (e) {
        console.error('导入JSON失败:', e);
      }
      return;
    }
    try {
      const data = await backend.ImportJSONData(jsonStr);
      dispatch({ type: 'SET_GRAPH_DATA', payload: data });
    } catch (e) {
      console.error('导入JSON失败:', e);
    }
  }, [state.entities, state.relationships, clearData]);

  const exportJSON = useCallback(async () => {
    const backend = getBackend();
    if (!backend) {
      return JSON.stringify(
        {
          entities: state.entities,
          relationships: state.relationships,
          entityTypes: state.entityTypes,
          relationTypes: state.relationTypes,
        },
        null,
        2
      );
    }
    try {
      return await backend.ExportJSONData();
    } catch (e) {
      console.error('导出JSON失败:', e);
      return '';
    }
  }, [state]);

  const importCSVEntities = useCallback(async (csv: string, overwrite = false) => {
    if (overwrite) {
      await clearData();
    }
    const backend = getBackend();
    if (!backend) return;
    try {
      const data = await backend.ImportCSVEntities(csv);
      dispatch({ type: 'SET_GRAPH_DATA', payload: data });
    } catch (e) {
      console.error('导入CSV实体失败:', e);
    }
  }, [clearData]);

  const importCSVRelationships = useCallback(async (csv: string, overwrite = false) => {
    if (overwrite) {
      await clearData();
    }
    const backend = getBackend();
    if (!backend) return;
    try {
      const data = await backend.ImportCSVRelationships(csv);
      dispatch({ type: 'SET_GRAPH_DATA', payload: data });
    } catch (e) {
      console.error('导入CSV关系失败:', e);
    }
  }, [clearData]);

  const clearData = useCallback(async () => {
    const backend = getBackend();
    if (backend) {
      await backend.ClearData();
    }
    dispatch({ type: 'CLEAR_DATA' });
  }, []);

  const linkAnalysis = useCallback(async (entityId: string, depth: number) => {
    const backend = getBackend();
    if (!backend) return null;
    try {
      return await backend.LinkAnalysis(entityId, depth);
    } catch (e) {
      console.error('链接分析失败:', e);
      return null;
    }
  }, []);

  const pathAnalysis = useCallback(async (sourceId: string, targetId: string) => {
    const backend = getBackend();
    if (!backend) return null;
    try {
      return await backend.PathAnalysis(sourceId, targetId);
    } catch (e) {
      console.error('路径分析失败:', e);
      return null;
    }
  }, []);

  const clusterAnalysis = useCallback(async () => {
    const backend = getBackend();
    if (!backend) return null;
    try {
      return await backend.ClusterAnalysis();
    } catch (e) {
      console.error('群集分析失败:', e);
      return null;
    }
  }, []);

  const snaAnalysis = useCallback(async () => {
    const backend = getBackend();
    if (!backend) return null;
    try {
      return await backend.SocialNetworkAnalysis();
    } catch (e) {
      console.error('SNA分析失败:', e);
      return null;
    }
  }, []);

  const addEntityType = useCallback(async (et: EntityType) => {
    const backend = getBackend();
    if (backend) {
      try {
        await backend.AddEntityType(JSON.stringify(et));
      } catch (e) {
        console.error('添加实体类型失败:', e);
      }
    }
    dispatch({ type: 'ADD_ENTITY_TYPE', payload: et });
  }, []);

  const getHistory = useCallback(async (): Promise<HistoryEntry[]> => {
    const backend = getBackend();
    if (!backend) return [];
    try {
      return await backend.GetHistory();
    } catch (e) {
      console.error('获取历史记录失败:', e);
      return [];
    }
  }, []);

  const clearHistory = useCallback(async () => {
    const backend = getBackend();
    if (!backend) return;
    try {
      await backend.ClearHistory();
    } catch (e) {
      console.error('清除历史记录失败:', e);
    }
  }, []);

  const getNeuroDBStatus = useCallback(async (): Promise<NeuroDBStatus | null> => {
    const backend = getBackend();
    if (!backend) return null;
    try {
      return await backend.GetNeuroDBStatus();
    } catch (e) {
      console.error('获取NeuroDB状态失败:', e);
      return null;
    }
  }, []);

  const connectNeuroDB = useCallback(async (host: string, port: number): Promise<string> => {
    const backend = getBackend();
    if (!backend) return '后端不可用';
    try {
      return await backend.ConnectNeuroDB(host, port);
    } catch (e) {
      console.error('连接NeuroDB失败:', e);
      return String(e);
    }
  }, []);

  const syncToNeuroDB = useCallback(async (): Promise<string> => {
    const backend = getBackend();
    if (!backend) return '后端不可用';
    try {
      return await backend.SyncToNeuroDB();
    } catch (e) {
      console.error('同步NeuroDB失败:', e);
      return String(e);
    }
  }, []);

  const startNeuroDB = useCallback(async (): Promise<string> => {
    const backend = getBackend();
    if (!backend) return '后端不可用';
    try {
      return await backend.StartNeuroDB();
    } catch (e) {
      console.error('启动NeuroDB失败:', e);
      return String(e);
    }
  }, []);

  const stopNeuroDB = useCallback(async (): Promise<string> => {
    const backend = getBackend();
    if (!backend) return '后端不可用';
    try {
      return await backend.StopNeuroDB();
    } catch (e) {
      console.error('停止NeuroDB失败:', e);
      return String(e);
    }
  }, []);

  useEffect(() => {
    loadGraphData();
  }, [loadGraphData]);

  return (
    <GraphContext.Provider
      value={{
        state,
        dispatch,
        actions: {
          loadGraphData,
          addEntity,
          updateEntity,
          deleteEntity,
          addRelationship,
          updateRelationship,
          deleteRelationship,
          importJSON,
          exportJSON,
          importCSVEntities,
          importCSVRelationships,
          clearData,
          linkAnalysis,
          pathAnalysis,
          clusterAnalysis,
          snaAnalysis,
          addEntityType,
          getHistory,
          clearHistory,
          getNeuroDBStatus,
          connectNeuroDB,
          syncToNeuroDB,
          startNeuroDB,
          stopNeuroDB,
        },
      }}
    >
      {children}
    </GraphContext.Provider>
  );
}

export function useGraph() {
  const context = useContext(GraphContext);
  if (!context) {
    throw new Error('useGraph must be used within a GraphProvider');
  }
  return context;
}
