import { SettingsService } from '../settingsService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    service = new SettingsService();
  });

  it('loads default settings when nothing stored', () => {
    const settings = service.getAll();
    expect(settings.theme).toBe('dark');
    expect(settings.fontSize).toBe(14);
    expect(settings.tabSize).toBe(2);
  });

  it('gets individual settings', () => {
    expect(service.get('theme')).toBe('dark');
    expect(service.get('fontSize')).toBe(14);
  });

  it('sets individual settings and saves', () => {
    service.set('fontSize', 16);
    expect(service.get('fontSize')).toBe(16);
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('updates multiple settings at once', () => {
    service.update({ fontSize: 18, theme: 'light' });
    expect(service.get('fontSize')).toBe(18);
    expect(service.get('theme')).toBe('light');
  });

  it('resets to defaults', () => {
    service.set('fontSize', 20);
    service.reset();
    expect(service.get('fontSize')).toBe(14);
  });

  it('resets individual key', () => {
    service.set('fontSize', 20);
    service.set('theme', 'light');
    service.resetKey('fontSize');
    expect(service.get('fontSize')).toBe(14);
    expect(service.get('theme')).toBe('light');
  });

  it('detects modified settings', () => {
    expect(service.isModified('fontSize')).toBe(false);
    service.set('fontSize', 20);
    expect(service.isModified('fontSize')).toBe(true);
  });

  it('lists modified keys', () => {
    service.set('fontSize', 20);
    service.set('theme', 'light');
    const modified = service.getModifiedKeys();
    expect(modified).toContain('fontSize');
    expect(modified).toContain('theme');
  });

  it('exports settings as JSON', () => {
    const json = service.exportSettings();
    const parsed = JSON.parse(json);
    expect(parsed.theme).toBe('dark');
  });

  it('imports settings from JSON', () => {
    service.importSettings('{"fontSize": 20, "theme": "light"}');
    expect(service.get('fontSize')).toBe(20);
    expect(service.get('theme')).toBe('light');
  });

  it('throws on invalid JSON import', () => {
    expect(() => service.importSettings('invalid json')).toThrow('Invalid settings JSON');
  });

  it('notifies listeners on change', () => {
    const listener = jest.fn();
    service.onChange(listener);
    service.set('fontSize', 20);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ fontSize: 20 }));
  });

  it('unsubscribes listeners', () => {
    const listener = jest.fn();
    const unsubscribe = service.onChange(listener);
    unsubscribe();
    service.set('fontSize', 20);
    expect(listener).not.toHaveBeenCalled();
  });
});
