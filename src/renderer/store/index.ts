import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import type { EditorSlice } from './editorSlice';
import type { AISlice } from './aiSlice';
import type { FileSystemSlice } from './fileSystemSlice';
import type { UISlice } from './uiSlice';
import type { GitSlice } from './gitSlice';
import type { SearchSlice } from './searchSlice';
import type { SettingsSlice } from './settingsSlice';
import type { NotificationsSlice } from './notificationsSlice';
import type { DebugSlice } from './debugSlice';
import type { ExtensionsSlice } from './extensionsSlice';
import type { ProblemsSlice } from './problemsSlice';
import type { SnippetsSlice } from './snippetsSlice';
import type { WorkspaceSlice } from './workspaceSlice';
import { createEditorSlice } from './editorSlice';
import { createAISlice } from './aiSlice';
import { createFileSystemSlice } from './fileSystemSlice';
import { createUISlice } from './uiSlice';
import { createGitSlice } from './gitSlice';
import { createSearchSlice } from './searchSlice';
import { createSettingsSlice } from './settingsSlice';
import { createNotificationsSlice } from './notificationsSlice';
import { createDebugSlice } from './debugSlice';
import { createExtensionsSlice } from './extensionsSlice';
import { createProblemsSlice } from './problemsSlice';
import { createSnippetsSlice } from './snippetsSlice';
import { createWorkspaceSlice } from './workspaceSlice';

// ============================================================================
// Combined Store Type
// ============================================================================

export interface AppStore {
  editor: EditorSlice;
  ai: AISlice;
  fileSystem: FileSystemSlice;
  ui: UISlice;
  git: GitSlice;
  search: SearchSlice;
  settings: SettingsSlice;
  notifications: NotificationsSlice;
  debug: DebugSlice;
  extensions: ExtensionsSlice;
  problems: ProblemsSlice;
  snippets: SnippetsSlice;
  workspace: WorkspaceSlice;
}

// ============================================================================
// Action Logger
// ============================================================================

interface LogEntry {
  timestamp: number;
  action: string;
  payload?: unknown;
}

const actionLogger: LogEntry[] = [];

export function getActionLog(): ReadonlyArray<LogEntry> {
  return actionLogger;
}

export function clearActionLog(): void {
  actionLogger.length = 0;
}

// ============================================================================
// Store Selectors (Memoized)
// ============================================================================

export const selectors = {
  // Editor selectors
  activeTab: (state: AppStore) => {
    const group = state.editor.groups.find((g) => g.id === state.editor.activeGroupId);
    if (!group) return null;
    return group.tabs.find((t) => t.id === group.activeTabId) ?? null;
  },

  activeTabContent: (state: AppStore) => {
    const group = state.editor.groups.find((g) => g.id === state.editor.activeGroupId);
    if (!group) return '';
    const tab = group.tabs.find((t) => t.id === group.activeTabId);
    return tab?.content ?? '';
  },

  dirtyTabs: (state: AppStore) => {
    return state.editor.groups.flatMap((g) => g.tabs.filter((t) => t.isDirty));
  },

  totalTabCount: (state: AppStore) => {
    return state.editor.groups.reduce((sum: number, g) => sum + g.tabs.length, 0);
  },

  // AI selectors
  activeConversation: (state: AppStore) => {
    return state.ai.conversations.find((c) => c.id === state.ai.activeConversationId) ?? null;
  },

  activeMessages: (state: AppStore) => {
    const conv = state.ai.conversations.find((c) => c.id === state.ai.activeConversationId);
    return conv?.messages ?? [];
  },

  isAIBusy: (state: AppStore) => state.ai.aiLoading || state.ai.streamingMessageId !== null,

  // FileSystem selectors
  expandedDirs: (state: AppStore) => state.fileSystem.expandedDirs,
  isPathExpanded: (path: string) => (state: AppStore) => state.fileSystem.expandedDirs.includes(path),

  fileTreeFlat: (state: AppStore) => {
    const result: Array<{ node: (typeof state.fileSystem.fileTree)[0]; depth: number }> = [];
    const expandedSet = new Set(state.fileSystem.expandedDirs);
    const walk = (nodes: typeof state.fileSystem.fileTree, depth: number) => {
      for (const node of nodes) {
        result.push({ node, depth });
        if (node.type === 'directory' && node.children && expandedSet.has(node.path)) {
          walk(node.children, depth + 1);
        }
      }
    };
    walk(state.fileSystem.fileTree, 0);
    return result;
  },

  // Git selectors
  stagedFiles: (state: AppStore) => state.git.gitFiles.filter((f) => f.staged),
  unstagedFiles: (state: AppStore) => state.git.gitFiles.filter((f) => !f.staged),
  hasConflicts: (state: AppStore) => state.git.conflictCount > 0,
  isSynced: (state: AppStore) => state.git.aheadCount === 0 && state.git.behindCount === 0,

  // Search selectors
  hasActiveSearch: (state: AppStore) => state.search.searchQuery.length > 0,
  searchResultCount: (state: AppStore) => state.search.searchResults.length,

  // UI selectors
  isZenMode: (state: AppStore) => state.ui.zenMode,
  visibleNotifications: (state: AppStore) => state.ui.notifications.slice(0, 5),
  unreadNotificationCount: (state: AppStore) => state.ui.notifications.length,

  // Notifications selectors
  unreadAdvancedNotifications: (state: AppStore) =>
    state.notifications.notifications.filter((n) => !n.read),
  pinnedNotifications: (state: AppStore) =>
    state.notifications.notifications.filter((n) => n.pinned),

  // Debug selectors
  isDebugging: (state: AppStore) =>
    state.debug.status === 'running' || state.debug.status === 'paused',
  activeBreakpoints: (state: AppStore) =>
    state.debug.breakpoints.filter((bp) => bp.enabled),
  debugErrorCount: (state: AppStore) =>
    state.debug.consoleEntries.filter((e) => e.type === 'error').length,

  // Extensions selectors
  enabledExtensions: (state: AppStore) =>
    state.extensions.installed.filter((e) => e.status === 'installed'),
  disabledExtensions: (state: AppStore) =>
    state.extensions.installed.filter((e) => e.status === 'disabled'),

  // Problems selectors
  totalErrors: (state: AppStore) =>
    state.problems.diagnostics.filter((d) => d.severity === 'error').length,
  totalWarnings: (state: AppStore) =>
    state.problems.diagnostics.filter((d) => d.severity === 'warning').length,

  // Workspace selectors
  workspaceFolderCount: (state: AppStore) => state.workspace.folders.length,
  activeWorkspaceFolder: (state: AppStore) =>
    state.workspace.folders.find((f) => f.id === state.workspace.activeFolderId) ?? null,
};

// ============================================================================
// Store Creation with Middleware Stack
// ============================================================================

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get) => ({
          editor: createEditorSlice(
            ((fn: (s: { editor: EditorSlice }) => Partial<{ editor: EditorSlice }>) => {
              set((state) => {
                const result = fn({ editor: state.editor });
                if (result.editor) return { editor: { ...state.editor, ...result.editor } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createEditorSlice>[0],
            (() => ({ editor: get().editor })) as Parameters<typeof createEditorSlice>[1]
          ),
          ai: createAISlice(
            ((fn: (s: { ai: AISlice }) => Partial<{ ai: AISlice }>) => {
              set((state) => {
                const result = fn({ ai: state.ai });
                if (result.ai) return { ai: { ...state.ai, ...result.ai } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createAISlice>[0],
            (() => ({ ai: get().ai })) as Parameters<typeof createAISlice>[1]
          ),
          fileSystem: createFileSystemSlice(
            ((fn: (s: { fileSystem: FileSystemSlice }) => Partial<{ fileSystem: FileSystemSlice }>) => {
              set((state) => {
                const result = fn({ fileSystem: state.fileSystem });
                if (result.fileSystem) return { fileSystem: { ...state.fileSystem, ...result.fileSystem } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createFileSystemSlice>[0],
            (() => ({ fileSystem: get().fileSystem })) as Parameters<typeof createFileSystemSlice>[1]
          ),
          ui: createUISlice(
            ((fn: (s: { ui: UISlice }) => Partial<{ ui: UISlice }>) => {
              set((state) => {
                const result = fn({ ui: state.ui });
                if (result.ui) return { ui: { ...state.ui, ...result.ui } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createUISlice>[0],
            (() => ({ ui: get().ui })) as Parameters<typeof createUISlice>[1]
          ),
          git: createGitSlice(
            ((fn: (s: { git: GitSlice }) => Partial<{ git: GitSlice }>) => {
              set((state) => {
                const result = fn({ git: state.git });
                if (result.git) return { git: { ...state.git, ...result.git } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createGitSlice>[0],
            (() => ({ git: get().git })) as Parameters<typeof createGitSlice>[1]
          ),
          search: createSearchSlice(
            ((fn: (s: { search: SearchSlice }) => Partial<{ search: SearchSlice }>) => {
              set((state) => {
                const result = fn({ search: state.search });
                if (result.search) return { search: { ...state.search, ...result.search } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createSearchSlice>[0],
            (() => ({ search: get().search })) as Parameters<typeof createSearchSlice>[1]
          ),
          settings: createSettingsSlice(
            ((fn: (s: { settings: SettingsSlice }) => Partial<{ settings: SettingsSlice }>) => {
              set((state) => {
                const result = fn({ settings: state.settings });
                if (result.settings) return { settings: { ...state.settings, ...result.settings } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createSettingsSlice>[0],
            (() => ({ settings: get().settings })) as Parameters<typeof createSettingsSlice>[1]
          ),
          notifications: createNotificationsSlice(
            ((fn: (s: { notifications: NotificationsSlice }) => Partial<{ notifications: NotificationsSlice }>) => {
              set((state) => {
                const result = fn({ notifications: state.notifications });
                if (result.notifications) return { notifications: { ...state.notifications, ...result.notifications } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createNotificationsSlice>[0],
            (() => ({ notifications: get().notifications })) as Parameters<typeof createNotificationsSlice>[1]
          ),
          debug: createDebugSlice(
            ((fn: (s: { debug: DebugSlice }) => Partial<{ debug: DebugSlice }>) => {
              set((state) => {
                const result = fn({ debug: state.debug });
                if (result.debug) return { debug: { ...state.debug, ...result.debug } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createDebugSlice>[0],
            (() => ({ debug: get().debug })) as Parameters<typeof createDebugSlice>[1]
          ),
          extensions: createExtensionsSlice(
            ((fn: (s: { extensions: ExtensionsSlice }) => Partial<{ extensions: ExtensionsSlice }>) => {
              set((state) => {
                const result = fn({ extensions: state.extensions });
                if (result.extensions) return { extensions: { ...state.extensions, ...result.extensions } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createExtensionsSlice>[0],
            (() => ({ extensions: get().extensions })) as Parameters<typeof createExtensionsSlice>[1]
          ),
          problems: createProblemsSlice(
            ((fn: (s: { problems: ProblemsSlice }) => Partial<{ problems: ProblemsSlice }>) => {
              set((state) => {
                const result = fn({ problems: state.problems });
                if (result.problems) return { problems: { ...state.problems, ...result.problems } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createProblemsSlice>[0],
            (() => ({ problems: get().problems })) as Parameters<typeof createProblemsSlice>[1]
          ),
          snippets: createSnippetsSlice(
            ((fn: (s: { snippets: SnippetsSlice }) => Partial<{ snippets: SnippetsSlice }>) => {
              set((state) => {
                const result = fn({ snippets: state.snippets });
                if (result.snippets) return { snippets: { ...state.snippets, ...result.snippets } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createSnippetsSlice>[0],
            (() => ({ snippets: get().snippets })) as Parameters<typeof createSnippetsSlice>[1]
          ),
          workspace: createWorkspaceSlice(
            ((fn: (s: { workspace: WorkspaceSlice }) => Partial<{ workspace: WorkspaceSlice }>) => {
              set((state) => {
                const result = fn({ workspace: state.workspace });
                if (result.workspace) return { workspace: { ...state.workspace, ...result.workspace } } as Partial<AppStore>;
                return {} as Partial<AppStore>;
              });
            }) as Parameters<typeof createWorkspaceSlice>[0],
            (() => ({ workspace: get().workspace })) as Parameters<typeof createWorkspaceSlice>[1]
          ),
        }),
        {
          name: 'cursor-ide-store',
          version: 1,
          partialize: (state) => ({
            settings: state.settings,
            ui: state.ui,
            fileSystem: state.fileSystem,
          }),
        }
      )
    ),
    { name: 'CursorIDE', enabled: process.env.NODE_ENV === 'development' }
  )
);

// ============================================================================
// Store Subscriptions (Side Effects)
// ============================================================================

useAppStore.subscribe(
  (state) => state.editor.groups.flatMap((g) => g.tabs.filter((t) => t.isDirty)).length,
  (dirtyCount) => {
    if (dirtyCount > 0 && dirtyCount % 5 === 0) {
      console.warn(`[CursorIDE] ${dirtyCount} unsaved files`);
    }
  }
);

useAppStore.subscribe(
  (state) => state.settings.settings.theme,
  (theme) => {
    document.documentElement.setAttribute('data-theme', theme);
  }
);

// ============================================================================
// Store Utilities
// ============================================================================

function extractSnapshot(state: Record<string, unknown>): Record<string, unknown> {
  const snapshot: Record<string, unknown> = {};
  for (const key of Object.keys(state)) {
    if (typeof state[key] !== 'function' && !key.startsWith('_')) {
      snapshot[key] = state[key];
    }
  }
  return snapshot;
}

export function resetStore(): void {
  useAppStore.setState({} as AppStore, true);
}

export function getStoreSnapshot(): Partial<AppStore> {
  const state = useAppStore.getState();
  return extractSnapshot(state as unknown as Record<string, unknown>) as Partial<AppStore>;
}

export type { EditorSlice, AISlice, FileSystemSlice, UISlice, GitSlice, SearchSlice, SettingsSlice, NotificationsSlice, DebugSlice, ExtensionsSlice, ProblemsSlice, SnippetsSlice, WorkspaceSlice };
