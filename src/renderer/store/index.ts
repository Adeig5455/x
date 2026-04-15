import { create } from 'zustand';
import type { FileNode, EditorTab, AIMessage, AppSettings, SidebarPanel, GitFileStatus, GitBranch, SearchResult, BreadcrumbItem, Notification } from '../../shared/types';

export interface AppState {
  // Project
  hasOpenProject: boolean;
  projectPath: string | null;
  fileTree: FileNode[];

  // Editor
  tabs: EditorTab[];
  activeTabId: string | null;

  // Sidebar
  activePanel: SidebarPanel;
  sidebarVisible: boolean;
  sidebarWidth: number;

  // AI
  aiMessages: AIMessage[];
  aiLoading: boolean;

  // Terminal
  terminalVisible: boolean;
  terminalHeight: number;

  // Search
  searchQuery: string;
  searchResults: SearchResult[];

  // Git
  gitFiles: GitFileStatus[];
  gitBranches: GitBranch[];
  currentBranch: string;

  // Settings
  settings: AppSettings;

  // UI
  commandPaletteOpen: boolean;
  breadcrumbs: BreadcrumbItem[];
  notifications: Notification[];

  // Actions - Project
  setProjectPath: (path: string | null) => void;
  setFileTree: (tree: FileNode[]) => void;

  // Actions - Editor
  openTab: (tab: EditorTab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;

  // Actions - Sidebar
  setActivePanel: (panel: SidebarPanel) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;

  // Actions - AI
  addAIMessage: (message: AIMessage) => void;
  clearAIMessages: () => void;
  setAILoading: (loading: boolean) => void;

  // Actions - Terminal
  toggleTerminal: () => void;
  setTerminalHeight: (height: number) => void;

  // Actions - Search
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;

  // Actions - Git
  setGitFiles: (files: GitFileStatus[]) => void;
  setGitBranches: (branches: GitBranch[]) => void;
  setCurrentBranch: (branch: string) => void;

  // Actions - Settings
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Actions - UI
  toggleCommandPalette: () => void;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

const defaultSettings: AppSettings = {
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

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  hasOpenProject: false,
  projectPath: null,
  fileTree: [],
  tabs: [],
  activeTabId: null,
  activePanel: 'explorer',
  sidebarVisible: true,
  sidebarWidth: 260,
  aiMessages: [],
  aiLoading: false,
  terminalVisible: false,
  terminalHeight: 200,
  searchQuery: '',
  searchResults: [],
  gitFiles: [],
  gitBranches: [],
  currentBranch: 'main',
  settings: defaultSettings,
  commandPaletteOpen: false,
  breadcrumbs: [],
  notifications: [],

  // Project actions
  setProjectPath: (path) => set({ projectPath: path, hasOpenProject: path !== null }),
  setFileTree: (tree) => set({ fileTree: tree }),

  // Editor actions
  openTab: (tab) =>
    set((state) => ({
      tabs: [...state.tabs.map((t) => ({ ...t, isActive: false })), { ...tab, isActive: true }],
      activeTabId: tab.id,
    })),
  closeTab: (tabId) =>
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== tabId);
      const newActiveId = state.activeTabId === tabId
        ? newTabs[newTabs.length - 1]?.id ?? null
        : state.activeTabId;
      return {
        tabs: newTabs.map((t) => ({ ...t, isActive: t.id === newActiveId })),
        activeTabId: newActiveId,
      };
    }),
  setActiveTab: (tabId) =>
    set((state) => ({
      tabs: state.tabs.map((t) => ({ ...t, isActive: t.id === tabId })),
      activeTabId: tabId,
    })),
  updateTabContent: (tabId, content) =>
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === tabId ? { ...t, content, isDirty: true } : t)),
    })),

  // Sidebar actions
  setActivePanel: (panel) => set({ activePanel: panel, sidebarVisible: true }),
  toggleSidebar: () => set((state) => ({ sidebarVisible: !state.sidebarVisible })),
  setSidebarWidth: (width) => set({ sidebarWidth: width }),

  // AI actions
  addAIMessage: (message) => set((state) => ({ aiMessages: [...state.aiMessages, message] })),
  clearAIMessages: () => set({ aiMessages: [] }),
  setAILoading: (loading) => set({ aiLoading: loading }),

  // Terminal actions
  toggleTerminal: () => set((state) => ({ terminalVisible: !state.terminalVisible })),
  setTerminalHeight: (height) => set({ terminalHeight: height }),

  // Search actions
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSearchResults: (results) => set({ searchResults: results }),

  // Git actions
  setGitFiles: (files) => set({ gitFiles: files }),
  setGitBranches: (branches) => set({ gitBranches: branches }),
  setCurrentBranch: (branch) => set({ currentBranch: branch }),

  // Settings actions
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),

  // UI actions
  toggleCommandPalette: () => set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  setBreadcrumbs: (items) => set({ breadcrumbs: items }),
  addNotification: (notification) =>
    set((state) => ({ notifications: [...state.notifications, notification] })),
  removeNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
}));
