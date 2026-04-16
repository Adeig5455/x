import { createSettingsSlice, SettingsSlice } from '../settingsSlice';

function createTestSlice() {
  let state: { settings: SettingsSlice };

  const set = (fn: (s: { settings: SettingsSlice }) => Partial<{ settings: SettingsSlice }>) => {
    const partial = fn(state);
    if (partial.settings) {
      state = { settings: { ...state.settings, ...partial.settings } };
    }
  };

  const get = () => state;
  const slice = createSettingsSlice(set, get);
  state = { settings: slice };

  return { getState: () => state.settings };
}

describe('SettingsSlice', () => {
  let store: ReturnType<typeof createTestSlice>;

  beforeEach(() => {
    store = createTestSlice();
  });

  describe('initial state', () => {
    it('should have default settings', () => {
      const s = store.getState();
      expect(s.settings).toBeDefined();
      expect(s.settings.fontSize).toBe(14);
      expect(s.settings.tabSize).toBe(2);
      expect(s.settings.wordWrap).toBe(false);
      expect(s.settings.minimap).toBe(true);
      expect(s.settings.breadcrumbs).toBe(true);
      expect(s.settings.autoComplete).toBe(true);
    });

    it('should have default font family', () => {
      expect(store.getState().settings.fontFamily).toContain('Consolas');
    });

    it('should have settings panel closed', () => {
      expect(store.getState().settingsPanelOpen).toBe(false);
    });

    it('should have editor as default category', () => {
      expect(store.getState().activeSettingsCategory).toBe('editor');
    });
  });

  describe('setSetting', () => {
    it('should set a single setting by key', () => {
      store.getState().setSetting('fontSize', 16);
      expect(store.getState().settings.fontSize).toBe(16);
    });

    it('should preserve other settings', () => {
      store.getState().setSetting('fontSize', 20);
      expect(store.getState().settings.minimap).toBe(true);
      expect(store.getState().settings.tabSize).toBe(2);
    });
  });

  describe('setSettings', () => {
    it('should update multiple settings at once', () => {
      store.getState().setSettings({ fontSize: 18, tabSize: 4 });
      const s = store.getState().settings;
      expect(s.fontSize).toBe(18);
      expect(s.tabSize).toBe(4);
    });

    it('should preserve non-updated settings', () => {
      store.getState().setSettings({ fontSize: 20 });
      expect(store.getState().settings.minimap).toBe(true);
    });
  });

  describe('resetSettings', () => {
    it('should reset to default settings', () => {
      store.getState().setSettings({ fontSize: 20, tabSize: 4 });
      store.getState().resetSettings();
      expect(store.getState().settings.fontSize).toBe(14);
      expect(store.getState().settings.tabSize).toBe(2);
    });
  });

  describe('toggleSettingsPanel', () => {
    it('should toggle panel open/closed', () => {
      store.getState().toggleSettingsPanel();
      expect(store.getState().settingsPanelOpen).toBe(true);
      store.getState().toggleSettingsPanel();
      expect(store.getState().settingsPanelOpen).toBe(false);
    });
  });

  describe('setSettingsSearchQuery', () => {
    it('should set search query', () => {
      store.getState().setSettingsSearchQuery('font');
      expect(store.getState().settingsSearchQuery).toBe('font');
    });
  });

  describe('setActiveSettingsCategory', () => {
    it('should set active category', () => {
      store.getState().setActiveSettingsCategory('terminal');
      expect(store.getState().activeSettingsCategory).toBe('terminal');
    });
  });
});
