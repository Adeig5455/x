import type { AppSettings } from '../../shared/types';

export interface SettingsState {
  settings: AppSettings;
  settingsPanelOpen: boolean;
  settingsSearchQuery: string;
  activeSettingsCategory: string;
}

export interface SettingsSlice extends SettingsState {
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
  resetSettings: () => void;
  toggleSettingsPanel: () => void;
  setSettingsSearchQuery: (query: string) => void;
  setActiveSettingsCategory: (category: string) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  fontSize: 14,
  fontFamily: "'Fira Code', 'Cascadia Code', Consolas, monospace",
  tabSize: 2,
  wordWrap: false,
  minimap: true,
  breadcrumbs: true,
  aiModel: 'gpt-4',
  aiApiKey: '',
  autoComplete: true,
  terminalFontSize: 13,
};

export const createSettingsSlice = (
  set: (fn: (state: { settings: SettingsSlice }) => Partial<{ settings: SettingsSlice }>) => void,
  _get: () => { settings: SettingsSlice }
): SettingsSlice => ({
  settings: { ...DEFAULT_SETTINGS },
  settingsPanelOpen: false,
  settingsSearchQuery: '',
  activeSettingsCategory: 'editor',

  setSetting: (key, value) => {
    set((state) => ({
      settings: {
        ...state.settings,
        settings: { ...state.settings.settings, [key]: value },
      },
    }));
  },

  setSettings: (partial) => {
    set((state) => ({
      settings: {
        ...state.settings,
        settings: { ...state.settings.settings, ...partial },
      },
    }));
  },

  resetSettings: () => {
    set((state) => ({
      settings: { ...state.settings, settings: { ...DEFAULT_SETTINGS } },
    }));
  },

  toggleSettingsPanel: () => {
    set((state) => ({
      settings: { ...state.settings, settingsPanelOpen: !state.settings.settingsPanelOpen },
    }));
  },

  setSettingsSearchQuery: (query) => {
    set((state) => ({
      settings: { ...state.settings, settingsSearchQuery: query },
    }));
  },

  setActiveSettingsCategory: (category) => {
    set((state) => ({
      settings: { ...state.settings, activeSettingsCategory: category },
    }));
  },
});
