import type { EditorTab } from '../../shared/types';
import { generateId } from '../../shared/utils';

export interface EditorGroup {
  id: string;
  tabs: EditorTab[];
  activeTabId: string | null;
}

export interface EditorState {
  groups: EditorGroup[];
  activeGroupId: string;
  splitDirection: 'horizontal' | 'vertical' | null;
  undoStack: EditorAction[];
  redoStack: EditorAction[];
}

export interface EditorAction {
  type: string;
  payload: unknown;
  timestamp: number;
}

export interface EditorSlice extends EditorState {
  openFile: (filePath: string, fileName: string, content: string, language: string) => void;
  closeTab: (tabId: string, groupId?: string) => void;
  closeAllTabs: (groupId?: string) => void;
  closeOtherTabs: (tabId: string, groupId?: string) => void;
  closeTabsToRight: (tabId: string, groupId?: string) => void;
  setActiveTab: (tabId: string, groupId?: string) => void;
  setTabDirty: (tabId: string, isDirty: boolean) => void;
  updateTabContent: (tabId: string, content: string) => void;
  moveTab: (tabId: string, fromGroupId: string, toGroupId: string, toIndex: number) => void;
  splitEditor: (direction: 'horizontal' | 'vertical') => void;
  closeSplit: (groupId: string) => void;
  reorderTab: (groupId: string, fromIndex: number, toIndex: number) => void;
  undo: () => void;
  redo: () => void;
}

const DEFAULT_GROUP_ID = 'group-1';

export const createEditorSlice = (
  set: (fn: (state: { editor: EditorSlice }) => Partial<{ editor: EditorSlice }>) => void,
  get: () => { editor: EditorSlice }
): EditorSlice => ({
  groups: [{ id: DEFAULT_GROUP_ID, tabs: [], activeTabId: null }],
  activeGroupId: DEFAULT_GROUP_ID,
  splitDirection: null,
  undoStack: [],
  redoStack: [],

  openFile: (filePath, fileName, content, language) => {
    set((state) => {
      const groups = [...state.editor.groups];
      const groupIdx = groups.findIndex((g) => g.id === state.editor.activeGroupId);
      if (groupIdx === -1) return {};

      const group = { ...groups[groupIdx], tabs: [...groups[groupIdx].tabs] };

      // Check if file already open in this group
      const existingTab = group.tabs.find((t) => t.filePath === filePath);
      if (existingTab) {
        group.activeTabId = existingTab.id;
        groups[groupIdx] = group;
        return { editor: { ...state.editor, groups } };
      }

      const newTab: EditorTab = {
        id: generateId(),
        filePath,
        fileName,
        language,
        content,
        isDirty: false,
        isActive: true,
      };

      // Deactivate all other tabs in this group
      group.tabs = group.tabs.map((t) => ({ ...t, isActive: false }));
      group.tabs.push(newTab);
      group.activeTabId = newTab.id;
      groups[groupIdx] = group;

      return { editor: { ...state.editor, groups } };
    });
  },

  closeTab: (tabId, groupId) => {
    set((state) => {
      const gid = groupId || state.editor.activeGroupId;
      const groups = [...state.editor.groups];
      const groupIdx = groups.findIndex((g) => g.id === gid);
      if (groupIdx === -1) return {};

      const group = { ...groups[groupIdx] };
      const tabIdx = group.tabs.findIndex((t) => t.id === tabId);
      if (tabIdx === -1) return {};

      group.tabs = group.tabs.filter((t) => t.id !== tabId);

      // Set new active tab
      if (group.activeTabId === tabId) {
        if (group.tabs.length > 0) {
          const newActiveIdx = Math.min(tabIdx, group.tabs.length - 1);
          group.activeTabId = group.tabs[newActiveIdx].id;
          group.tabs = group.tabs.map((t, i) => ({ ...t, isActive: i === newActiveIdx }));
        } else {
          group.activeTabId = null;
        }
      }

      groups[groupIdx] = group;
      return { editor: { ...state.editor, groups } };
    });
  },

  closeAllTabs: (groupId) => {
    set((state) => {
      const gid = groupId || state.editor.activeGroupId;
      const groups = state.editor.groups.map((g) =>
        g.id === gid ? { ...g, tabs: [], activeTabId: null } : g
      );
      return { editor: { ...state.editor, groups } };
    });
  },

  closeOtherTabs: (tabId, groupId) => {
    set((state) => {
      const gid = groupId || state.editor.activeGroupId;
      const groups = state.editor.groups.map((g) => {
        if (g.id !== gid) return g;
        const keepTab = g.tabs.find((t) => t.id === tabId);
        if (!keepTab) return g;
        return { ...g, tabs: [{ ...keepTab, isActive: true }], activeTabId: tabId };
      });
      return { editor: { ...state.editor, groups } };
    });
  },

  closeTabsToRight: (tabId, groupId) => {
    set((state) => {
      const gid = groupId || state.editor.activeGroupId;
      const groups = state.editor.groups.map((g) => {
        if (g.id !== gid) return g;
        const idx = g.tabs.findIndex((t) => t.id === tabId);
        if (idx === -1) return g;
        const tabs = g.tabs.slice(0, idx + 1);
        const activeTabId = tabs.some((t) => t.id === g.activeTabId) ? g.activeTabId : tabId;
        return { ...g, tabs, activeTabId };
      });
      return { editor: { ...state.editor, groups } };
    });
  },

  setActiveTab: (tabId, groupId) => {
    set((state) => {
      const gid = groupId || state.editor.activeGroupId;
      const groups = state.editor.groups.map((g) => {
        if (g.id !== gid) return g;
        return {
          ...g,
          activeTabId: tabId,
          tabs: g.tabs.map((t) => ({ ...t, isActive: t.id === tabId })),
        };
      });
      return { editor: { ...state.editor, groups, activeGroupId: gid } };
    });
  },

  setTabDirty: (tabId, isDirty) => {
    set((state) => {
      const groups = state.editor.groups.map((g) => ({
        ...g,
        tabs: g.tabs.map((t) => (t.id === tabId ? { ...t, isDirty } : t)),
      }));
      return { editor: { ...state.editor, groups } };
    });
  },

  updateTabContent: (tabId, content) => {
    set((state) => {
      const groups = state.editor.groups.map((g) => ({
        ...g,
        tabs: g.tabs.map((t) => (t.id === tabId ? { ...t, content, isDirty: true } : t)),
      }));
      return { editor: { ...state.editor, groups } };
    });
  },

  moveTab: (tabId, fromGroupId, toGroupId, toIndex) => {
    set((state) => {
      const groups = [...state.editor.groups];
      const fromIdx = groups.findIndex((g) => g.id === fromGroupId);
      const toIdx = groups.findIndex((g) => g.id === toGroupId);
      if (fromIdx === -1 || toIdx === -1) return {};

      const fromGroup = { ...groups[fromIdx], tabs: [...groups[fromIdx].tabs] };
      const tab = fromGroup.tabs.find((t) => t.id === tabId);
      if (!tab) return {};

      fromGroup.tabs = fromGroup.tabs.filter((t) => t.id !== tabId);
      groups[fromIdx] = fromGroup;

      const toGroup = { ...groups[toIdx], tabs: [...groups[toIdx].tabs] };
      toGroup.tabs.splice(toIndex, 0, tab);
      toGroup.activeTabId = tabId;
      groups[toIdx] = toGroup;

      return { editor: { ...state.editor, groups } };
    });
  },

  splitEditor: (direction) => {
    set((state) => {
      if (state.editor.groups.length >= 3) return {}; // Max 3 splits

      const newGroup: EditorGroup = {
        id: generateId(),
        tabs: [],
        activeTabId: null,
      };

      // Copy active tab to new group
      const activeGroup = state.editor.groups.find((g) => g.id === state.editor.activeGroupId);
      if (activeGroup?.activeTabId) {
        const activeTab = activeGroup.tabs.find((t) => t.id === activeGroup.activeTabId);
        if (activeTab) {
          const clonedTab = { ...activeTab, id: generateId() };
          newGroup.tabs = [clonedTab];
          newGroup.activeTabId = clonedTab.id;
        }
      }

      return {
        editor: {
          ...state.editor,
          groups: [...state.editor.groups, newGroup],
          splitDirection: direction,
        },
      };
    });
  },

  closeSplit: (groupId) => {
    set((state) => {
      if (state.editor.groups.length <= 1) return {};
      const groups = state.editor.groups.filter((g) => g.id !== groupId);
      const activeGroupId = groups[0].id;
      return {
        editor: {
          ...state.editor,
          groups,
          activeGroupId,
          splitDirection: groups.length <= 1 ? null : state.editor.splitDirection,
        },
      };
    });
  },

  reorderTab: (groupId, fromIndex, toIndex) => {
    set((state) => {
      const groups = state.editor.groups.map((g) => {
        if (g.id !== groupId) return g;
        const tabs = [...g.tabs];
        const [moved] = tabs.splice(fromIndex, 1);
        tabs.splice(toIndex, 0, moved);
        return { ...g, tabs };
      });
      return { editor: { ...state.editor, groups } };
    });
  },

  undo: () => {
    set((state) => {
      if (state.editor.undoStack.length === 0) return {};
      const undoStack = [...state.editor.undoStack];
      const action = undoStack.pop()!;
      return {
        editor: {
          ...state.editor,
          undoStack,
          redoStack: [...state.editor.redoStack, action],
        },
      };
    });
  },

  redo: () => {
    set((state) => {
      if (state.editor.redoStack.length === 0) return {};
      const redoStack = [...state.editor.redoStack];
      const action = redoStack.pop()!;
      return {
        editor: {
          ...state.editor,
          redoStack,
          undoStack: [...state.editor.undoStack, action],
        },
      };
    });
  },
});
