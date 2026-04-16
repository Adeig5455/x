import { createUISlice, UISlice } from '../uiSlice';

function createTestSlice() {
  let state: { ui: UISlice };

  const set = (fn: (s: { ui: UISlice }) => Partial<{ ui: UISlice }>) => {
    const partial = fn(state);
    if (partial.ui) {
      state = { ui: { ...state.ui, ...partial.ui } };
    }
  };

  const get = () => state;
  const slice = createUISlice(set, get);
  state = { ui: slice };

  return { getState: () => state.ui };
}

describe('UISlice', () => {
  let store: ReturnType<typeof createTestSlice>;

  beforeEach(() => {
    store = createTestSlice();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('initial state', () => {
    it('should have explorer as active panel', () => {
      expect(store.getState().activePanel).toBe('explorer');
    });

    it('should have sidebar visible', () => {
      expect(store.getState().sidebarVisible).toBe(true);
    });

    it('should have default sidebar width of 260', () => {
      expect(store.getState().sidebarWidth).toBe(260);
    });

    it('should have terminal hidden', () => {
      expect(store.getState().terminalVisible).toBe(false);
    });

    it('should have command palette closed', () => {
      expect(store.getState().commandPaletteOpen).toBe(false);
    });

    it('should not be in zen mode', () => {
      expect(store.getState().zenMode).toBe(false);
    });

    it('should not be in focus mode', () => {
      expect(store.getState().focusMode).toBe(false);
    });
  });

  describe('setActivePanel', () => {
    it('should set active panel and show sidebar', () => {
      store.getState().setActivePanel('search');
      expect(store.getState().activePanel).toBe('search');
      expect(store.getState().sidebarVisible).toBe(true);
    });

    it('should toggle sidebar when clicking same panel', () => {
      expect(store.getState().sidebarVisible).toBe(true);
      store.getState().setActivePanel('explorer'); // same as current
      expect(store.getState().sidebarVisible).toBe(false);
    });

    it('should show sidebar when switching to different panel', () => {
      store.getState().setActivePanel('explorer'); // toggle off
      store.getState().setActivePanel('search'); // different panel
      expect(store.getState().sidebarVisible).toBe(true);
      expect(store.getState().activePanel).toBe('search');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar visibility', () => {
      store.getState().toggleSidebar();
      expect(store.getState().sidebarVisible).toBe(false);
      store.getState().toggleSidebar();
      expect(store.getState().sidebarVisible).toBe(true);
    });
  });

  describe('setSidebarWidth', () => {
    it('should set sidebar width', () => {
      store.getState().setSidebarWidth(300);
      expect(store.getState().sidebarWidth).toBe(300);
    });

    it('should clamp minimum width to 200', () => {
      store.getState().setSidebarWidth(100);
      expect(store.getState().sidebarWidth).toBe(200);
    });

    it('should clamp maximum width to 600', () => {
      store.getState().setSidebarWidth(800);
      expect(store.getState().sidebarWidth).toBe(600);
    });
  });

  describe('toggleTerminal', () => {
    it('should toggle terminal visibility', () => {
      store.getState().toggleTerminal();
      expect(store.getState().terminalVisible).toBe(true);
      store.getState().toggleTerminal();
      expect(store.getState().terminalVisible).toBe(false);
    });
  });

  describe('setTerminalHeight', () => {
    it('should set terminal height', () => {
      store.getState().setTerminalHeight(300);
      expect(store.getState().terminalHeight).toBe(300);
    });

    it('should clamp minimum height to 100', () => {
      store.getState().setTerminalHeight(50);
      expect(store.getState().terminalHeight).toBe(100);
    });

    it('should clamp maximum height to 600', () => {
      store.getState().setTerminalHeight(700);
      expect(store.getState().terminalHeight).toBe(600);
    });
  });

  describe('command palette', () => {
    it('should open command palette in default mode', () => {
      store.getState().openCommandPalette();
      expect(store.getState().commandPaletteOpen).toBe(true);
      expect(store.getState().commandPaletteMode).toBe('commands');
    });

    it('should open command palette in files mode', () => {
      store.getState().openCommandPalette('files');
      expect(store.getState().commandPaletteOpen).toBe(true);
      expect(store.getState().commandPaletteMode).toBe('files');
    });

    it('should open command palette in goto mode', () => {
      store.getState().openCommandPalette('goto');
      expect(store.getState().commandPaletteMode).toBe('goto');
    });

    it('should close command palette', () => {
      store.getState().openCommandPalette();
      store.getState().closeCommandPalette();
      expect(store.getState().commandPaletteOpen).toBe(false);
    });
  });

  describe('breadcrumbs', () => {
    it('should set breadcrumb items', () => {
      const items = [
        { label: 'src', path: '/src', type: 'folder' as const },
        { label: 'index.ts', path: '/src/index.ts', type: 'file' as const },
      ];
      store.getState().setBreadcrumbs(items);
      expect(store.getState().breadcrumbs).toHaveLength(2);
    });
  });

  describe('notifications', () => {
    it('should add a notification', () => {
      store.getState().addNotification('info', 'Test message');
      expect(store.getState().notifications).toHaveLength(1);
      expect(store.getState().notifications[0].type).toBe('info');
      expect(store.getState().notifications[0].message).toBe('Test message');
    });

    it('should add different notification types', () => {
      store.getState().addNotification('info', 'Info');
      store.getState().addNotification('warning', 'Warning');
      store.getState().addNotification('error', 'Error');

      expect(store.getState().notifications).toHaveLength(3);
    });

    it('should remove notification by id', () => {
      store.getState().addNotification('info', 'Test');
      const id = store.getState().notifications[0].id;

      store.getState().removeNotification(id);
      expect(store.getState().notifications).toHaveLength(0);
    });

    it('should clear all notifications', () => {
      store.getState().addNotification('info', 'A');
      store.getState().addNotification('info', 'B');

      store.getState().clearNotifications();
      expect(store.getState().notifications).toHaveLength(0);
    });

    it('should auto-remove notifications after 5 seconds', () => {
      store.getState().addNotification('info', 'Auto remove');
      expect(store.getState().notifications).toHaveLength(1);

      jest.advanceTimersByTime(5000);
      expect(store.getState().notifications).toHaveLength(0);
    });

    it('should limit to 50 notifications', () => {
      for (let i = 0; i < 55; i++) {
        store.getState().addNotification('info', `Notification ${i}`);
      }
      expect(store.getState().notifications.length).toBeLessThanOrEqual(50);
    });
  });

  describe('context menu', () => {
    it('should show context menu', () => {
      const items = [{ label: 'Copy', action: 'copy' }];
      store.getState().showContextMenu(100, 200, items);

      expect(store.getState().contextMenuVisible).toBe(true);
      expect(store.getState().contextMenuPosition).toEqual({ x: 100, y: 200 });
      expect(store.getState().contextMenuItems).toEqual(items);
    });

    it('should hide context menu', () => {
      store.getState().showContextMenu(100, 200, []);
      store.getState().hideContextMenu();
      expect(store.getState().contextMenuVisible).toBe(false);
    });
  });

  describe('zen mode', () => {
    it('should toggle zen mode and hide sidebar/terminal', () => {
      store.getState().toggleZenMode();
      expect(store.getState().zenMode).toBe(true);
      expect(store.getState().terminalVisible).toBe(false);
    });

    it('should restore sidebar when exiting zen mode', () => {
      store.getState().toggleZenMode(); // enter
      store.getState().toggleZenMode(); // exit
      expect(store.getState().zenMode).toBe(false);
      expect(store.getState().sidebarVisible).toBe(true);
    });
  });

  describe('focus mode', () => {
    it('should toggle focus mode', () => {
      store.getState().toggleFocusMode();
      expect(store.getState().focusMode).toBe(true);
      store.getState().toggleFocusMode();
      expect(store.getState().focusMode).toBe(false);
    });
  });
});
