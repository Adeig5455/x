import React, { useState, useCallback } from 'react';

// ============================================================================
// Call Hierarchy - Incoming/outgoing call tree with navigation
// ============================================================================

export interface CallHierarchyItem {
  id: string;
  name: string;
  kind: 'function' | 'method' | 'constructor' | 'class' | 'module' | 'property';
  detail?: string;
  filePath: string;
  line: number;
  column: number;
  selectionRange: { startLine: number; endLine: number; startColumn: number; endColumn: number };
  children?: CallHierarchyItem[];
  isExpanded?: boolean;
  callCount?: number;
}

export type CallHierarchyDirection = 'incoming' | 'outgoing';

interface CallHierarchyProps {
  root: CallHierarchyItem | null;
  direction: CallHierarchyDirection;
  onDirectionChange: (dir: CallHierarchyDirection) => void;
  onItemClick: (item: CallHierarchyItem) => void;
  onExpand: (item: CallHierarchyItem) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const KIND_ICONS: Record<CallHierarchyItem['kind'], { icon: string; color: string }> = {
  function: { icon: 'f', color: '#dcdcaa' },
  method: { icon: 'm', color: '#dcdcaa' },
  constructor: { icon: 'C', color: '#dcdcaa' },
  class: { icon: 'C', color: '#e8ab53' },
  module: { icon: 'M', color: '#569cd6' },
  property: { icon: 'P', color: '#9cdcfe' },
};

const CallHierarchyNode: React.FC<{
  item: CallHierarchyItem;
  depth: number;
  onItemClick: (item: CallHierarchyItem) => void;
  onExpand: (item: CallHierarchyItem) => void;
  activeId?: string;
}> = ({ item, depth, onItemClick, onExpand, activeId }) => {
  const kindInfo = KIND_ICONS[item.kind];
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div>
      <div
        onClick={() => onItemClick(item)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `2px 8px 2px ${depth * 16 + 8}px`,
          cursor: 'pointer',
          background: activeId === item.id ? 'rgba(55,148,255,0.1)' : 'transparent',
          borderLeft: activeId === item.id ? '2px solid var(--accent-color)' : '2px solid transparent',
          lineHeight: '22px',
          fontSize: 12,
        }}
        onMouseOver={(e) => { if (activeId !== item.id) e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseOut={(e) => { if (activeId !== item.id) e.currentTarget.style.background = 'transparent'; }}
      >
        {/* Expand toggle */}
        <span
          onClick={(e) => { e.stopPropagation(); onExpand(item); }}
          style={{ width: 12, fontSize: 8, color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}
        >
          {hasChildren || !item.isExpanded ? (item.isExpanded ? '▼' : '▶') : ' '}
        </span>

        {/* Kind icon */}
        <span style={{
          width: 16, height: 16, borderRadius: 3,
          background: `${kindInfo.color}22`, color: kindInfo.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 600, flexShrink: 0,
        }}>
          {kindInfo.icon}
        </span>

        {/* Name */}
        <span style={{ color: 'var(--text-primary)', fontFamily: 'monospace', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.name}
        </span>

        {/* Detail */}
        {item.detail && (
          <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{item.detail}</span>
        )}

        {/* Call count */}
        {item.callCount != null && item.callCount > 1 && (
          <span style={{
            fontSize: 9, padding: '0 4px', borderRadius: 8,
            background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
          }}>
            ×{item.callCount}
          </span>
        )}

        {/* File location */}
        <span style={{ color: 'var(--text-secondary)', fontSize: 10, fontFamily: 'monospace', flexShrink: 0 }}>
          {item.filePath.split('/').pop()}:{item.line}
        </span>
      </div>

      {/* Children */}
      {item.isExpanded && item.children && item.children.map((child) => (
        <CallHierarchyNode
          key={child.id}
          item={child}
          depth={depth + 1}
          onItemClick={onItemClick}
          onExpand={onExpand}
          activeId={activeId}
        />
      ))}
    </div>
  );
};

export const CallHierarchy: React.FC<CallHierarchyProps> = ({
  root,
  direction,
  onDirectionChange,
  onItemClick,
  onExpand,
  onRefresh,
  isLoading,
}) => {
  const [activeId, setActiveId] = useState<string | undefined>();

  const handleItemClick = useCallback((item: CallHierarchyItem) => {
    setActiveId(item.id);
    onItemClick(item);
  }, [onItemClick]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          Call Hierarchy
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => onDirectionChange('incoming')}
          style={{
            padding: '2px 8px', borderRadius: 3, border: 'none', fontSize: 10, cursor: 'pointer',
            background: direction === 'incoming' ? 'var(--accent-color)' : 'transparent',
            color: direction === 'incoming' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          ← Incoming
        </button>
        <button
          onClick={() => onDirectionChange('outgoing')}
          style={{
            padding: '2px 8px', borderRadius: 3, border: 'none', fontSize: 10, cursor: 'pointer',
            background: direction === 'outgoing' ? 'var(--accent-color)' : 'transparent',
            color: direction === 'outgoing' ? '#fff' : 'var(--text-secondary)',
          }}
        >
          Outgoing →
        </button>
        <button
          onClick={onRefresh}
          title="Refresh"
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}
        >
          ⟳
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 12 }}>
            Loading call hierarchy...
          </div>
        ) : !root ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 12 }}>
            Place cursor on a function or method to see its call hierarchy
          </div>
        ) : (
          <CallHierarchyNode
            item={root}
            depth={0}
            onItemClick={handleItemClick}
            onExpand={onExpand}
            activeId={activeId}
          />
        )}
      </div>
    </div>
  );
};
