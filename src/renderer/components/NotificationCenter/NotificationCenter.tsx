import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Notification Center - Toast notifications with history, actions, progress
// ============================================================================

export interface NotificationAction {
  label: string;
  onClick: () => void;
  primary?: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success' | 'progress';
  title: string;
  message?: string;
  timestamp: number;
  actions?: NotificationAction[];
  progress?: number; // 0-100
  source?: string;
  persistent?: boolean;
  read?: boolean;
}

interface NotificationCenterProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onAction?: (notificationId: string, actionLabel: string) => void;
  maxVisible?: number;
}

const NOTIFICATION_ICONS: Record<NotificationItem['type'], string> = {
  info: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#3794ff" stroke-width="1.5"/><path d="M8 7V11M8 5V5.5" stroke="#3794ff" stroke-width="1.5" stroke-linecap="round"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1L15 14H1L8 1Z" stroke="#cca700" stroke-width="1.5"/><path d="M8 6V9M8 11V11.5" stroke="#cca700" stroke-width="1.5" stroke-linecap="round"/></svg>',
  error: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#f44747" stroke-width="1.5"/><path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="#f44747" stroke-width="1.5" stroke-linecap="round"/></svg>',
  success: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" stroke="#4ec9b0" stroke-width="1.5"/><path d="M5 8L7 10L11 6" stroke="#4ec9b0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  progress: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#3794ff" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.5"><animateTransform attributeName="transform" type="rotate" values="0 8 8;360 8 8" dur="1s" repeatCount="indefinite"/></circle></svg>',
};

const NotificationToast: React.FC<{
  notification: NotificationItem;
  onDismiss: (id: string) => void;
  onAction?: (notificationId: string, actionLabel: string) => void;
  isExiting: boolean;
}> = ({ notification, onDismiss, onAction, isExiting }) => {
  const timeAgo = useCallback((ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }, []);

  return (
    <div
      style={{
        background: 'var(--bg-secondary, #252526)',
        border: '1px solid var(--border-color, #3c3c3c)',
        borderRadius: 6,
        padding: '10px 12px',
        marginBottom: 6,
        boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease',
        opacity: isExiting ? 0 : 1,
        transform: isExiting ? 'translateX(100%)' : 'translateX(0)',
        maxWidth: 380,
        minWidth: 320,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: notification.message ? 6 : 0 }}>
        <span dangerouslySetInnerHTML={{ __html: NOTIFICATION_ICONS[notification.type] }} />
        <span style={{ flex: 1, fontWeight: 500, fontSize: 13, color: 'var(--text-primary, #ccc)' }}>
          {notification.title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text-secondary, #969696)' }}>
          {timeAgo(notification.timestamp)}
        </span>
        <button
          onClick={() => onDismiss(notification.id)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary, #969696)',
            cursor: 'pointer',
            padding: '0 2px',
            fontSize: 16,
            lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>

      {/* Message */}
      {notification.message && (
        <div style={{ fontSize: 12, color: 'var(--text-secondary, #969696)', marginBottom: 8, lineHeight: 1.4 }}>
          {notification.message}
        </div>
      )}

      {/* Progress Bar */}
      {notification.type === 'progress' && notification.progress != null && (
        <div style={{
          height: 4,
          background: 'var(--bg-tertiary, #2d2d30)',
          borderRadius: 2,
          marginBottom: 8,
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, notification.progress))}%`,
            background: 'var(--accent-color, #007acc)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}

      {/* Source */}
      {notification.source && (
        <div style={{ fontSize: 11, color: 'var(--text-secondary, #969696)', marginBottom: notification.actions ? 6 : 0, opacity: 0.7 }}>
          Source: {notification.source}
        </div>
      )}

      {/* Actions */}
      {notification.actions && notification.actions.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          {notification.actions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                action.onClick();
                if (onAction) onAction(notification.id, action.label);
              }}
              style={{
                padding: '3px 10px',
                borderRadius: 3,
                border: action.primary ? 'none' : '1px solid var(--border-color, #3c3c3c)',
                background: action.primary ? 'var(--accent-color, #007acc)' : 'transparent',
                color: action.primary ? '#fff' : 'var(--text-primary, #ccc)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onDismiss,
  onDismissAll,
  onAction,
  maxVisible = 5,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());
  const panelRef = useRef<HTMLDivElement>(null);

  const visibleNotifications = notifications.slice(-maxVisible);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleDismiss = useCallback((id: string) => {
    setExitingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onDismiss(id);
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  }, [onDismiss]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell Icon / Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary, #969696)',
          cursor: 'pointer',
          position: 'relative',
          padding: '2px 4px',
        }}
        title={`Notifications (${unreadCount} unread)`}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M8 1.5C5.5 1.5 3.5 3.5 3.5 6V9.5L2 12H14L12.5 9.5V6C12.5 3.5 10.5 1.5 8 1.5Z" />
          <path d="M6.5 12V13C6.5 13.83 7.17 14.5 8 14.5C8.83 14.5 9.5 13.83 9.5 13V12" />
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: -2,
            right: -2,
            minWidth: 14,
            height: 14,
            borderRadius: 7,
            background: 'var(--accent-color, #007acc)',
            color: '#fff',
            fontSize: 9,
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 3px',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: 28,
          right: 0,
          width: 400,
          maxHeight: 500,
          background: 'var(--bg-secondary, #252526)',
          border: '1px solid var(--border-color, #3c3c3c)',
          borderRadius: 6,
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          {/* Panel Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border-color, #3c3c3c)',
          }}>
            <span style={{ fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Notifications ({notifications.length})
            </span>
            <button
              onClick={onDismissAll}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-color, #007acc)',
                cursor: 'pointer',
                fontSize: 11,
              }}
            >
              Clear All
            </button>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: 440, overflowY: 'auto', padding: 8 }}>
            {notifications.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 32,
                color: 'var(--text-secondary, #969696)',
                fontSize: 12,
              }}>
                No notifications
              </div>
            ) : (
              [...notifications].reverse().map((n) => (
                <NotificationToast
                  key={n.id}
                  notification={n}
                  onDismiss={handleDismiss}
                  onAction={onAction}
                  isExiting={exitingIds.has(n.id)}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Toast Stack (floating) */}
      <div style={{
        position: 'fixed',
        bottom: 30,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column-reverse',
      }}>
        {!isOpen && visibleNotifications
          .filter((n) => !n.read && Date.now() - n.timestamp < 5000)
          .map((n) => (
            <NotificationToast
              key={n.id}
              notification={n}
              onDismiss={handleDismiss}
              onAction={onAction}
              isExiting={exitingIds.has(n.id)}
            />
          ))}
      </div>
    </div>
  );
};
