import React, { useState, useCallback, useEffect, useRef } from 'react';

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: number;
  actions?: Array<{ label: string; onClick: () => void; primary?: boolean }>;
  progress?: number;
  persistent?: boolean;
  source?: string;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  maxVisible?: number;
}

const ICON_MAP: Record<string, string> = {
  info: 'ℹ',
  warning: '⚠',
  error: '✕',
  success: '✓',
};

const COLOR_MAP: Record<string, string> = {
  info: 'var(--accent, #007acc)',
  warning: 'var(--warning, #e2c08d)',
  error: 'var(--error, #f48771)',
  success: 'var(--success, #81b88b)',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismiss,
  onDismissAll,
  maxVisible = 5,
}) => {
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleNotifications = expanded
    ? notifications
    : notifications.slice(0, maxVisible);

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [handleClickOutside]);

  if (notifications.length === 0) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        bottom: 30,
        right: 16,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: 8,
        maxHeight: expanded ? '80vh' : '60vh',
        overflowY: expanded ? 'auto' : 'hidden',
        width: 380,
      }}
    >
      {visibleNotifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onDismiss={() => onDismiss(notification.id)}
        />
      ))}

      {notifications.length > maxVisible && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '4px 12px',
            fontSize: 12,
            color: 'var(--text-secondary, #aaa)',
            cursor: 'pointer',
          }}
        >
          <span onClick={() => setExpanded(!expanded)}>
            {expanded
              ? 'Show less'
              : `${notifications.length - maxVisible} more notifications`}
          </span>
          <span
            onClick={onDismissAll}
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            Clear all
          </span>
        </div>
      )}
    </div>
  );
};

const NotificationToast: React.FC<{
  notification: NotificationItem;
  onDismiss: () => void;
}> = ({ notification, onDismiss }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    requestAnimationFrame(() => setOpacity(1));
  }, []);

  const timeAgo = getTimeAgo(notification.timestamp);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary, #252526)',
        border: `1px solid ${COLOR_MAP[notification.type]}40`,
        borderLeft: `3px solid ${COLOR_MAP[notification.type]}`,
        borderRadius: 6,
        padding: '10px 14px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        opacity,
        transition: 'opacity 0.3s, transform 0.2s',
        transform: isHovered ? 'translateX(-4px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span
          style={{
            color: COLOR_MAP[notification.type],
            fontSize: 14,
            fontWeight: 'bold',
            flexShrink: 0,
            width: 18,
            textAlign: 'center',
          }}
        >
          {ICON_MAP[notification.type]}
        </span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontWeight: 600,
                fontSize: 13,
                color: 'var(--text-primary, #d4d4d4)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {notification.title}
            </span>
            <button
              onClick={onDismiss}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary, #888)',
                cursor: 'pointer',
                fontSize: 16,
                padding: '0 2px',
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.2s',
              }}
            >
              ×
            </button>
          </div>

          <p
            style={{
              fontSize: 12,
              color: 'var(--text-secondary, #aaa)',
              margin: '4px 0',
              lineHeight: 1.4,
            }}
          >
            {notification.message}
          </p>

          {notification.progress !== undefined && (
            <div
              style={{
                height: 3,
                background: 'var(--input-bg, #3c3c3c)',
                borderRadius: 2,
                marginTop: 6,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, notification.progress)}%`,
                  background: COLOR_MAP[notification.type],
                  transition: 'width 0.3s',
                  borderRadius: 2,
                }}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 6,
            }}
          >
            <span style={{ fontSize: 11, color: 'var(--text-secondary, #666)' }}>
              {notification.source && `${notification.source} · `}
              {timeAgo}
            </span>

            {notification.actions && notification.actions.length > 0 && (
              <div style={{ display: 'flex', gap: 6 }}>
                {notification.actions.map((action, i) => (
                  <button
                    key={i}
                    onClick={action.onClick}
                    style={{
                      background: action.primary
                        ? 'var(--button-bg, #0e639c)'
                        : 'transparent',
                      color: action.primary
                        ? 'var(--button-fg, #fff)'
                        : 'var(--accent, #007acc)',
                      border: action.primary ? 'none' : '1px solid var(--accent, #007acc)',
                      padding: '2px 10px',
                      fontSize: 11,
                      borderRadius: 3,
                      cursor: 'pointer',
                    }}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

function getTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
