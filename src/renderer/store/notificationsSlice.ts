// ============================================================================
// Notifications Store Slice - Advanced notification management with
// toast history, action buttons, progress tracking, and grouping
// ============================================================================

import { generateId } from '../../shared/utils';

export type NotificationSeverity = 'info' | 'warning' | 'error' | 'success';
export type NotificationSource = 'system' | 'extension' | 'git' | 'build' | 'ai' | 'debug';

export interface NotificationAction {
  id: string;
  label: string;
  isPrimary?: boolean;
}

export interface NotificationProgress {
  current: number;
  total: number;
  message?: string;
}

export interface AppNotification {
  id: string;
  severity: NotificationSeverity;
  source: NotificationSource;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  pinned: boolean;
  actions: NotificationAction[];
  progress?: NotificationProgress;
  autoHideMs?: number;
  groupId?: string;
}

export interface NotificationGroup {
  id: string;
  label: string;
  count: number;
  collapsed: boolean;
}

export interface NotificationsState {
  notifications: AppNotification[];
  groups: NotificationGroup[];
  centerOpen: boolean;
  doNotDisturb: boolean;
  maxHistory: number;
  filterSeverity: NotificationSeverity | 'all';
  filterSource: NotificationSource | 'all';
}

export interface NotificationsSlice extends NotificationsState {
  addNotification: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => string;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  pinNotification: (id: string) => void;
  unpinNotification: (id: string) => void;
  clearAll: () => void;
  clearRead: () => void;
  toggleCenter: () => void;
  setDoNotDisturb: (enabled: boolean) => void;
  setFilterSeverity: (filter: NotificationSeverity | 'all') => void;
  setFilterSource: (filter: NotificationSource | 'all') => void;
  updateProgress: (id: string, progress: NotificationProgress) => void;
  toggleGroupCollapse: (groupId: string) => void;
}

export const createNotificationsSlice = (
  set: (fn: (state: { notifications: NotificationsSlice }) => Partial<{ notifications: NotificationsSlice }>) => void,
  _get: () => { notifications: NotificationsSlice }
): NotificationsSlice => ({
  notifications: [],
  groups: [],
  centerOpen: false,
  doNotDisturb: false,
  maxHistory: 200,
  filterSeverity: 'all',
  filterSource: 'all',

  addNotification: (notification) => {
    const id = generateId();
    const newNotification: AppNotification = {
      ...notification,
      id,
      timestamp: Date.now(),
      read: false,
    };

    set((state) => {
      const updated = [newNotification, ...state.notifications.notifications]
        .slice(0, state.notifications.maxHistory);

      // Update group counts
      const groupId = notification.groupId;
      let groups = [...state.notifications.groups];
      if (groupId) {
        const existingGroup = groups.find((g) => g.id === groupId);
        if (existingGroup) {
          groups = groups.map((g) =>
            g.id === groupId ? { ...g, count: g.count + 1 } : g
          );
        } else {
          groups.push({ id: groupId, label: groupId, count: 1, collapsed: false });
        }
      }

      return {
        notifications: {
          ...state.notifications,
          notifications: updated,
          groups,
        },
      };
    });

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        notifications: state.notifications.notifications.filter((n) => n.id !== id),
      },
    }));
  },

  markAsRead: (id) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        notifications: state.notifications.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
      },
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        notifications: state.notifications.notifications.map((n) => ({ ...n, read: true })),
      },
    }));
  },

  pinNotification: (id) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        notifications: state.notifications.notifications.map((n) =>
          n.id === id ? { ...n, pinned: true } : n
        ),
      },
    }));
  },

  unpinNotification: (id) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        notifications: state.notifications.notifications.map((n) =>
          n.id === id ? { ...n, pinned: false } : n
        ),
      },
    }));
  },

  clearAll: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        notifications: state.notifications.notifications.filter((n) => n.pinned),
        groups: [],
      },
    }));
  },

  clearRead: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        notifications: state.notifications.notifications.filter((n) => !n.read || n.pinned),
      },
    }));
  },

  toggleCenter: () => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        centerOpen: !state.notifications.centerOpen,
      },
    }));
  },

  setDoNotDisturb: (enabled) => {
    set((state) => ({
      notifications: { ...state.notifications, doNotDisturb: enabled },
    }));
  },

  setFilterSeverity: (filter) => {
    set((state) => ({
      notifications: { ...state.notifications, filterSeverity: filter },
    }));
  },

  setFilterSource: (filter) => {
    set((state) => ({
      notifications: { ...state.notifications, filterSource: filter },
    }));
  },

  updateProgress: (id, progress) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        notifications: state.notifications.notifications.map((n) =>
          n.id === id ? { ...n, progress } : n
        ),
      },
    }));
  },

  toggleGroupCollapse: (groupId) => {
    set((state) => ({
      notifications: {
        ...state.notifications,
        groups: state.notifications.groups.map((g) =>
          g.id === groupId ? { ...g, collapsed: !g.collapsed } : g
        ),
      },
    }));
  },
});
