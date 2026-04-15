import React, { useState, useCallback, useRef } from 'react';
import { getFileIcon } from '../FileIcons/fileIcons';

// ============================================================================
// Enhanced Tab Bar - drag-drop reordering, context menu, scroll, close actions
// ============================================================================

interface Tab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  isDirty: boolean;
  isActive: boolean;
  isPinned?: boolean;
  isPreview?: boolean;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onCloseOtherTabs?: (id: string) => void;
  onCloseTabsToRight?: (id: string) => void;
  onCloseAllTabs?: () => void;
  onReorderTab?: (fromIndex: number, toIndex: number) => void;
  onContextMenu?: (e: React.MouseEvent, tab: Tab) => void;
  onDoubleClick?: (tab: Tab) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab,
  onCloseOtherTabs,
  onCloseTabsToRight,
  onCloseAllTabs,
  onReorderTab,
  onContextMenu,
  onDoubleClick,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [contextMenuTab, setContextMenuTab] = useState<{ tab: Tab; x: number; y: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDropIndex(index);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== toIndex) {
      onReorderTab?.(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
  }, [dragIndex, onReorderTab]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDropIndex(null);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft += e.deltaY;
    }
  }, []);

  const handleTabContextMenu = useCallback((e: React.MouseEvent, tab: Tab) => {
    e.preventDefault();
    if (onContextMenu) {
      onContextMenu(e, tab);
    } else {
      setContextMenuTab({ tab, x: e.clientX, y: e.clientY });
    }
  }, [onContextMenu]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        style={{
          display: 'flex',
          height: 35,
          background: 'var(--editor-group-header-background, #252526)',
          borderBottom: '1px solid var(--panel-border, #1e1e1e)',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTabId;
          const isDragging = dragIndex === index;
          const isDropTarget = dropIndex === index && dragIndex !== index;
          const icon = getFileIcon(tab.fileName);

          return (
            <div
              key={tab.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectTab(tab.id)}
              onDoubleClick={() => onDoubleClick?.(tab)}
              onContextMenu={(e) => handleTabContextMenu(e, tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '100%',
                padding: '0 10px',
                gap: 6,
                cursor: 'pointer',
                userSelect: 'none',
                borderRight: '1px solid var(--panel-border, #1e1e1e)',
                background: isActive
                  ? 'var(--editor-background, #1e1e1e)'
                  : 'var(--tab-inactive-background, #2d2d2d)',
                color: isActive
                  ? 'var(--tab-active-foreground, #fff)'
                  : 'var(--tab-inactive-foreground, #969696)',
                opacity: isDragging ? 0.5 : 1,
                borderLeft: isDropTarget ? '2px solid var(--accent, #007acc)' : 'none',
                borderTop: isActive ? '1px solid var(--accent, #007acc)' : '1px solid transparent',
                minWidth: 0,
                maxWidth: 200,
                flexShrink: 0,
                fontSize: 13,
                fontStyle: tab.isPreview ? 'italic' : 'normal',
              }}
            >
              <span
                style={{ width: 14, height: 14, flexShrink: 0, display: 'inline-flex', alignItems: 'center' }}
                dangerouslySetInnerHTML={{ __html: icon.svg }}
              />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flexShrink: 1 }}>
                {tab.fileName}
              </span>
              {tab.isDirty && (
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--foreground-muted, #888)', flexShrink: 0 }} />
              )}
              {tab.isPinned && (
                <span style={{ fontSize: 10, color: 'var(--accent, #007acc)', flexShrink: 0 }}>P</span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--foreground-muted, #888)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: '0 2px',
                  lineHeight: 1,
                  borderRadius: 3,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 20,
                  height: 20,
                  opacity: isActive ? 1 : 0,
                }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.opacity = '1'; (e.target as HTMLElement).style.background = 'var(--toolbar-hover-background, #3d3d3d)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.opacity = isActive ? '1' : '0'; (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                x
              </button>
            </div>
          );
        })}
      </div>

      {/* Built-in context menu */}
      {contextMenuTab && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            onClick={() => setContextMenuTab(null)}
          />
          <div style={{
            position: 'fixed',
            left: contextMenuTab.x,
            top: contextMenuTab.y,
            background: 'var(--dropdown-background, #2d2d2d)',
            border: '1px solid var(--panel-border, #444)',
            borderRadius: 4,
            zIndex: 1000,
            minWidth: 180,
            padding: '4px 0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            fontSize: 12,
            color: 'var(--foreground, #ccc)',
          }}>
            {[
              { label: 'Close', action: () => onCloseTab(contextMenuTab.tab.id) },
              { label: 'Close Others', action: () => onCloseOtherTabs?.(contextMenuTab.tab.id) },
              { label: 'Close to the Right', action: () => onCloseTabsToRight?.(contextMenuTab.tab.id) },
              { label: 'Close All', action: () => onCloseAllTabs?.() },
            ].map((item, i) => (
              <div
                key={i}
                onClick={() => { item.action(); setContextMenuTab(null); }}
                style={{ padding: '4px 24px', cursor: 'pointer' }}
                onMouseEnter={(e) => { (e.target as HTMLElement).style.background = 'var(--list-hover-background, #094771)'; }}
                onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'transparent'; }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
