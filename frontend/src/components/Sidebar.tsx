import React, { useMemo, useState } from 'react';
import { Tooltip, Button, Popover, Input, message } from 'antd';
import {
  PlusOutlined,
  UserOutlined,
  BankOutlined,
  CalendarOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  CreditCardOutlined,
  CarOutlined,
  FileOutlined,
  HomeOutlined,
  GlobalOutlined,
  TagOutlined,
  StarOutlined,
  FlagOutlined,
  ShopOutlined,
  TeamOutlined,
  ToolOutlined,
  LaptopOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';

const ICON_MAP: Record<string, React.ReactNode> = {
  user: <UserOutlined />,
  bank: <BankOutlined />,
  calendar: <CalendarOutlined />,
  environment: <EnvironmentOutlined />,
  phone: <PhoneOutlined />,
  'credit-card': <CreditCardOutlined />,
  car: <CarOutlined />,
  file: <FileOutlined />,
  home: <HomeOutlined />,
  global: <GlobalOutlined />,
  tag: <TagOutlined />,
  star: <StarOutlined />,
  flag: <FlagOutlined />,
  shop: <ShopOutlined />,
  team: <TeamOutlined />,
  tool: <ToolOutlined />,
  laptop: <LaptopOutlined />,
  safety: <SafetyOutlined />,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const COLOR_PRESETS = [
  '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
  '#eb2f96', '#13c2c2', '#fa541c', '#2f54eb', '#a0d911',
  '#ff7a45', '#597ef7', '#36cfc9', '#f759ab', '#ffc53d',
  '#9254de',
];

const Sidebar: React.FC = () => {
  const { state, dispatch, actions } = useGraph();
  const { tokens, mode } = useTheme();
  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('tag');
  const [newColor, setNewColor] = useState('#597ef7');

  const entityCountByType = useMemo(() => {
    const counts: Record<string, number> = {};
    state.entities.forEach((e) => {
      counts[e.typeId] = (counts[e.typeId] || 0) + 1;
    });
    return counts;
  }, [state.entities]);

  const handleTypeFilter = (typeId: string) => {
    const entityIds = state.entities.filter((e) => e.typeId === typeId).map((e) => e.id);
    const allMatch =
      entityIds.length > 0 &&
      state.highlightIds.length === entityIds.length &&
      state.highlightIds.every((id) => entityIds.includes(id));
    dispatch({ type: 'SET_HIGHLIGHT', payload: allMatch ? [] : entityIds });
  };

  const handleAddType = async () => {
    const name = newName.trim();
    if (!name) {
      message.warning('请输入类型名称');
      return;
    }
    if (state.entityTypes.some((t) => t.name === name)) {
      message.warning('该类型名称已存在');
      return;
    }
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);
    await actions.addEntityType({ id, name, color: newColor, icon: newIcon });
    message.success(`类型「${name}」已添加`);
    setNewName('');
    setNewIcon('tag');
    setNewColor('#597ef7');
    setAddTypeOpen(false);
  };

  const isDark = mode === 'dark';

  const addTypeContent = (
    <div style={{ width: 240 }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4, fontWeight: 600 }}>名称</div>
        <Input
          size="small"
          placeholder="输入类型名称"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onPressEnter={handleAddType}
          maxLength={10}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4, fontWeight: 600 }}>图标</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {ICON_OPTIONS.map((key) => (
            <div
              key={key}
              onClick={() => setNewIcon(key)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: 14,
                border: newIcon === key
                  ? `2px solid ${newColor}`
                  : `1px solid ${tokens.border}`,
                background: newIcon === key ? `${newColor}15` : 'transparent',
                color: newIcon === key ? newColor : tokens.textTertiary,
                transition: 'all 0.15s',
              }}
            >
              {ICON_MAP[key]}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: tokens.textMuted, marginBottom: 4, fontWeight: 600 }}>颜色</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {COLOR_PRESETS.map((c) => (
            <div
              key={c}
              onClick={() => setNewColor(c)}
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: c,
                cursor: 'pointer',
                border: newColor === c ? '2px solid ' + tokens.text : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            />
          ))}
        </div>
      </div>
      <Button type="primary" size="small" block onClick={handleAddType}>
        添加类型
      </Button>
    </div>
  );

  return (
    <div
      style={{
        width: 200,
        minWidth: 200,
        background: tokens.bgPanel,
        borderRight: `1px solid ${tokens.border}`,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        transition: 'background 0.3s, border-color 0.3s',
      }}
    >
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 6px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 4px',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: tokens.textMuted,
              fontWeight: 600,
            }}
          >
            实体类型
          </span>
          <Popover
            content={addTypeContent}
            title={<span style={{ fontSize: 13 }}>新建类型</span>}
            trigger="click"
            open={addTypeOpen}
            onOpenChange={setAddTypeOpen}
            placement="rightTop"
          >
            <PlusOutlined
              style={{
                fontSize: 11,
                color: tokens.textMuted,
                cursor: 'pointer',
                padding: 2,
              }}
            />
          </Popover>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-start' }}>
          {state.entityTypes.map((type) => {
            const count = entityCountByType[type.id] || 0;
            const isFiltered =
              state.highlightIds.length > 0 &&
              state.entities
                .filter((e) => e.typeId === type.id)
                .every((e) => state.highlightIds.includes(e.id)) &&
              state.entities.some((e) => e.typeId === type.id);

            return (
              <Tooltip key={type.id} title={`${type.name} (${count}) · 拖拽到画布创建`}>
                <div
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/entity-type', JSON.stringify(type));
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => handleTypeFilter(type.id)}
                  style={{
                    width: 56,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 3,
                    padding: '8px 4px 6px',
                    borderRadius: 8,
                    cursor: 'grab',
                    background: isFiltered
                      ? `${type.color}18`
                      : isDark
                        ? 'rgba(255,255,255,0.03)'
                        : 'rgba(0,0,0,0.02)',
                    border: isFiltered
                      ? `1.5px solid ${type.color}55`
                      : `1px solid ${tokens.border}`,
                    transition: 'all 0.2s',
                    userSelect: 'none',
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      background: `linear-gradient(135deg, ${type.color}, ${type.color}bb)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 2px 6px ${type.color}33`,
                    }}
                  >
                    <span style={{ color: '#fff', fontSize: 14 }}>
                      {ICON_MAP[type.icon] || <TagOutlined />}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      color: isFiltered ? type.color : tokens.textSecondary,
                      fontWeight: isFiltered ? 600 : 400,
                      textAlign: 'center',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%',
                    }}
                  >
                    {type.name}
                  </span>
                  {count > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        background: type.color,
                        color: '#fff',
                        borderRadius: 8,
                        padding: '0 4px',
                        fontSize: 9,
                        fontWeight: 700,
                        minWidth: 14,
                        textAlign: 'center',
                        lineHeight: '15px',
                      }}
                    >
                      {count}
                    </span>
                  )}
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
