import { darkPlusTheme } from './darkPlus';
import { lightPlusTheme } from './lightPlus';
import { monokaiProTheme } from './monokaiPro';
import { solarizedDarkTheme } from './solarizedDark';

export interface ThemeDefinition {
  name: string;
  type: 'dark' | 'light';
  colors: Record<string, string>;
  tokenColors: Array<{
    scope: string | string[];
    settings: { foreground?: string; fontStyle?: string };
  }>;
}

const THEME_STORAGE_KEY = 'cursor-ide-theme';

const builtinThemes: Record<string, ThemeDefinition> = {
  'dark+': darkPlusTheme,
  'light+': lightPlusTheme,
  'monokai-pro': monokaiProTheme,
  'solarized-dark': solarizedDarkTheme,
};

export class ThemeManager {
  private currentThemeId: string;
  private customThemes: Map<string, ThemeDefinition> = new Map();
  private listeners: Array<(themeId: string, theme: ThemeDefinition) => void> = [];

  constructor() {
    this.currentThemeId = this.loadSavedTheme() || 'dark+';
  }

  private loadSavedTheme(): string | null {
    try {
      return localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private saveTheme(themeId: string): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // Storage unavailable
    }
  }

  getTheme(id: string): ThemeDefinition | undefined {
    return builtinThemes[id] || this.customThemes.get(id);
  }

  getCurrentTheme(): ThemeDefinition {
    return this.getTheme(this.currentThemeId) || darkPlusTheme;
  }

  getCurrentThemeId(): string {
    return this.currentThemeId;
  }

  getAvailableThemes(): Array<{ id: string; name: string; type: 'dark' | 'light' }> {
    const themes: Array<{ id: string; name: string; type: 'dark' | 'light' }> = [];

    for (const [id, theme] of Object.entries(builtinThemes)) {
      themes.push({ id, name: theme.name, type: theme.type });
    }

    for (const [id, theme] of this.customThemes.entries()) {
      themes.push({ id, name: theme.name, type: theme.type });
    }

    return themes;
  }

  setTheme(themeId: string): void {
    const theme = this.getTheme(themeId);
    if (!theme) throw new Error(`Theme not found: ${themeId}`);

    this.currentThemeId = themeId;
    this.saveTheme(themeId);
    this.applyTheme(theme);
    this.notifyListeners(themeId, theme);
  }

  registerTheme(id: string, theme: ThemeDefinition): void {
    this.customThemes.set(id, theme);
  }

  unregisterTheme(id: string): void {
    this.customThemes.delete(id);
    if (this.currentThemeId === id) {
      this.setTheme('dark+');
    }
  }

  applyTheme(theme: ThemeDefinition): void {
    const root = document.documentElement;

    // Apply color tokens as CSS custom properties
    for (const [key, value] of Object.entries(theme.colors)) {
      const cssVarName = `--${key.replace(/\./g, '-')}`;
      root.style.setProperty(cssVarName, value);
    }

    // Set theme type attribute for CSS selectors
    root.setAttribute('data-theme', theme.type);
    root.setAttribute('data-theme-name', theme.name);

    // Apply common semantic variables
    root.style.setProperty('--bg-primary', theme.colors['editor.background'] || '#1e1e1e');
    root.style.setProperty('--bg-secondary', theme.colors['sideBar.background'] || '#252526');
    root.style.setProperty('--bg-tertiary', theme.colors['activityBar.background'] || '#333333');
    root.style.setProperty('--text-primary', theme.colors['editor.foreground'] || '#d4d4d4');
    root.style.setProperty('--text-secondary', theme.colors['sideBar.foreground'] || '#cccccc');
    root.style.setProperty('--accent', theme.colors['activityBarBadge.background'] || '#007acc');
    root.style.setProperty('--border', theme.colors['panel.border'] || '#80808059');
    root.style.setProperty('--selection', theme.colors['editor.selectionBackground'] || '#264f78');
    root.style.setProperty('--error', theme.colors['errorForeground'] || '#f48771');
    root.style.setProperty('--success', theme.colors['gitDecoration.addedResourceForeground'] || '#81b88b');
    root.style.setProperty('--warning', theme.colors['gitDecoration.modifiedResourceForeground'] || '#e2c08d');
    root.style.setProperty('--tab-active-bg', theme.colors['tab.activeBackground'] || '#1e1e1e');
    root.style.setProperty('--tab-inactive-bg', theme.colors['tab.inactiveBackground'] || '#2d2d2d');
    root.style.setProperty('--tab-active-border', theme.colors['tab.activeBorderTop'] || '#007acc');
    root.style.setProperty('--statusbar-bg', theme.colors['statusBar.background'] || '#007acc');
    root.style.setProperty('--statusbar-fg', theme.colors['statusBar.foreground'] || '#ffffff');
    root.style.setProperty('--input-bg', theme.colors['input.background'] || '#3c3c3c');
    root.style.setProperty('--input-fg', theme.colors['input.foreground'] || '#cccccc');
    root.style.setProperty('--input-border', theme.colors['input.border'] || '#3c3c3c');
    root.style.setProperty('--button-bg', theme.colors['button.background'] || '#0e639c');
    root.style.setProperty('--button-fg', theme.colors['button.foreground'] || '#ffffff');
    root.style.setProperty('--list-hover-bg', theme.colors['list.hoverBackground'] || '#2a2d2e');
    root.style.setProperty('--list-active-bg', theme.colors['list.activeSelectionBackground'] || '#04395e');
    root.style.setProperty('--list-active-fg', theme.colors['list.activeSelectionForeground'] || '#ffffff');
  }

  getMonacoTheme(): {
    base: 'vs' | 'vs-dark';
    inherit: boolean;
    rules: Array<{ token: string; foreground?: string; fontStyle?: string }>;
    colors: Record<string, string>;
  } {
    const theme = this.getCurrentTheme();
    const rules: Array<{ token: string; foreground?: string; fontStyle?: string }> = [];

    for (const tokenColor of theme.tokenColors) {
      const scopes = Array.isArray(tokenColor.scope) ? tokenColor.scope : [tokenColor.scope];
      for (const scope of scopes) {
        rules.push({
          token: scope,
          foreground: tokenColor.settings.foreground?.replace('#', ''),
          fontStyle: tokenColor.settings.fontStyle,
        });
      }
    }

    return {
      base: theme.type === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules,
      colors: theme.colors,
    };
  }

  detectSystemTheme(): 'dark' | 'light' {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }

  followSystemTheme(): () => void {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {};

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      const themeId = e.matches ? 'dark+' : 'light+';
      this.setTheme(themeId);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }

  onChange(listener: (themeId: string, theme: ThemeDefinition) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(themeId: string, theme: ThemeDefinition): void {
    for (const listener of this.listeners) {
      listener(themeId, theme);
    }
  }

  initialize(): void {
    const theme = this.getCurrentTheme();
    this.applyTheme(theme);
  }
}

export const themeManager = new ThemeManager();
