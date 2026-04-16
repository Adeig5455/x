// ============================================================================
// Workspace Store Slice - Multi-root workspace management with folder
// operations, trust settings, and workspace configuration
// ============================================================================

import { generateId } from '../../shared/utils';

export type TrustLevel = 'trusted' | 'restricted' | 'untrusted';

export interface WorkspaceFolder {
  id: string;
  path: string;
  name: string;
  color: string;
  isExpanded: boolean;
  isReadOnly: boolean;
  trustLevel: TrustLevel;
  excludePatterns: string[];
  fileCount: number;
  gitBranch?: string;
  gitStatus?: 'clean' | 'dirty' | 'conflict';
}

export interface WorkspaceState {
  folders: WorkspaceFolder[];
  activeFolderId: string | null;
  workspaceName: string;
  workspaceFile: string | null;
  trustEnabled: boolean;
  globalTrustLevel: TrustLevel;
  recentWorkspaces: Array<{ name: string; path: string; lastOpened: number }>;
}

export interface WorkspaceSlice extends WorkspaceState {
  addFolder: (path: string, name: string) => string;
  removeFolder: (id: string) => void;
  setActiveFolder: (id: string) => void;
  updateFolder: (id: string, updates: Partial<WorkspaceFolder>) => void;
  reorderFolders: (fromIndex: number, toIndex: number) => void;
  setFolderColor: (id: string, color: string) => void;
  toggleFolderExpand: (id: string) => void;
  setTrustLevel: (id: string, level: TrustLevel) => void;
  setGlobalTrust: (level: TrustLevel) => void;
  toggleTrustEnabled: () => void;
  setWorkspaceName: (name: string) => void;
  addRecentWorkspace: (name: string, path: string) => void;
  clearRecentWorkspaces: () => void;
}

export const createWorkspaceSlice = (
  set: (fn: (state: { workspace: WorkspaceSlice }) => Partial<{ workspace: WorkspaceSlice }>) => void,
  _get: () => { workspace: WorkspaceSlice }
): WorkspaceSlice => ({
  folders: [],
  activeFolderId: null,
  workspaceName: 'Untitled Workspace',
  workspaceFile: null,
  trustEnabled: true,
  globalTrustLevel: 'trusted',
  recentWorkspaces: [],

  addFolder: (path, name) => {
    const id = generateId();
    const colors = ['#4fc1ff', '#4ec9b0', '#ce9178', '#c586c0', '#dcdcaa', '#9cdcfe'];
    set((state) => {
      const colorIndex = state.workspace.folders.length % colors.length;
      return {
        workspace: {
          ...state.workspace,
          folders: [
            ...state.workspace.folders,
            {
              id,
              path,
              name,
              color: colors[colorIndex],
              isExpanded: true,
              isReadOnly: false,
              trustLevel: state.workspace.globalTrustLevel,
              excludePatterns: ['node_modules', '.git', 'dist'],
              fileCount: 0,
              gitBranch: undefined,
              gitStatus: undefined,
            },
          ],
          activeFolderId: state.workspace.activeFolderId || id,
        },
      };
    });
    return id;
  },

  removeFolder: (id) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        folders: state.workspace.folders.filter((f) => f.id !== id),
        activeFolderId:
          state.workspace.activeFolderId === id
            ? state.workspace.folders.find((f) => f.id !== id)?.id || null
            : state.workspace.activeFolderId,
      },
    }));
  },

  setActiveFolder: (id) => {
    set((state) => ({ workspace: { ...state.workspace, activeFolderId: id } }));
  },

  updateFolder: (id, updates) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        folders: state.workspace.folders.map((f) =>
          f.id === id ? { ...f, ...updates } : f
        ),
      },
    }));
  },

  reorderFolders: (fromIndex, toIndex) => {
    set((state) => {
      const folders = [...state.workspace.folders];
      const [moved] = folders.splice(fromIndex, 1);
      folders.splice(toIndex, 0, moved);
      return { workspace: { ...state.workspace, folders } };
    });
  },

  setFolderColor: (id, color) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        folders: state.workspace.folders.map((f) =>
          f.id === id ? { ...f, color } : f
        ),
      },
    }));
  },

  toggleFolderExpand: (id) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        folders: state.workspace.folders.map((f) =>
          f.id === id ? { ...f, isExpanded: !f.isExpanded } : f
        ),
      },
    }));
  },

  setTrustLevel: (id, level) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        folders: state.workspace.folders.map((f) =>
          f.id === id ? { ...f, trustLevel: level } : f
        ),
      },
    }));
  },

  setGlobalTrust: (level) => {
    set((state) => ({ workspace: { ...state.workspace, globalTrustLevel: level } }));
  },

  toggleTrustEnabled: () => {
    set((state) => ({
      workspace: { ...state.workspace, trustEnabled: !state.workspace.trustEnabled },
    }));
  },

  setWorkspaceName: (name) => {
    set((state) => ({ workspace: { ...state.workspace, workspaceName: name } }));
  },

  addRecentWorkspace: (name, path) => {
    set((state) => ({
      workspace: {
        ...state.workspace,
        recentWorkspaces: [
          { name, path, lastOpened: Date.now() },
          ...state.workspace.recentWorkspaces.filter((w) => w.path !== path),
        ].slice(0, 20),
      },
    }));
  },

  clearRecentWorkspaces: () => {
    set((state) => ({ workspace: { ...state.workspace, recentWorkspaces: [] } }));
  },
});
