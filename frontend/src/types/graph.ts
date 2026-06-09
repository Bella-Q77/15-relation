export interface Property {
  key: string;
  value: string;
}

export interface EntityType {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface RelationType {
  id: string;
  name: string;
  color: string;
}

export interface Entity {
  id: string;
  typeId: string;
  label: string;
  properties: Property[];
  x?: number;
  y?: number;
}

export interface Relationship {
  id: string;
  source: string;
  target: string;
  typeId: string;
  label: string;
  properties: Property[];
  directed: boolean;
}

export interface GraphData {
  entities: Entity[];
  relationships: Relationship[];
  entityTypes: EntityType[];
  relationTypes: RelationType[];
}

export interface LinkAnalysisResult {
  entities: Entity[];
  relationships: Relationship[];
}

export interface PathResult {
  paths: string[][];
}

export interface ClusterResult {
  clusters: Record<string, number>;
}

export interface SNAMetrics {
  entityId: string;
  degreeCentrality: number;
  betweennessCentrality: number;
  closenessCentrality: number;
}

export interface SNAResult {
  metrics: SNAMetrics[];
}

export type LayoutType =
  | 'forceAtlas2'
  | 'force'
  | 'concentric'
  | 'circular'
  | 'grid'
  | 'dagre'
  | 'radial'
  | 'fishbone'
  | 'eco-tree'
  | 'activity'
  | 'random';

export interface LayoutOption {
  type: LayoutType;
  label: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { type: 'forceAtlas2', label: '力导向布局' },
  { type: 'concentric', label: '同心圆布局' },
  { type: 'circular', label: '环形布局' },
  { type: 'grid', label: '网格布局' },
  { type: 'dagre', label: '层次布局' },
  { type: 'radial', label: '辐射布局' },
  { type: 'fishbone', label: '鱼骨布局' },
  { type: 'eco-tree', label: '生态树布局' },
  { type: 'activity', label: '活动图布局' },
];

// ==================== History ====================

export interface HistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  detail: string;
}

export interface NeuroDBStatus {
  connected: boolean;
  host: string;
  port: number;
  nodeCount: number;
  linkCount: number;
  embedded: boolean;
  binaryPath: string;
  installDir: string;
}

export const ENTITY_ICON_MAP: Record<string, string> = {
  user: 'UserOutlined',
  bank: 'BankOutlined',
  calendar: 'CalendarOutlined',
  environment: 'EnvironmentOutlined',
  phone: 'PhoneOutlined',
  'credit-card': 'CreditCardOutlined',
  car: 'CarOutlined',
  file: 'FileOutlined',
};
