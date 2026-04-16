import { createNotificationsSlice, NotificationsSlice } from '../notificationsSlice';

function createTestSlice(): NotificationsSlice {
  let state: { notifications: NotificationsSlice };
  const set = (fn: (s: { notifications: NotificationsSlice }) => Partial<{ notifications: NotificationsSlice }>) => {
    const result = fn(state);
    if (result.notifications) {
      state = { notifications: { ...state.notifications, ...result.notifications } };
    }
  };
  const get = () => state;
  const slice = createNotificationsSlice(set, get);
  state = { notifications: slice };
  return state.notifications;
}

function getState(slice: NotificationsSlice): NotificationsSlice {
  // The slice mutates via set, so we need to re-read
  return slice;
}

describe('notificationsSlice', () => {
  let slice: NotificationsSlice;
  let state: { notifications: NotificationsSlice };

  beforeEach(() => {
    state = { notifications: null as unknown as NotificationsSlice };
    const set = (fn: (s: { notifications: NotificationsSlice }) => Partial<{ notifications: NotificationsSlice }>) => {
      const result = fn(state);
      if (result.notifications) {
        state = { notifications: { ...state.notifications, ...result.notifications } };
      }
    };
    const get = () => state;
    slice = createNotificationsSlice(set, get);
    state = { notifications: slice };
  });

  it('should have correct initial state', () => {
    expect(state.notifications.notifications).toEqual([]);
    expect(state.notifications.centerOpen).toBe(false);
    expect(state.notifications.doNotDisturb).toBe(false);
    expect(state.notifications.maxHistory).toBe(200);
    expect(state.notifications.filterSeverity).toBe('all');
  });

  it('should add a notification', () => {
    const id = state.notifications.addNotification({
      severity: 'info',
      source: 'system',
      title: 'Test',
      message: 'Hello',
      pinned: false,
      actions: [],
    });
    expect(id).toBeTruthy();
    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0].title).toBe('Test');
    expect(state.notifications.notifications[0].read).toBe(false);
  });

  it('should remove a notification', () => {
    const id = state.notifications.addNotification({
      severity: 'error',
      source: 'build',
      title: 'Error',
      message: 'Build failed',
      pinned: false,
      actions: [],
    });
    expect(state.notifications.notifications).toHaveLength(1);
    state.notifications.removeNotification(id);
    expect(state.notifications.notifications).toHaveLength(0);
  });

  it('should mark notification as read', () => {
    const id = state.notifications.addNotification({
      severity: 'info',
      source: 'system',
      title: 'Test',
      message: 'Hello',
      pinned: false,
      actions: [],
    });
    expect(state.notifications.notifications[0].read).toBe(false);
    state.notifications.markAsRead(id);
    expect(state.notifications.notifications[0].read).toBe(true);
  });

  it('should mark all as read', () => {
    state.notifications.addNotification({ severity: 'info', source: 'system', title: 'A', message: 'a', pinned: false, actions: [] });
    state.notifications.addNotification({ severity: 'warning', source: 'git', title: 'B', message: 'b', pinned: false, actions: [] });
    state.notifications.markAllAsRead();
    expect(state.notifications.notifications.every((n) => n.read)).toBe(true);
  });

  it('should pin and unpin notifications', () => {
    const id = state.notifications.addNotification({ severity: 'info', source: 'system', title: 'Pin', message: 'me', pinned: false, actions: [] });
    state.notifications.pinNotification(id);
    expect(state.notifications.notifications[0].pinned).toBe(true);
    state.notifications.unpinNotification(id);
    expect(state.notifications.notifications[0].pinned).toBe(false);
  });

  it('should clear all non-pinned notifications', () => {
    const id = state.notifications.addNotification({ severity: 'info', source: 'system', title: 'Pinned', message: 'keep', pinned: false, actions: [] });
    state.notifications.addNotification({ severity: 'error', source: 'build', title: 'Gone', message: 'bye', pinned: false, actions: [] });
    state.notifications.pinNotification(id);
    state.notifications.clearAll();
    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0].title).toBe('Pinned');
  });

  it('should clear read notifications', () => {
    const id = state.notifications.addNotification({ severity: 'info', source: 'system', title: 'Read', message: 'r', pinned: false, actions: [] });
    state.notifications.addNotification({ severity: 'info', source: 'system', title: 'Unread', message: 'u', pinned: false, actions: [] });
    state.notifications.markAsRead(id);
    state.notifications.clearRead();
    expect(state.notifications.notifications).toHaveLength(1);
    expect(state.notifications.notifications[0].title).toBe('Unread');
  });

  it('should toggle notification center', () => {
    expect(state.notifications.centerOpen).toBe(false);
    state.notifications.toggleCenter();
    expect(state.notifications.centerOpen).toBe(true);
    state.notifications.toggleCenter();
    expect(state.notifications.centerOpen).toBe(false);
  });

  it('should set do not disturb', () => {
    state.notifications.setDoNotDisturb(true);
    expect(state.notifications.doNotDisturb).toBe(true);
    state.notifications.setDoNotDisturb(false);
    expect(state.notifications.doNotDisturb).toBe(false);
  });

  it('should filter by severity and source', () => {
    state.notifications.setFilterSeverity('error');
    expect(state.notifications.filterSeverity).toBe('error');
    state.notifications.setFilterSource('git');
    expect(state.notifications.filterSource).toBe('git');
  });

  it('should update progress', () => {
    const id = state.notifications.addNotification({ severity: 'info', source: 'build', title: 'Build', message: 'building', pinned: false, actions: [] });
    state.notifications.updateProgress(id, { current: 50, total: 100, message: '50%' });
    expect(state.notifications.notifications[0].progress).toEqual({ current: 50, total: 100, message: '50%' });
  });

  it('should handle group collapse', () => {
    state.notifications.addNotification({ severity: 'info', source: 'system', title: 'G', message: 'g', pinned: false, actions: [], groupId: 'build-errors' });
    expect(state.notifications.groups).toHaveLength(1);
    state.notifications.toggleGroupCollapse('build-errors');
    expect(state.notifications.groups[0].collapsed).toBe(true);
  });
});
