import { create } from 'zustand';
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware';
import type { EditorSlice } from './editorSlice';
import type { AISlice } from './aiSlice';
import type { FileSystemSlice } from './fileSystemSlice';
import type { UISlice } from './uiSlice';
import type { GitSlice } from './gitSlice';
import type { SearchSlice } from './searchSlice';
import type { SettingsSlice } from './settingsSlice';
import { createEditorSlice } from './editorSlice';
import { createAISlice } from './aiSlice';
import { createFileSystemSlice } from './fileSystemSlice';
import { createUISlice } from './uiSlice';
import { createGitSlice } from './gitSlice';
import { createSearchSlice } from './searchSlice';
import { createSettingsSlice } from './settingsSlice';

// ============================================================================
// Combined Store Type
// ============================================================================

export type AppStore = EditorSlice &
  AISlice &
  FileSystemSlice &
  UISlice &
  GitSlice &
  SearchSlice &
  SettingsSlice;

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
    const group = state.editorGroups.find((g) => g.id === state.activeGroupId);
    if (!group) return null;
    return group.tabs.find((t) => t.id === group.activeTabId) ?? null;
  },

  activeTabContent: (state: AppStore) => {
    const group = state.editorGroups.find((g) => g.id === state.activeGroupId);
    if (!group) return '';
    const tab = group.tabs.find((t) => t.id === group.activeTabId);
    return tab?.content ?? '';
  },

  dirtyTabs: (state: AppStore) => {
    return state.editorGroups.flatMap((g) => g.tabs.filter((t) => t.isDirty));
  },

  totalTabCount: (state: AppStore) => {
    return state.editorGroups.reduce((sum, g) => sum + g.tabs.length, 0);
  },

  // AI selectors
  activeConversation: (state: AppStore) => {
    return state.conversations.find((c) => c.id === state.activeConversationId) ?? null;
  },

  activeMessages: (state: AppStore) => {
    const conv = state.conversations.find((c) => c.id === state.activeConversationId);
    return conv?.messages ?? [];
  },

  isAIBusy: (state: AppStore) => state.aiLoading || state.streamingMessageId !== null,

  // FileSystem selectors
  expandedDirs: (state: AppStore) => state.expandedDirs,
  isPathExpanded: (path: string) => (state: AppStore) => state.expandedDirs.has(path),

  fileTreeFlat: (state: AppStore) => {
    const result: Array<{ node: (typeof state.fileTree)[0]; depth: number }> = [];
    const walk = (nodes: typeof state.fileTree, depth: number) => {
      for (const node of nodes) {
        result.push({ node, depth });
        if (node.type === 'directory' && node.children && state.expandedDirs.has(node.path)) {
          walk(node.children, depth + 1);
        }
      }
    };
    walk(state.fileTree, 0);
    return result;
  },

  // Git selectors
  stagedFiles: (state: AppStore) => state.gitFiles.filter((f) => f.staged),
  unstagedFiles: (state: AppStore) => state.gitFiles.filter((f) => !f.staged),
  hasConflicts: (state: AppStore) => state.conflictCount > 0,
  isSynced: (state: AppStore) => state.aheadCount === 0 && state.behindCount === 0,

  // Search selectors
  hasActiveSearch: (state: AppStore) => state.searchQuery.length > 0,
  searchResultCount: (state: AppStore) => state.searchResults.length,

  // UI selectors
  isZenMode: (state: AppStore) => state.zenMode,
  visibleNotifications: (state: AppStore) => state.notifications.slice(0, 5),
  unreadNotificationCount: (state: AppStore) => state.notifications.length,
};

// ============================================================================
// Store Creation with Middleware Stack
// ============================================================================

export const useAppStore = create<AppStore>()(
  devtools(
    subscribeWithSelector(
      persist(
        (...a) => ({
          ...createEditorSlice(...a),
          ...createAISlice(...a),
          ...createFileSystemSlice(...a),
          ...createUISlice(...a),
          ...createGitSlice(...a),
          ...createSearchSlice(...a),
          ...createSettingsSlice(...a),
        }),
        {
          name: 'cursor-ide-store',
          version: 1,
          partialize: (state) => ({
            settings: state.settings,
            sidebarVisible: state.sidebarVisible,
            sidebarWidth: state.sidebarWidth,
            terminalVisible: state.terminalVisible,
            terminalHeight: state.terminalHeight,
            activePanel: state.activePanel,
            recentPaths: state.recentPaths,
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
  (state) => state.editorGroups.flatMap((g) => g.tabs.filter((t) => t.isDirty)).length,
  (dirtyCount) => {
    if (dirtyCount > 0 && dirtyCount % 5 === 0) {
      console.warn(`[CursorIDE] ${dirtyCount} unsaved files`);
    }
  }
);

useAppStore.subscribe(
  (state) => state.settings.theme,
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
  useAppStore.setState({}, true);
}

export function getStoreSnapshot(): Partial<AppStore> {
  const state = useAppStore.getState();
  return extractSnapshot(state as unknown as Record<string, unknown>) as Partial<AppStore>;
}

export type { EditorSlice, AISlice, FileSystemSlice, UISlice, GitSlice, SearchSlice, SettingsSlice };
