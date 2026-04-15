import type { AppSettings } from '../../shared/types';

const SETTINGS_KEY = 'cursor-ide-settings';

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

export class SettingsService {
  private settings: AppSettings;
  private listeners: Array<(settings: AppSettings) => void> = [];

  constructor() {
    this.settings = this.load();
  }

  private load(): AppSettings {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // Fall through to defaults
    }
    return { ...DEFAULT_SETTINGS };
  }

  save(): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    } catch {
      // Storage may be full or unavailable
    }
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
    this.save();
    this.notifyListeners();
  }

  update(partial: Partial<AppSettings>): void {
    this.settings = { ...this.settings, ...partial };
    this.save();
    this.notifyListeners();
  }

  getAll(): AppSettings {
    return { ...this.settings };
  }

  getDefaults(): AppSettings {
    return { ...DEFAULT_SETTINGS };
  }

  reset(): void {
    this.settings = { ...DEFAULT_SETTINGS };
    this.save();
    this.notifyListeners();
  }

  resetKey<K extends keyof AppSettings>(key: K): void {
    this.settings[key] = DEFAULT_SETTINGS[key];
    this.save();
    this.notifyListeners();
  }

  isModified<K extends keyof AppSettings>(key: K): boolean {
    return this.settings[key] !== DEFAULT_SETTINGS[key];
  }

  getModifiedKeys(): Array<keyof AppSettings> {
    return (Object.keys(this.settings) as Array<keyof AppSettings>).filter(
      (key) => this.isModified(key)
    );
  }

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(json: string): void {
    try {
      const parsed = JSON.parse(json);
      this.settings = { ...DEFAULT_SETTINGS, ...parsed };
      this.save();
      this.notifyListeners();
    } catch {
      throw new Error('Invalid settings JSON');
    }
  }

  onChange(listener: (settings: AppSettings) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.getAll());
    }
  }
}

export const settingsService = new SettingsService();
