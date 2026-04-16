import { createFileSystemSlice, FileSystemSlice } from '../fileSystemSlice';

function createTestSlice() {
  let state: { fileSystem: FileSystemSlice };

  const set = (fn: (s: { fileSystem: FileSystemSlice }) => Partial<{ fileSystem: FileSystemSlice }>) => {
    const partial = fn(state);
    if (partial.fileSystem) {
      state = { fileSystem: { ...state.fileSystem, ...partial.fileSystem } };
    }
  };

  const get = () => state;
  const slice = createFileSystemSlice(set, get);
  state = { fileSystem: slice };

  return { getState: () => state.fileSystem };
}

describe('FileSystemSlice', () => {
  let store: ReturnType<typeof createTestSlice>;

  beforeEach(() => {
    store = createTestSlice();
  });

  describe('initial state', () => {
    it('should have empty file tree', () => {
      expect(store.getState().fileTree).toEqual([]);
    });

    it('should have no project path', () => {
      expect(store.getState().projectPath).toBeNull();
      expect(store.getState().projectName).toBeNull();
    });

    it('should have no expanded dirs', () => {
      expect(store.getState().expandedDirs).toEqual([]);
    });

    it('should not be loading', () => {
      expect(store.getState().isLoading).toBe(false);
    });
  });

  describe('setFileTree', () => {
    it('should set the file tree', () => {
      const tree = [
        { name: 'src', path: '/src', type: 'directory' as const, children: [] },
        { name: 'README.md', path: '/README.md', type: 'file' as const },
      ];
      store.getState().setFileTree(tree);
      expect(store.getState().fileTree).toHaveLength(2);
      expect(store.getState().fileTree[0].name).toBe('src');
    });
  });

  describe('setProjectPath', () => {
    it('should set project path and derive name', () => {
      store.getState().setProjectPath('/home/user/my-project');
      expect(store.getState().projectPath).toBe('/home/user/my-project');
      expect(store.getState().projectName).toBe('my-project');
    });

    it('should clear project when set to null', () => {
      store.getState().setProjectPath('/home/user/project');
      store.getState().setProjectPath(null);
      expect(store.getState().projectPath).toBeNull();
      expect(store.getState().projectName).toBeNull();
    });
  });

  describe('directory expansion', () => {
    it('should toggle directory expansion', () => {
      store.getState().toggleDirExpanded('/src');
      expect(store.getState().expandedDirs).toContain('/src');

      store.getState().toggleDirExpanded('/src');
      expect(store.getState().expandedDirs).not.toContain('/src');
    });

    it('should expand a directory', () => {
      store.getState().expandDir('/src');
      expect(store.getState().expandedDirs).toContain('/src');
    });

    it('should collapse a directory', () => {
      store.getState().expandDir('/src');
      store.getState().collapseDir('/src');
      expect(store.getState().expandedDirs).not.toContain('/src');
    });

    it('should collapse all directories', () => {
      store.getState().expandDir('/src');
      store.getState().expandDir('/lib');
      store.getState().expandDir('/test');

      store.getState().collapseAll();
      expect(store.getState().expandedDirs).toEqual([]);
    });

    it('should handle multiple expansions', () => {
      store.getState().expandDir('/src');
      store.getState().expandDir('/src/components');
      store.getState().expandDir('/src/utils');

      expect(store.getState().expandedDirs).toHaveLength(3);
    });
  });

  describe('setSelectedPath', () => {
    it('should set selected path', () => {
      store.getState().setSelectedPath('/src/index.ts');
      expect(store.getState().selectedPath).toBe('/src/index.ts');
    });

    it('should clear selected path', () => {
      store.getState().setSelectedPath('/src/index.ts');
      store.getState().setSelectedPath(null);
      expect(store.getState().selectedPath).toBeNull();
    });
  });

  describe('addRecentPath', () => {
    it('should add a recent path', () => {
      store.getState().addRecentPath('/project-a');
      expect(store.getState().recentPaths).toEqual(['/project-a']);
    });

    it('should put most recent first', () => {
      store.getState().addRecentPath('/project-a');
      store.getState().addRecentPath('/project-b');
      expect(store.getState().recentPaths[0]).toBe('/project-b');
    });

    it('should deduplicate paths', () => {
      store.getState().addRecentPath('/project-a');
      store.getState().addRecentPath('/project-b');
      store.getState().addRecentPath('/project-a');

      expect(store.getState().recentPaths).toHaveLength(2);
      expect(store.getState().recentPaths[0]).toBe('/project-a');
    });

    it('should limit to 20 recent paths', () => {
      for (let i = 0; i < 25; i++) {
        store.getState().addRecentPath(`/project-${i}`);
      }
      expect(store.getState().recentPaths).toHaveLength(20);
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      store.getState().setLoading(true);
      expect(store.getState().isLoading).toBe(true);
    });
  });

  describe('createFileNode', () => {
    it('should create a file node in parent directory', () => {
      store.getState().setFileTree([
        { name: 'src', path: '/src', type: 'directory', children: [] },
      ]);

      store.getState().createFileNode('/src', 'index.ts', 'file');

      const src = store.getState().fileTree[0];
      expect(src.children).toHaveLength(1);
      expect(src.children![0].name).toBe('index.ts');
      expect(src.children![0].path).toBe('/src/index.ts');
      expect(src.children![0].type).toBe('file');
    });

    it('should create a directory node', () => {
      store.getState().setFileTree([
        { name: 'src', path: '/src', type: 'directory', children: [] },
      ]);

      store.getState().createFileNode('/src', 'components', 'directory');

      const src = store.getState().fileTree[0];
      expect(src.children![0].type).toBe('directory');
      expect(src.children![0].children).toEqual([]);
    });

    it('should sort children with directories first', () => {
      store.getState().setFileTree([
        { name: 'src', path: '/src', type: 'directory', children: [] },
      ]);

      store.getState().createFileNode('/src', 'z-file.ts', 'file');
      store.getState().createFileNode('/src', 'a-dir', 'directory');

      const children = store.getState().fileTree[0].children!;
      expect(children[0].name).toBe('a-dir');
      expect(children[1].name).toBe('z-file.ts');
    });
  });

  describe('deleteFileNode', () => {
    it('should delete a file node', () => {
      store.getState().setFileTree([
        { name: 'src', path: '/src', type: 'directory', children: [
          { name: 'index.ts', path: '/src/index.ts', type: 'file' },
        ]},
      ]);

      store.getState().deleteFileNode('/src/index.ts');
      expect(store.getState().fileTree[0].children).toHaveLength(0);
    });

    it('should delete a directory node', () => {
      store.getState().setFileTree([
        { name: 'src', path: '/src', type: 'directory', children: [] },
        { name: 'lib', path: '/lib', type: 'directory', children: [] },
      ]);

      store.getState().deleteFileNode('/lib');
      expect(store.getState().fileTree).toHaveLength(1);
      expect(store.getState().fileTree[0].name).toBe('src');
    });
  });

  describe('renameFileNode', () => {
    it('should rename a file node', () => {
      store.getState().setFileTree([
        { name: 'old.ts', path: '/old.ts', type: 'file' },
      ]);

      store.getState().renameFileNode('/old.ts', '/new.ts');
      expect(store.getState().fileTree[0].name).toBe('new.ts');
      expect(store.getState().fileTree[0].path).toBe('/new.ts');
    });
  });

  describe('refreshFileTree', () => {
    it('should set loading to true', () => {
      store.getState().refreshFileTree();
      expect(store.getState().isLoading).toBe(true);
    });
  });
});
