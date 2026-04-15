import React, { useState, useCallback, useRef } from 'react';

// ============================================================================
// Enhanced Breadcrumbs - dropdown navigation, symbol outline, keyboard nav
// ============================================================================

interface BreadcrumbItem {
  label: string;
  path: string;
  type: 'file' | 'folder' | 'symbol';
  icon?: string;
  children?: BreadcrumbItem[];
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  visible: boolean;
  onNavigate?: (path: string, type: BreadcrumbItem['type']) => void;
  onItemClick?: (item: BreadcrumbItem) => void;
}

const BreadcrumbDropdown: React.FC<{
  items: BreadcrumbItem[];
  position: { x: number; y: number };
  onSelect: (item: BreadcrumbItem) => void;
  onClose: () => void;
}> = ({ items, position, onSelect, onClose }) => {
  const [filter, setFilter] = useState('');
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(filter.toLowerCase())
  );

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    else if (e.key === 'ArrowDown') setHoveredIndex((prev) => Math.min(prev + 1, filtered.length - 1));
    else if (e.key === 'ArrowUp') setHoveredIndex((prev) => Math.max(prev - 1, 0));
    else if (e.key === 'Enter' && hoveredIndex >= 0 && hoveredIndex < filtered.length) {
      onSelect(filtered[hoveredIndex]);
    }
  }, [filtered, hoveredIndex, onClose, onSelect]);

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 }} />
      <div style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        minWidth: 200,
        maxWidth: 400,
        maxHeight: 300,
        background: 'var(--dropdown-background, #252526)',
        border: '1px solid var(--dropdown-border, #454545)',
        borderRadius: 4,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <input
          ref={inputRef}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Filter..."
          autoFocus
          style={{
            background: 'var(--input-background, #3c3c3c)',
            border: 'none',
            borderBottom: '1px solid var(--dropdown-border, #454545)',
            color: 'var(--input-foreground, #ccc)',
            padding: '6px 8px',
            fontSize: 12,
            outline: 'none',
          }}
          spellCheck={false}
        />
        <div style={{ overflow: 'auto', flex: 1 }}>
          {filtered.map((item, idx) => (
            <div
              key={item.path}
              onClick={() => onSelect(item)}
              onMouseEnter={() => setHoveredIndex(idx)}
              style={{
                padding: '4px 8px',
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: idx === hoveredIndex ? 'var(--list-hover-background, #2a2d2e)' : 'transparent',
                color: 'var(--foreground, #ccc)',
              }}
            >
              <span style={{ opacity: 0.6, fontSize: 10, width: 14, textAlign: 'center' }}>
                {item.type === 'folder' ? '\u{1F4C1}' : item.type === 'symbol' ? '#' : '\u{1F4C4}'}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '8px', textAlign: 'center', color: 'var(--foreground-muted, #888)', fontSize: 11 }}>
              No matches
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  visible,
  onNavigate,
  onItemClick,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredIndex, setHoveredIndex] = useState<number>(-1);

  const handleItemClick = useCallback((item: BreadcrumbItem, index: number, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (item.children && item.children.length > 0) {
      setActiveDropdown(activeDropdown === index ? null : index);
      setDropdownPos({ x: rect.left, y: rect.bottom + 2 });
    } else {
      onItemClick?.(item);
      onNavigate?.(item.path, item.type);
    }
  }, [activeDropdown, onItemClick, onNavigate]);

  const handleDropdownSelect = useCallback((item: BreadcrumbItem) => {
    setActiveDropdown(null);
    onItemClick?.(item);
    onNavigate?.(item.path, item.type);
  }, [onItemClick, onNavigate]);

  if (!visible || items.length === 0) return null;

  const getIconForType = (type: BreadcrumbItem['type']): React.ReactNode => {
    switch (type) {
      case 'folder':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--icon-folder, #dcb67a)">
            <path d="M1.5 2A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V5.5A1.5 1.5 0 0014.5 4H8L6.354 2.354A.5.5 0 006 2H1.5z"/>
          </svg>
        );
      case 'symbol':
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--icon-symbol, #b180d7)">
            <path d="M11.5 1a.5.5 0 010 1h-3a.5.5 0 010-1h3zM12 3.5a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zM6.854 3.646a.5.5 0 010 .708L3.207 8l3.647 3.646a.5.5 0 01-.708.708l-4-4a.5.5 0 010-.708l4-4a.5.5 0 01.708 0zM9.146 3.646a.5.5 0 00 0 .708L12.793 8l-3.647 3.646a.5.5 0 00.708.708l4-4a.5.5 0 000-.708l-4-4a.5.5 0 00-.708 0z"/>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--icon-file, #c5c5c5)">
            <path d="M4 0a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4.5L9.5 0H4zm5.5 0v3a1.5 1.5 0 001.5 1.5h3"/>
          </svg>
        );
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      height: 22,
      padding: '0 8px',
      background: 'var(--breadcrumb-background, #1e1e1e)',
      borderBottom: '1px solid var(--panel-border, #333)',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      {items.map((item, index) => (
        <React.Fragment key={`${item.path}-${index}`}>
          {index > 0 && (
            <span style={{
              margin: '0 2px',
              color: 'var(--breadcrumb-separator, #666)',
              fontSize: 10,
              display: 'flex',
              alignItems: 'center',
            }}>
              <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor">
                <path d="M6 3.5L10.5 8 6 12.5" stroke="currentColor" fill="none" strokeWidth="1.5"/>
              </svg>
            </span>
          )}
          <button
            onClick={(e) => handleItemClick(item, index, e)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(-1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 4px',
              border: 'none',
              borderRadius: 3,
              background: hoveredIndex === index ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: 'var(--breadcrumb-foreground, #a9a9a9)',
              cursor: 'pointer',
              fontSize: 12,
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
              transition: 'background 0.1s',
            }}
            title={item.path}
          >
            {getIconForType(item.type)}
            <span>{item.label}</span>
            {item.children && item.children.length > 0 && (
              <svg width="8" height="8" viewBox="0 0 16 16" fill="currentColor" style={{ opacity: 0.5, marginLeft: 2 }}>
                <path d="M4 6l4 4 4-4"/>
              </svg>
            )}
          </button>
        </React.Fragment>
      ))}

      {/* Dropdown */}
      {activeDropdown !== null && items[activeDropdown]?.children && (
        <BreadcrumbDropdown
          items={items[activeDropdown].children!}
          position={dropdownPos}
          onSelect={handleDropdownSelect}
          onClose={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
};
