// ============================================================================
// Extensions Store Slice - Extension marketplace state management with
// install/uninstall, enable/disable, ratings, and dependency resolution
// ============================================================================

import { generateId } from '../../shared/utils';

export type ExtensionStatus = 'installed' | 'installing' | 'uninstalling' | 'disabled' | 'error';

export interface Extension {
  id: string;
  name: string;
  displayName: string;
  publisher: string;
  version: string;
  description: string;
  icon?: string;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  status: ExtensionStatus;
  categories: string[];
  tags: string[];
  dependencies: string[];
  isBuiltin: boolean;
  lastUpdated: number;
  size?: number;
}

export interface ExtensionsState {
  installed: Extension[];
  recommended: Extension[];
  searchQuery: string;
  searchResults: Extension[];
  activeCategory: string;
  isSearching: boolean;
  selectedExtensionId: string | null;
  autoUpdateEnabled: boolean;
}

export interface ExtensionsSlice extends ExtensionsState {
  installExtension: (ext: Omit<Extension, 'status'>) => void;
  uninstallExtension: (id: string) => void;
  enableExtension: (id: string) => void;
  disableExtension: (id: string) => void;
  updateExtension: (id: string, version: string) => void;
  searchExtensions: (query: string) => void;
  setSearchResults: (results: Extension[]) => void;
  setActiveCategory: (category: string) => void;
  selectExtension: (id: string | null) => void;
  setAutoUpdate: (enabled: boolean) => void;
  clearSearch: () => void;
}

export const createExtensionsSlice = (
  set: (fn: (state: { extensions: ExtensionsSlice }) => Partial<{ extensions: ExtensionsSlice }>) => void,
  _get: () => { extensions: ExtensionsSlice }
): ExtensionsSlice => ({
  installed: [
    {
      id: 'cursor.ai-assistant',
      name: 'ai-assistant',
      displayName: 'AI Assistant',
      publisher: 'Cursor',
      version: '2.1.0',
      description: 'Intelligent code completion and chat',
      rating: 4.9,
      ratingCount: 15000,
      downloadCount: 500000,
      status: 'installed',
      categories: ['AI', 'Programming Languages'],
      tags: ['ai', 'completion', 'chat'],
      dependencies: [],
      isBuiltin: true,
      lastUpdated: Date.now(),
    },
    {
      id: 'cursor.theme-dark-plus',
      name: 'theme-dark-plus',
      displayName: 'Dark+ Theme',
      publisher: 'Cursor',
      version: '1.0.0',
      description: 'Default dark color theme',
      rating: 4.8,
      ratingCount: 8000,
      downloadCount: 300000,
      status: 'installed',
      categories: ['Themes'],
      tags: ['theme', 'dark'],
      dependencies: [],
      isBuiltin: true,
      lastUpdated: Date.now(),
    },
  ],
  recommended: [],
  searchQuery: '',
  searchResults: [],
  activeCategory: 'all',
  isSearching: false,
  selectedExtensionId: null,
  autoUpdateEnabled: true,

  installExtension: (ext) => {
    set((state) => ({
      extensions: {
        ...state.extensions,
        installed: [
          ...state.extensions.installed,
          { ...ext, status: 'installed' as ExtensionStatus },
        ],
      },
    }));
  },

  uninstallExtension: (id) => {
    set((state) => ({
      extensions: {
        ...state.extensions,
        installed: state.extensions.installed.filter((e) => e.id !== id || e.isBuiltin),
        selectedExtensionId: state.extensions.selectedExtensionId === id ? null : state.extensions.selectedExtensionId,
      },
    }));
  },

  enableExtension: (id) => {
    set((state) => ({
      extensions: {
        ...state.extensions,
        installed: state.extensions.installed.map((e) =>
          e.id === id ? { ...e, status: 'installed' as ExtensionStatus } : e
        ),
      },
    }));
  },

  disableExtension: (id) => {
    set((state) => ({
      extensions: {
        ...state.extensions,
        installed: state.extensions.installed.map((e) =>
          e.id === id && !e.isBuiltin ? { ...e, status: 'disabled' as ExtensionStatus } : e
        ),
      },
    }));
  },

  updateExtension: (id, version) => {
    set((state) => ({
      extensions: {
        ...state.extensions,
        installed: state.extensions.installed.map((e) =>
          e.id === id ? { ...e, version, lastUpdated: Date.now() } : e
        ),
      },
    }));
  },

  searchExtensions: (query) => {
    set((state) => ({
      extensions: { ...state.extensions, searchQuery: query, isSearching: query.length > 0 },
    }));
  },

  setSearchResults: (results) => {
    set((state) => ({
      extensions: { ...state.extensions, searchResults: results, isSearching: false },
    }));
  },

  setActiveCategory: (category) => {
    set((state) => ({
      extensions: { ...state.extensions, activeCategory: category },
    }));
  },

  selectExtension: (id) => {
    set((state) => ({
      extensions: { ...state.extensions, selectedExtensionId: id },
    }));
  },

  setAutoUpdate: (enabled) => {
    set((state) => ({
      extensions: { ...state.extensions, autoUpdateEnabled: enabled },
    }));
  },

  clearSearch: () => {
    set((state) => ({
      extensions: { ...state.extensions, searchQuery: '', searchResults: [], isSearching: false },
    }));
  },
});
