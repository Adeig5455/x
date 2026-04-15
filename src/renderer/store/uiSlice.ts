import type { Notification, BreadcrumbItem } from '../../shared/types';
import { generateId } from '../../shared/utils';

export interface UIState {
  activePanel: string;
  sidebarVisible: boolean;
  sidebarWidth: number;
  terminalVisible: boolean;
  terminalHeight: number;
  commandPaletteOpen: boolean;
  commandPaletteMode: 'commands' | 'files' | 'goto';
  breadcrumbs: BreadcrumbItem[];
  notifications: Notification[];
  contextMenuVisible: boolean;
  contextMenuPosition: { x: number; y: number };
  contextMenuItems: Array<{ label: string; action: string; shortcut?: string; disabled?: boolean; separator?: boolean }>;
  zenMode: boolean;
  focusMode: boolean;
}

export interface UISlice extends UIState {
  setActivePanel: (panel: string) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;
  openCommandPalette: (mode?: 'commands' | 'files' | 'goto') => void;
  closeCommandPalette: () => void;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  addNotification: (type: 'info' | 'warning' | 'error' | 'success', message: string) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  showContextMenu: (x: number, y: number, items: UIState['contextMenuItems']) => void;
  hideContextMenu: () => void;
  toggleZenMode: () => void;
  toggleFocusMode: () => void;
}

export const createUISlice = (
  set: (fn: (state: { ui: UISlice }) => Partial<{ ui: UISlice }>) => void,
  _get: () => { ui: UISlice }
): UISlice => ({
  activePanel: 'explorer',
  sidebarVisible: true,
  sidebarWidth: 260,
  terminalVisible: false,
  terminalHeight: 250,
  commandPaletteOpen: false,
  commandPaletteMode: 'commands',
  breadcrumbs: [],
  notifications: [],
  contextMenuVisible: false,
  contextMenuPosition: { x: 0, y: 0 },
  contextMenuItems: [],
  zenMode: false,
  focusMode: false,

  setActivePanel: (panel) => {
    set((state) => {
      // Toggle sidebar if clicking same panel
      if (state.ui.activePanel === panel && state.ui.sidebarVisible) {
        return { ui: { ...state.ui, sidebarVisible: false } };
      }
      return { ui: { ...state.ui, activePanel: panel, sidebarVisible: true } };
    });
  },

  toggleSidebar: () => {
    set((state) => ({
      ui: { ...state.ui, sidebarVisible: !state.ui.sidebarVisible },
    }));
  },

  setSidebarWidth: (width) => {
    const clampedWidth = Math.max(200, Math.min(600, width));
    set((state) => ({
      ui: { ...state.ui, sidebarWidth: clampedWidth },
    }));
  },

  toggleTerminal: () => {
    set((state) => ({
      ui: { ...state.ui, terminalVisible: !state.ui.terminalVisible },
    }));
  },

  setTerminalHeight: (height) => {
    const clampedHeight = Math.max(100, Math.min(600, height));
    set((state) => ({
      ui: { ...state.ui, terminalHeight: clampedHeight },
    }));
  },

  openCommandPalette: (mode = 'commands') => {
    set((state) => ({
      ui: { ...state.ui, commandPaletteOpen: true, commandPaletteMode: mode },
    }));
  },

  closeCommandPalette: () => {
    set((state) => ({
      ui: { ...state.ui, commandPaletteOpen: false },
    }));
  },

  setBreadcrumbs: (items) => {
    set((state) => ({
      ui: { ...state.ui, breadcrumbs: items },
    }));
  },

  addNotification: (type, message) => {
    const notification: Notification = {
      id: generateId(),
      type,
      message,
      timestamp: Date.now(),
    };

    set((state) => ({
      ui: {
        ...state.ui,
        notifications: [...state.ui.notifications, notification].slice(-50),
      },
    }));

    // Auto-remove after 5 seconds
    setTimeout(() => {
      set((state) => ({
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter((n) => n.id !== notification.id),
        },
      }));
    }, 5000);
  },

  removeNotification: (id) => {
    set((state) => ({
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter((n) => n.id !== id),
      },
    }));
  },

  clearNotifications: () => {
    set((state) => ({
      ui: { ...state.ui, notifications: [] },
    }));
  },

  showContextMenu: (x, y, items) => {
    set((state) => ({
      ui: {
        ...state.ui,
        contextMenuVisible: true,
        contextMenuPosition: { x, y },
        contextMenuItems: items,
      },
    }));
  },

  hideContextMenu: () => {
    set((state) => ({
      ui: { ...state.ui, contextMenuVisible: false },
    }));
  },

  toggleZenMode: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        zenMode: !state.ui.zenMode,
        sidebarVisible: state.ui.zenMode,
        terminalVisible: false,
      },
    }));
  },

  toggleFocusMode: () => {
    set((state) => ({
      ui: { ...state.ui, focusMode: !state.ui.focusMode },
    }));
  },
});
