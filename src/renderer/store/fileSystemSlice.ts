import type { FileNode } from '../../shared/types';

export interface FileSystemState {
  fileTree: FileNode[];
  projectPath: string | null;
  projectName: string | null;
  expandedDirs: Set<string>;
  selectedPath: string | null;
  recentPaths: string[];
  isLoading: boolean;
}

export interface FileSystemSlice extends Omit<FileSystemState, 'expandedDirs'> {
  expandedDirs: string[];
  setFileTree: (tree: FileNode[]) => void;
  setProjectPath: (path: string | null) => void;
  toggleDirExpanded: (path: string) => void;
  expandDir: (path: string) => void;
  collapseDir: (path: string) => void;
  collapseAll: () => void;
  setSelectedPath: (path: string | null) => void;
  addRecentPath: (path: string) => void;
  setLoading: (loading: boolean) => void;
  refreshFileTree: () => void;
  createFileNode: (parentPath: string, name: string, type: 'file' | 'directory') => void;
  deleteFileNode: (path: string) => void;
  renameFileNode: (oldPath: string, newPath: string) => void;
}

export const createFileSystemSlice = (
  set: (fn: (state: { fileSystem: FileSystemSlice }) => Partial<{ fileSystem: FileSystemSlice }>) => void,
  _get: () => { fileSystem: FileSystemSlice }
): FileSystemSlice => ({
  fileTree: [],
  projectPath: null,
  projectName: null,
  expandedDirs: [],
  selectedPath: null,
  recentPaths: [],
  isLoading: false,

  setFileTree: (tree) => {
    set((state) => ({
      fileSystem: { ...state.fileSystem, fileTree: tree },
    }));
  },

  setProjectPath: (path) => {
    set((state) => ({
      fileSystem: {
        ...state.fileSystem,
        projectPath: path,
        projectName: path ? path.split('/').pop() || path : null,
      },
    }));
  },

  toggleDirExpanded: (path) => {
    set((state) => {
      const expanded = new Set(state.fileSystem.expandedDirs);
      if (expanded.has(path)) {
        expanded.delete(path);
      } else {
        expanded.add(path);
      }
      return { fileSystem: { ...state.fileSystem, expandedDirs: Array.from(expanded) } };
    });
  },

  expandDir: (path) => {
    set((state) => {
      const expanded = new Set(state.fileSystem.expandedDirs);
      expanded.add(path);
      return { fileSystem: { ...state.fileSystem, expandedDirs: Array.from(expanded) } };
    });
  },

  collapseDir: (path) => {
    set((state) => {
      const expanded = new Set(state.fileSystem.expandedDirs);
      expanded.delete(path);
      return { fileSystem: { ...state.fileSystem, expandedDirs: Array.from(expanded) } };
    });
  },

  collapseAll: () => {
    set((state) => ({
      fileSystem: { ...state.fileSystem, expandedDirs: [] },
    }));
  },

  setSelectedPath: (path) => {
    set((state) => ({
      fileSystem: { ...state.fileSystem, selectedPath: path },
    }));
  },

  addRecentPath: (path) => {
    set((state) => {
      const recentPaths = [path, ...state.fileSystem.recentPaths.filter((p) => p !== path)].slice(0, 20);
      return { fileSystem: { ...state.fileSystem, recentPaths } };
    });
  },

  setLoading: (loading) => {
    set((state) => ({
      fileSystem: { ...state.fileSystem, isLoading: loading },
    }));
  },

  refreshFileTree: () => {
    // Trigger re-fetch of file tree via IPC
    set((state) => ({
      fileSystem: { ...state.fileSystem, isLoading: true },
    }));
  },

  createFileNode: (parentPath, name, type) => {
    set((state) => {
      const newNode: FileNode = {
        name,
        path: `${parentPath}/${name}`,
        type,
        children: type === 'directory' ? [] : undefined,
        isExpanded: false,
      };

      const insertNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === parentPath && node.type === 'directory') {
            const children = [...(node.children || []), newNode];
            children.sort((a, b) => {
              if (a.type === b.type) return a.name.localeCompare(b.name);
              return a.type === 'directory' ? -1 : 1;
            });
            return { ...node, children };
          }
          if (node.children) {
            return { ...node, children: insertNode(node.children) };
          }
          return node;
        });
      };

      return { fileSystem: { ...state.fileSystem, fileTree: insertNode(state.fileSystem.fileTree) } };
    });
  },

  deleteFileNode: (path) => {
    set((state) => {
      const removeNode = (nodes: FileNode[]): FileNode[] => {
        return nodes
          .filter((node) => node.path !== path)
          .map((node) => ({
            ...node,
            children: node.children ? removeNode(node.children) : undefined,
          }));
      };

      return { fileSystem: { ...state.fileSystem, fileTree: removeNode(state.fileSystem.fileTree) } };
    });
  },

  renameFileNode: (oldPath, newPath) => {
    set((state) => {
      const newName = newPath.split('/').pop() || newPath;

      const renameNode = (nodes: FileNode[]): FileNode[] => {
        return nodes.map((node) => {
          if (node.path === oldPath) {
            return { ...node, path: newPath, name: newName };
          }
          if (node.children) {
            return { ...node, children: renameNode(node.children) };
          }
          return node;
        });
      };

      return { fileSystem: { ...state.fileSystem, fileTree: renameNode(state.fileSystem.fileTree) } };
    });
  },
});
