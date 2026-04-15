import React, { useState, useCallback } from 'react';
import type { SidebarPanel } from '../../../shared/types';

// ============================================================================
// Enhanced Activity Bar - SVG icons, tooltips, badges, drag-drop reorder
// ============================================================================

interface ActivityBarItem {
  id: SidebarPanel;
  title: string;
  shortcut?: string;
  badge?: number;
  svg: string;
}

const ACTIVITY_ITEMS: ActivityBarItem[] = [
  {
    id: 'explorer',
    title: 'Explorer',
    shortcut: 'Ctrl+Shift+E',
    svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z"/></svg>',
  },
  {
    id: 'search',
    title: 'Search',
    shortcut: 'Ctrl+Shift+F',
    svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="7"/><path d="M16 16L21 21"/></svg>',
  },
  {
    id: 'git',
    title: 'Source Control',
    shortcut: 'Ctrl+Shift+G',
    svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M12 9V12M12 12L6 15M12 12L18 15"/></svg>',
  },
  {
    id: 'extensions',
    title: 'Extensions',
    shortcut: 'Ctrl+Shift+X',
    svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="8" height="8" rx="1"/><rect x="13" y="3" width="8" height="8" rx="1"/><rect x="3" y="13" width="8" height="8" rx="1"/><rect x="13" y="13" width="8" height="8" rx="1"/></svg>',
  },
  {
    id: 'ai-chat',
    title: 'AI Chat',
    shortcut: 'Ctrl+Shift+I',
    svg: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2C6.48 2 2 5.58 2 10C2 12.12 3.04 14.04 4.74 15.44L3 22L7.5 19.5C8.9 19.83 10.42 20 12 20C17.52 20 22 16.42 22 12C22 7.58 17.52 4 12 4" stroke-dasharray="2 2"/><circle cx="8" cy="11" r="1" fill="currentColor"/><circle cx="12" cy="11" r="1" fill="currentColor"/><circle cx="16" cy="11" r="1" fill="currentColor"/></svg>',
  },
];

interface ActivityBarProps {
  activePanel: SidebarPanel;
  sidebarVisible: boolean;
  onPanelClick: (id: SidebarPanel) => void;
  onToggleSidebar: () => void;
  badges?: Partial<Record<SidebarPanel, number>>;
}

export const ActivityBar: React.FC<ActivityBarProps> = ({
  activePanel,
  sidebarVisible,
  onPanelClick,
  onToggleSidebar,
  badges = {},
}) => {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const handleClick = useCallback((id: SidebarPanel) => {
    if (activePanel === id && sidebarVisible) {
      onToggleSidebar();
    } else {
      onPanelClick(id);
    }
  }, [activePanel, sidebarVisible, onPanelClick, onToggleSidebar]);

  const handleMouseEnter = useCallback((e: React.MouseEvent, id: string) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setHoveredItem(id);
    setTooltipPos({ x: rect.right + 8, y: rect.top + rect.height / 2 });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredItem(null);
    setTooltipPos(null);
  }, []);

  return (
    <div style={{
      width: 48,
      height: '100%',
      background: 'var(--activity-bar-background, #333333)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      paddingTop: 4,
      borderRight: '1px solid var(--activity-bar-border, #333333)',
      flexShrink: 0,
    }}>
      {/* Top items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
        {ACTIVITY_ITEMS.map((item) => {
          const isActive = activePanel === item.id && sidebarVisible;
          const badge = badges[item.id] || item.badge;

          return (
            <div
              key={item.id}
              onClick={() => handleClick(item.id)}
              onMouseEnter={(e) => handleMouseEnter(e, item.id)}
              onMouseLeave={handleMouseLeave}
              style={{
                position: 'relative',
                width: 48,
                height: 48,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isActive
                  ? 'var(--activity-bar-foreground, #fff)'
                  : 'var(--activity-bar-inactive-foreground, #858585)',
                borderLeft: isActive ? '2px solid var(--accent, #007acc)' : '2px solid transparent',
                opacity: isActive ? 1 : 0.7,
                transition: 'opacity 0.15s, color 0.15s',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: item.svg }} />

              {/* Badge */}
              {badge != null && badge > 0 && (
                <span style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  minWidth: 16,
                  height: 16,
                  borderRadius: 8,
                  background: 'var(--badge-background, #007acc)',
                  color: 'var(--badge-foreground, #fff)',
                  fontSize: 10,
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                }}>
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingBottom: 8 }}>
        <div
          style={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--activity-bar-inactive-foreground, #858585)',
            opacity: 0.7,
          }}
          onMouseEnter={(e) => handleMouseEnter(e, 'settings')}
          onMouseLeave={handleMouseLeave}
          title="Settings"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredItem && tooltipPos && (
        <div style={{
          position: 'fixed',
          left: tooltipPos.x,
          top: tooltipPos.y,
          transform: 'translateY(-50%)',
          background: 'var(--tooltip-background, #252526)',
          border: '1px solid var(--tooltip-border, #454545)',
          color: 'var(--tooltip-foreground, #ccc)',
          padding: '4px 8px',
          borderRadius: 3,
          fontSize: 12,
          whiteSpace: 'nowrap',
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}>
          {ACTIVITY_ITEMS.find((i) => i.id === hoveredItem)?.title || 'Settings'}
          {ACTIVITY_ITEMS.find((i) => i.id === hoveredItem)?.shortcut && (
            <span style={{ marginLeft: 8, opacity: 0.7 }}>
              {ACTIVITY_ITEMS.find((i) => i.id === hoveredItem)?.shortcut}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
