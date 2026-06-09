import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { SearchOutlined, CloseOutlined } from '@ant-design/icons';
import { useGraph } from '../context/GraphContext';
import { useTheme } from '../context/ThemeContext';

const SearchOverlay: React.FC = () => {
  const { state, dispatch } = useGraph();
  const { tokens, mode } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setQuery('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  const entityTypeMap = useMemo(
    () => new Map(state.entityTypes.map((t) => [t.id, t])),
    [state.entityTypes],
  );
  const relationTypeMap = useMemo(
    () => new Map(state.relationTypes.map((t) => [t.id, t])),
    [state.relationTypes],
  );

  const results = useMemo(() => {
    const kw = query.trim().toLowerCase();
    if (!kw) {
      return {
        entities: state.entities,
        relationships: state.relationships,
        totalEntities: state.entities.length,
        totalRelationships: state.relationships.length,
      };
    }

    const entities = state.entities.filter(
      (e) =>
        e.label.toLowerCase().includes(kw) ||
        e.properties?.some(
          (p) => p.key.toLowerCase().includes(kw) || p.value.toLowerCase().includes(kw),
        ),
    );
    const relationships = state.relationships.filter((r) => {
      const srcLabel = state.entities.find((e) => e.id === r.source)?.label || '';
      const tgtLabel = state.entities.find((e) => e.id === r.target)?.label || '';
      return (
        r.label.toLowerCase().includes(kw) ||
        srcLabel.toLowerCase().includes(kw) ||
        tgtLabel.toLowerCase().includes(kw) ||
        r.properties?.some(
          (p) => p.key.toLowerCase().includes(kw) || p.value.toLowerCase().includes(kw),
        )
      );
    });
    return {
      entities,
      relationships,
      totalEntities: entities.length,
      totalRelationships: relationships.length,
    };
  }, [query, state.entities, state.relationships]);

  const handleSelectEntity = useCallback(
    (id: string) => {
      dispatch({ type: 'SELECT_NODE', payload: id });
      dispatch({ type: 'SET_HIGHLIGHT', payload: [id] });
      setOpen(false);
    },
    [dispatch],
  );

  const handleSelectRelationship = useCallback(
    (id: string, source: string, target: string) => {
      dispatch({ type: 'SELECT_EDGE', payload: id });
      dispatch({ type: 'SET_HIGHLIGHT', payload: [source, target] });
      setOpen(false);
    },
    [dispatch],
  );

  const isDark = mode === 'dark';

  const barBg = isDark ? 'rgba(40,44,52,0.85)' : 'rgba(255,255,255,0.88)';
  const panelBg = isDark ? 'rgba(32,35,42,0.98)' : 'rgba(255,255,255,0.98)';
  const hoverBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';

  if (!open) {
    return (
      <div
        onClick={() => setOpen(true)}
        style={{
          position: 'absolute',
          top: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 18px',
          borderRadius: 20,
          background: barBg,
          backdropFilter: 'blur(12px)',
          boxShadow: tokens.shadowPanel,
          border: `1px solid ${tokens.border}`,
          cursor: 'pointer',
          transition: 'all 0.2s',
          userSelect: 'none',
          minWidth: 200,
        }}
      >
        <SearchOutlined style={{ color: tokens.textMuted, fontSize: 13 }} />
        <span style={{ color: tokens.textMuted, fontSize: 12 }}>搜索实体和关系...</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: tokens.textDim,
            background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
            padding: '1px 6px',
            borderRadius: 4,
          }}
        >
          /
        </span>
      </div>
    );
  }

  const hasResults = results.totalEntities > 0 || results.totalRelationships > 0;

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: 420,
        maxHeight: 460,
        borderRadius: 12,
        background: panelBg,
        backdropFilter: 'blur(16px)',
        boxShadow: isDark
          ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
          : '0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'searchPanelIn 0.15s ease-out',
      }}
    >
      <style>{`
        @keyframes searchPanelIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.97); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          borderBottom: `1px solid ${tokens.border}`,
        }}
      >
        <SearchOutlined style={{ color: tokens.primary, fontSize: 15 }} />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="搜索实体名称、属性、关系..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontSize: 14,
            color: tokens.text,
            fontFamily: 'inherit',
          }}
        />
        <CloseOutlined
          onClick={() => setOpen(false)}
          style={{
            color: tokens.textMuted,
            fontSize: 12,
            cursor: 'pointer',
            padding: 4,
          }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {!hasResults ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 0',
              color: tokens.textDim,
              fontSize: 12,
            }}
          >
            {query ? '无匹配结果' : '暂无数据'}
          </div>
        ) : (
          <>
            {results.totalEntities > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: tokens.textMuted,
                    padding: '6px 14px 4px',
                  }}
                >
                  实体 ({results.totalEntities})
                </div>
                {results.entities.map((entity) => {
                  const type = entityTypeMap.get(entity.typeId);
                  return (
                    <SearchItem
                      key={entity.id}
                      color={type?.color || '#888'}
                      letter={type?.name?.charAt(0) || '?'}
                      title={entity.label}
                      subtitle={type?.name}
                      hoverBg={hoverBg}
                      tokens={tokens}
                      onClick={() => handleSelectEntity(entity.id)}
                    />
                  );
                })}
              </div>
            )}
            {results.totalRelationships > 0 && (
              <div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    color: tokens.textMuted,
                    padding: '8px 14px 4px',
                    borderTop: results.totalEntities > 0 ? `1px solid ${tokens.border}` : 'none',
                  }}
                >
                  关系 ({results.totalRelationships})
                </div>
                {results.relationships.map((rel) => {
                  const relType = relationTypeMap.get(rel.typeId);
                  const srcLabel =
                    state.entities.find((e) => e.id === rel.source)?.label || rel.source;
                  const tgtLabel =
                    state.entities.find((e) => e.id === rel.target)?.label || rel.target;
                  return (
                    <SearchItem
                      key={rel.id}
                      color={relType?.color || '#888'}
                      letter="↔"
                      title={`${srcLabel} → ${tgtLabel}`}
                      subtitle={rel.label || relType?.name}
                      hoverBg={hoverBg}
                      tokens={tokens}
                      onClick={() => handleSelectRelationship(rel.id, rel.source, rel.target)}
                    />
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

interface SearchItemProps {
  color: string;
  letter: string;
  title: string;
  subtitle?: string;
  hoverBg: string;
  tokens: any;
  onClick: () => void;
}

const SearchItem: React.FC<SearchItemProps> = ({
  color,
  letter,
  title,
  subtitle,
  hoverBg,
  tokens,
  onClick,
}) => {
  const [hover, setHover] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 14px',
        cursor: 'pointer',
        background: hover ? hoverBg : 'transparent',
        transition: 'background 0.12s',
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, ${color}bb)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>{letter}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            color: tokens.text,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 10, color: tokens.textMuted }}>{subtitle}</div>
        )}
      </div>
    </div>
  );
};

export default SearchOverlay;
