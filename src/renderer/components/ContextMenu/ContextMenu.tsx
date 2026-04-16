import React, { useEffect, useRef, useCallback, useState } from 'react';

export interface ContextMenuItem {
  label: string;
  action: string;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  icon?: string;
  submenu?: ContextMenuItem[];
}

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onAction: (action: string) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  items,
  onAction,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [adjustedPosition, setAdjustedPosition] = useState({ x, y });
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);

  useEffect(() => {
    // Adjust position to keep menu in viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let newX = x;
      let newY = y;

      if (x + rect.width > viewportWidth) {
        newX = viewportWidth - rect.width - 4;
      }
      if (y + rect.height > viewportHeight) {
        newY = viewportHeight - rect.height - 4;
      }

      setAdjustedPosition({ x: Math.max(0, newX), y: Math.max(0, newY) });
    }
  }, [x, y]);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    },
    [onClose]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleClickOutside, handleKeyDown]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: adjustedPosition.x,
        top: adjustedPosition.y,
        zIndex: 10000,
        minWidth: 200,
        maxWidth: 320,
        background: 'var(--bg-secondary, #252526)',
        border: '1px solid var(--border, #454545)',
        borderRadius: 5,
        padding: '4px 0',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        fontSize: 13,
        color: 'var(--text-primary, #d4d4d4)',
      }}
      role="menu"
    >
      {items.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={index}
              style={{
                height: 1,
                background: 'var(--border, #454545)',
                margin: '4px 0',
              }}
              role="separator"
            />
          );
        }

        return (
          <div
            key={index}
            onClick={() => {
              if (!item.disabled && !item.submenu) {
                onAction(item.action);
                onClose();
              }
            }}
            onMouseEnter={() => item.submenu && setActiveSubmenu(index)}
            onMouseLeave={() => setActiveSubmenu(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 24px 6px 12px',
              cursor: item.disabled ? 'default' : 'pointer',
              opacity: item.disabled ? 0.4 : 1,
              background: 'transparent',
              position: 'relative',
              transition: 'background 0.1s',
            }}
            onMouseOver={(e) => {
              if (!item.disabled) {
                (e.currentTarget as HTMLDivElement).style.background =
                  'var(--list-hover-bg, #2a2d2e)';
              }
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
            role="menuitem"
            aria-disabled={item.disabled}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.icon && (
                <span style={{ width: 16, textAlign: 'center', fontSize: 14 }}>
                  {item.icon}
                </span>
              )}
              <span>{item.label}</span>
            </span>

            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {item.shortcut && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--text-secondary, #888)',
                    marginLeft: 24,
                  }}
                >
                  {item.shortcut}
                </span>
              )}
              {item.submenu && (
                <span style={{ fontSize: 10, color: 'var(--text-secondary, #888)' }}>▸</span>
              )}
            </span>

            {/* Submenu */}
            {item.submenu && activeSubmenu === index && (
              <div
                style={{
                  position: 'absolute',
                  left: '100%',
                  top: -4,
                }}
              >
                <ContextMenu
                  x={0}
                  y={0}
                  items={item.submenu}
                  onAction={onAction}
                  onClose={onClose}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
