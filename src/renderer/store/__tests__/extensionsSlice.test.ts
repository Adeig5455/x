import { createExtensionsSlice, ExtensionsSlice } from '../extensionsSlice';

describe('extensionsSlice', () => {
  let state: { extensions: ExtensionsSlice };

  beforeEach(() => {
    state = { extensions: null as unknown as ExtensionsSlice };
    const set = (fn: (s: { extensions: ExtensionsSlice }) => Partial<{ extensions: ExtensionsSlice }>) => {
      const result = fn(state);
      if (result.extensions) {
        state = { extensions: { ...state.extensions, ...result.extensions } };
      }
    };
    const get = () => state;
    const slice = createExtensionsSlice(set, get);
    state = { extensions: slice };
  });

  it('should have correct initial state with builtin extensions', () => {
    expect(state.extensions.installed).toHaveLength(2);
    expect(state.extensions.installed[0].isBuiltin).toBe(true);
    expect(state.extensions.searchQuery).toBe('');
    expect(state.extensions.autoUpdateEnabled).toBe(true);
  });

  it('should install an extension', () => {
    state.extensions.installExtension({
      id: 'test.ext',
      name: 'test-ext',
      displayName: 'Test Extension',
      publisher: 'Test',
      version: '1.0.0',
      description: 'A test extension',
      rating: 4.5,
      ratingCount: 100,
      downloadCount: 1000,
      categories: ['Testing'],
      tags: ['test'],
      dependencies: [],
      isBuiltin: false,
      lastUpdated: Date.now(),
    });
    expect(state.extensions.installed).toHaveLength(3);
    expect(state.extensions.installed[2].name).toBe('test-ext');
  });

  it('should uninstall a non-builtin extension', () => {
    state.extensions.installExtension({
      id: 'removable',
      name: 'removable',
      displayName: 'Removable',
      publisher: 'Test',
      version: '1.0.0',
      description: 'Remove me',
      rating: 3.0,
      ratingCount: 10,
      downloadCount: 50,
      categories: [],
      tags: [],
      dependencies: [],
      isBuiltin: false,
      lastUpdated: Date.now(),
    });
    expect(state.extensions.installed).toHaveLength(3);
    state.extensions.uninstallExtension('removable');
    expect(state.extensions.installed).toHaveLength(2);
  });

  it('should enable and disable extensions', () => {
    state.extensions.installExtension({
      id: 'toggle-ext',
      name: 'toggle',
      displayName: 'Toggle',
      publisher: 'Test',
      version: '1.0.0',
      description: 'Toggle me',
      rating: 4.0,
      ratingCount: 50,
      downloadCount: 500,
      categories: [],
      tags: [],
      dependencies: [],
      isBuiltin: false,
      lastUpdated: Date.now(),
    });
    state.extensions.disableExtension('toggle-ext');
    expect(state.extensions.installed.find((e) => e.id === 'toggle-ext')?.status).toBe('disabled');
    state.extensions.enableExtension('toggle-ext');
    expect(state.extensions.installed.find((e) => e.id === 'toggle-ext')?.status).toBe('installed');
  });

  it('should not disable builtin extensions', () => {
    state.extensions.disableExtension('cursor.ai-assistant');
    expect(state.extensions.installed.find((e) => e.id === 'cursor.ai-assistant')?.status).toBe('installed');
  });

  it('should update extension version', () => {
    state.extensions.updateExtension('cursor.ai-assistant', '3.0.0');
    expect(state.extensions.installed.find((e) => e.id === 'cursor.ai-assistant')?.version).toBe('3.0.0');
  });

  it('should search extensions', () => {
    state.extensions.searchExtensions('python');
    expect(state.extensions.searchQuery).toBe('python');
    expect(state.extensions.isSearching).toBe(true);

    state.extensions.clearSearch();
    expect(state.extensions.searchQuery).toBe('');
    expect(state.extensions.isSearching).toBe(false);
  });

  it('should select extension', () => {
    state.extensions.selectExtension('cursor.ai-assistant');
    expect(state.extensions.selectedExtensionId).toBe('cursor.ai-assistant');
    state.extensions.selectExtension(null);
    expect(state.extensions.selectedExtensionId).toBeNull();
  });

  it('should set active category', () => {
    state.extensions.setActiveCategory('Themes');
    expect(state.extensions.activeCategory).toBe('Themes');
  });

  it('should toggle auto update', () => {
    state.extensions.setAutoUpdate(false);
    expect(state.extensions.autoUpdateEnabled).toBe(false);
  });
});
