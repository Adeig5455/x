import { ThemeManager } from '../themeManager';
import type { ThemeDefinition } from '../themeManager';

// Spy on document.documentElement methods
let setPropertySpy: jest.SpyInstance;
let setAttributeSpy: jest.SpyInstance;

describe('ThemeManager', () => {
  let manager: ThemeManager;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    setPropertySpy = jest.spyOn(document.documentElement.style, 'setProperty');
    setAttributeSpy = jest.spyOn(document.documentElement, 'setAttribute');
    manager = new ThemeManager();
  });

  afterEach(() => {
    setPropertySpy.mockRestore();
    setAttributeSpy.mockRestore();
  });

  describe('constructor', () => {
    it('should default to dark+ theme', () => {
      expect(manager.getCurrentThemeId()).toBe('dark+');
    });

    it('should load saved theme from localStorage', () => {
      localStorage.setItem('cursor-ide-theme', 'light+');
      const m = new ThemeManager();
      expect(m.getCurrentThemeId()).toBe('light+');
    });
  });

  describe('getAvailableThemes', () => {
    it('should list 4 built-in themes', () => {
      const themes = manager.getAvailableThemes();
      expect(themes.length).toBeGreaterThanOrEqual(4);

      const ids = themes.map((t) => t.id);
      expect(ids).toContain('dark+');
      expect(ids).toContain('light+');
      expect(ids).toContain('monokai-pro');
      expect(ids).toContain('solarized-dark');
    });

    it('should include theme type information', () => {
      const themes = manager.getAvailableThemes();
      const darkPlus = themes.find((t) => t.id === 'dark+');
      expect(darkPlus!.type).toBe('dark');

      const lightPlus = themes.find((t) => t.id === 'light+');
      expect(lightPlus!.type).toBe('light');
    });
  });

  describe('getTheme', () => {
    it('should return built-in theme by id', () => {
      const theme = manager.getTheme('dark+');
      expect(theme).toBeDefined();
      expect(theme!.name).toBeTruthy();
      expect(theme!.colors).toBeDefined();
      expect(theme!.tokenColors).toBeDefined();
    });

    it('should return undefined for unknown theme', () => {
      expect(manager.getTheme('nonexistent')).toBeUndefined();
    });
  });

  describe('getCurrentTheme', () => {
    it('should return the current theme definition', () => {
      const theme = manager.getCurrentTheme();
      expect(theme).toBeDefined();
      expect(theme.type).toBe('dark');
    });

    it('should fallback to dark+ if current theme is invalid', () => {
      localStorage.setItem('cursor-ide-theme', 'invalid-theme');
      const m = new ThemeManager();
      const theme = m.getCurrentTheme();
      expect(theme).toBeDefined();
      expect(theme.type).toBe('dark');
    });
  });

  describe('setTheme', () => {
    it('should change the current theme', () => {
      manager.setTheme('light+');
      expect(manager.getCurrentThemeId()).toBe('light+');
    });

    it('should save to localStorage', () => {
      manager.setTheme('monokai-pro');
      expect(localStorage.getItem('cursor-ide-theme')).toBe('monokai-pro');
    });

    it('should apply CSS custom properties', () => {
      manager.setTheme('dark+');
      expect(setPropertySpy).toHaveBeenCalled();
    });

    it('should set theme type attribute', () => {
      manager.setTheme('dark+');
      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark');
    });

    it('should throw for unknown theme', () => {
      expect(() => manager.setTheme('nonexistent')).toThrow('Theme not found: nonexistent');
    });

    it('should notify listeners', () => {
      const listener = jest.fn();
      manager.onChange(listener);
      manager.setTheme('light+');
      expect(listener).toHaveBeenCalledWith('light+', expect.any(Object));
    });
  });

  describe('registerTheme / unregisterTheme', () => {
    const customTheme: ThemeDefinition = {
      name: 'My Custom Theme',
      type: 'dark',
      colors: { 'editor.background': '#000000' },
      tokenColors: [],
    };

    it('should register a custom theme', () => {
      manager.registerTheme('my-theme', customTheme);
      expect(manager.getTheme('my-theme')).toBe(customTheme);
    });

    it('should include custom themes in available list', () => {
      manager.registerTheme('my-theme', customTheme);
      const themes = manager.getAvailableThemes();
      const custom = themes.find((t) => t.id === 'my-theme');
      expect(custom).toBeDefined();
      expect(custom!.name).toBe('My Custom Theme');
    });

    it('should unregister a custom theme', () => {
      manager.registerTheme('my-theme', customTheme);
      manager.unregisterTheme('my-theme');
      expect(manager.getTheme('my-theme')).toBeUndefined();
    });

    it('should switch to dark+ when unregistering active theme', () => {
      manager.registerTheme('my-theme', customTheme);
      manager.setTheme('my-theme');
      manager.unregisterTheme('my-theme');
      expect(manager.getCurrentThemeId()).toBe('dark+');
    });
  });

  describe('applyTheme', () => {
    it('should apply semantic CSS variables', () => {
      setPropertySpy.mockClear();
      const theme = manager.getCurrentTheme();
      manager.applyTheme(theme);

      expect(setPropertySpy).toHaveBeenCalledWith('--bg-primary', expect.any(String));
      expect(setPropertySpy).toHaveBeenCalledWith('--text-primary', expect.any(String));
      expect(setPropertySpy).toHaveBeenCalledWith('--accent', expect.any(String));
      expect(setPropertySpy).toHaveBeenCalledWith('--border', expect.any(String));
    });

    it('should apply color tokens as CSS custom properties', () => {
      setPropertySpy.mockClear();
      const theme = manager.getCurrentTheme();
      manager.applyTheme(theme);

      // Should have many CSS properties set
      expect(setPropertySpy.mock.calls.length).toBeGreaterThan(20);
    });
  });

  describe('getMonacoTheme', () => {
    it('should return Monaco-compatible theme config', () => {
      const monacoTheme = manager.getMonacoTheme();
      expect(monacoTheme.base).toBe('vs-dark');
      expect(monacoTheme.inherit).toBe(true);
      expect(Array.isArray(monacoTheme.rules)).toBe(true);
      expect(typeof monacoTheme.colors).toBe('object');
    });

    it('should use vs base for light themes', () => {
      manager.setTheme('light+');
      const monacoTheme = manager.getMonacoTheme();
      expect(monacoTheme.base).toBe('vs');
    });

    it('should convert token colors to rules', () => {
      const monacoTheme = manager.getMonacoTheme();
      expect(monacoTheme.rules.length).toBeGreaterThan(0);
    });

    it('should strip # from foreground colors', () => {
      const monacoTheme = manager.getMonacoTheme();
      const ruleWithColor = monacoTheme.rules.find((r) => r.foreground);
      if (ruleWithColor) {
        expect(ruleWithColor.foreground).not.toContain('#');
      }
    });
  });

  describe('detectSystemTheme', () => {
    it('should return dark by default when matchMedia unavailable', () => {
      const origWindow = global.window;
      // @ts-expect-error - testing without window
      global.window = undefined;
      expect(manager.detectSystemTheme()).toBe('dark');
      global.window = origWindow;
    });
  });

  describe('onChange', () => {
    it('should register and call listener', () => {
      const listener = jest.fn();
      manager.onChange(listener);
      manager.setTheme('monokai-pro');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should return unsubscribe function', () => {
      const listener = jest.fn();
      const unsub = manager.onChange(listener);
      unsub();
      manager.setTheme('solarized-dark');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      manager.onChange(listener1);
      manager.onChange(listener2);
      manager.setTheme('light+');
      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('initialize', () => {
    it('should apply the current theme', () => {
      setPropertySpy.mockClear();
      manager.initialize();
      expect(setPropertySpy).toHaveBeenCalled();
    });
  });
});
