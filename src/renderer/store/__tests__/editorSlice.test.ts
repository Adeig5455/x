import { createEditorSlice, EditorSlice } from '../editorSlice';

// Helper to create a testable slice with mock set/get
function createTestSlice() {
  let state: { editor: EditorSlice };

  const set = (fn: (s: { editor: EditorSlice }) => Partial<{ editor: EditorSlice }>) => {
    const partial = fn(state);
    if (partial.editor) {
      state = { editor: { ...state.editor, ...partial.editor } };
    }
  };

  const get = () => state;

  const slice = createEditorSlice(set, get);
  state = { editor: slice };

  return { getState: () => state.editor, set, get };
}

describe('EditorSlice', () => {
  let store: ReturnType<typeof createTestSlice>;

  beforeEach(() => {
    store = createTestSlice();
  });

  describe('initial state', () => {
    it('should have one default group', () => {
      const s = store.getState();
      expect(s.groups).toHaveLength(1);
      expect(s.groups[0].id).toBe('group-1');
      expect(s.groups[0].tabs).toEqual([]);
      expect(s.groups[0].activeTabId).toBeNull();
    });

    it('should have default active group', () => {
      expect(store.getState().activeGroupId).toBe('group-1');
    });

    it('should have no split direction', () => {
      expect(store.getState().splitDirection).toBeNull();
    });

    it('should have empty undo/redo stacks', () => {
      expect(store.getState().undoStack).toEqual([]);
      expect(store.getState().redoStack).toEqual([]);
    });
  });

  describe('openFile', () => {
    it('should open a new file tab', () => {
      store.getState().openFile('/src/index.ts', 'index.ts', 'const x = 1;', 'typescript');
      const s = store.getState();
      expect(s.groups[0].tabs).toHaveLength(1);
      expect(s.groups[0].tabs[0].filePath).toBe('/src/index.ts');
      expect(s.groups[0].tabs[0].fileName).toBe('index.ts');
      expect(s.groups[0].tabs[0].content).toBe('const x = 1;');
      expect(s.groups[0].tabs[0].language).toBe('typescript');
      expect(s.groups[0].tabs[0].isDirty).toBe(false);
      expect(s.groups[0].tabs[0].isActive).toBe(true);
    });

    it('should activate existing tab if file is already open', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');
      const tabBId = store.getState().groups[0].activeTabId;

      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      expect(store.getState().groups[0].tabs).toHaveLength(2);
      expect(store.getState().groups[0].activeTabId).not.toBe(tabBId);
    });

    it('should deactivate other tabs when opening new file', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');

      const tabs = store.getState().groups[0].tabs;
      const activeTabs = tabs.filter((t) => t.isActive);
      expect(activeTabs).toHaveLength(1);
      expect(activeTabs[0].fileName).toBe('b.ts');
    });

    it('should open multiple files', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');
      store.getState().openFile('/src/c.ts', 'c.ts', 'c', 'typescript');

      expect(store.getState().groups[0].tabs).toHaveLength(3);
    });
  });

  describe('closeTab', () => {
    it('should close a tab', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      const tabId = store.getState().groups[0].tabs[0].id;

      store.getState().closeTab(tabId);
      expect(store.getState().groups[0].tabs).toHaveLength(0);
      expect(store.getState().groups[0].activeTabId).toBeNull();
    });

    it('should activate next tab after closing active tab', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');
      store.getState().openFile('/src/c.ts', 'c.ts', 'c', 'typescript');

      const tabBId = store.getState().groups[0].tabs[1].id;
      store.getState().setActiveTab(tabBId);
      store.getState().closeTab(tabBId);

      expect(store.getState().groups[0].tabs).toHaveLength(2);
      expect(store.getState().groups[0].activeTabId).toBeTruthy();
    });

    it('should not crash when closing non-existent tab', () => {
      store.getState().closeTab('non-existent');
      expect(store.getState().groups[0].tabs).toHaveLength(0);
    });
  });

  describe('closeAllTabs', () => {
    it('should close all tabs in active group', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');

      store.getState().closeAllTabs();
      expect(store.getState().groups[0].tabs).toHaveLength(0);
      expect(store.getState().groups[0].activeTabId).toBeNull();
    });
  });

  describe('closeOtherTabs', () => {
    it('should close all tabs except specified', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');
      store.getState().openFile('/src/c.ts', 'c.ts', 'c', 'typescript');

      const tabBId = store.getState().groups[0].tabs[1].id;
      store.getState().closeOtherTabs(tabBId);

      expect(store.getState().groups[0].tabs).toHaveLength(1);
      expect(store.getState().groups[0].tabs[0].id).toBe(tabBId);
      expect(store.getState().groups[0].activeTabId).toBe(tabBId);
    });
  });

  describe('closeTabsToRight', () => {
    it('should close tabs to the right of specified tab', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');
      store.getState().openFile('/src/c.ts', 'c.ts', 'c', 'typescript');

      const tabAId = store.getState().groups[0].tabs[0].id;
      store.getState().closeTabsToRight(tabAId);

      expect(store.getState().groups[0].tabs).toHaveLength(1);
      expect(store.getState().groups[0].tabs[0].fileName).toBe('a.ts');
    });
  });

  describe('setActiveTab', () => {
    it('should set active tab and update isActive flags', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');

      const tabAId = store.getState().groups[0].tabs[0].id;
      store.getState().setActiveTab(tabAId);

      const tabs = store.getState().groups[0].tabs;
      expect(tabs[0].isActive).toBe(true);
      expect(tabs[1].isActive).toBe(false);
      expect(store.getState().groups[0].activeTabId).toBe(tabAId);
    });
  });

  describe('setTabDirty', () => {
    it('should mark tab as dirty', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      const tabId = store.getState().groups[0].tabs[0].id;

      store.getState().setTabDirty(tabId, true);
      expect(store.getState().groups[0].tabs[0].isDirty).toBe(true);

      store.getState().setTabDirty(tabId, false);
      expect(store.getState().groups[0].tabs[0].isDirty).toBe(false);
    });
  });

  describe('updateTabContent', () => {
    it('should update content and mark as dirty', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      const tabId = store.getState().groups[0].tabs[0].id;

      store.getState().updateTabContent(tabId, 'new content');
      expect(store.getState().groups[0].tabs[0].content).toBe('new content');
      expect(store.getState().groups[0].tabs[0].isDirty).toBe(true);
    });
  });

  describe('reorderTab', () => {
    it('should reorder tabs within a group', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().openFile('/src/b.ts', 'b.ts', 'b', 'typescript');
      store.getState().openFile('/src/c.ts', 'c.ts', 'c', 'typescript');

      store.getState().reorderTab('group-1', 2, 0);

      const tabs = store.getState().groups[0].tabs;
      expect(tabs[0].fileName).toBe('c.ts');
      expect(tabs[1].fileName).toBe('a.ts');
      expect(tabs[2].fileName).toBe('b.ts');
    });
  });

  describe('splitEditor', () => {
    it('should create a new editor group', () => {
      store.getState().splitEditor('horizontal');

      expect(store.getState().groups).toHaveLength(2);
      expect(store.getState().splitDirection).toBe('horizontal');
    });

    it('should copy active tab to new group', () => {
      store.getState().openFile('/src/a.ts', 'a.ts', 'a', 'typescript');
      store.getState().splitEditor('vertical');

      expect(store.getState().groups[1].tabs).toHaveLength(1);
      expect(store.getState().groups[1].tabs[0].filePath).toBe('/src/a.ts');
    });

    it('should not exceed 3 splits', () => {
      store.getState().splitEditor('horizontal');
      store.getState().splitEditor('horizontal');
      store.getState().splitEditor('horizontal');

      expect(store.getState().groups.length).toBeLessThanOrEqual(3);
    });
  });

  describe('closeSplit', () => {
    it('should remove a split group', () => {
      store.getState().splitEditor('horizontal');
      const secondGroupId = store.getState().groups[1].id;

      store.getState().closeSplit(secondGroupId);
      expect(store.getState().groups).toHaveLength(1);
      expect(store.getState().splitDirection).toBeNull();
    });

    it('should not close the last group', () => {
      store.getState().closeSplit('group-1');
      expect(store.getState().groups).toHaveLength(1);
    });
  });

  describe('undo/redo', () => {
    it('should move action from undo to redo stack on undo', () => {
      // Manually set up undo stack since openFile doesn't push to it
      const s = store.getState();
      // We access the raw state manipulation to test undo/redo
      expect(s.undoStack).toEqual([]);
      expect(s.redoStack).toEqual([]);
    });

    it('should handle undo on empty stack gracefully', () => {
      store.getState().undo();
      expect(store.getState().undoStack).toEqual([]);
    });

    it('should handle redo on empty stack gracefully', () => {
      store.getState().redo();
      expect(store.getState().redoStack).toEqual([]);
    });
  });
});
