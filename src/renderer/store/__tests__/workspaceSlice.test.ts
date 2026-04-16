import { createWorkspaceSlice, WorkspaceSlice } from '../workspaceSlice';

describe('workspaceSlice', () => {
  let state: { workspace: WorkspaceSlice };

  beforeEach(() => {
    state = { workspace: null as unknown as WorkspaceSlice };
    const set = (fn: (s: { workspace: WorkspaceSlice }) => Partial<{ workspace: WorkspaceSlice }>) => {
      const result = fn(state);
      if (result.workspace) {
        state = { workspace: { ...state.workspace, ...result.workspace } };
      }
    };
    const get = () => state;
    const slice = createWorkspaceSlice(set, get);
    state = { workspace: slice };
  });

  it('should have correct initial state', () => {
    expect(state.workspace.folders).toEqual([]);
    expect(state.workspace.activeFolderId).toBeNull();
    expect(state.workspace.workspaceName).toBe('Untitled Workspace');
    expect(state.workspace.trustEnabled).toBe(true);
    expect(state.workspace.globalTrustLevel).toBe('trusted');
  });

  it('should add a folder', () => {
    const id = state.workspace.addFolder('/home/user/project', 'project');
    expect(id).toBeTruthy();
    expect(state.workspace.folders).toHaveLength(1);
    expect(state.workspace.folders[0].name).toBe('project');
    expect(state.workspace.folders[0].isExpanded).toBe(true);
    expect(state.workspace.activeFolderId).toBe(id);
  });

  it('should assign different colors to folders', () => {
    state.workspace.addFolder('/a', 'A');
    state.workspace.addFolder('/b', 'B');
    expect(state.workspace.folders[0].color).not.toBe(state.workspace.folders[1].color);
  });

  it('should remove a folder', () => {
    const id1 = state.workspace.addFolder('/a', 'A');
    const id2 = state.workspace.addFolder('/b', 'B');
    state.workspace.removeFolder(id1);
    expect(state.workspace.folders).toHaveLength(1);
    expect(state.workspace.folders[0].id).toBe(id2);
    expect(state.workspace.activeFolderId).toBe(id2);
  });

  it('should set active folder', () => {
    state.workspace.addFolder('/a', 'A');
    const id2 = state.workspace.addFolder('/b', 'B');
    state.workspace.setActiveFolder(id2);
    expect(state.workspace.activeFolderId).toBe(id2);
  });

  it('should update folder properties', () => {
    const id = state.workspace.addFolder('/proj', 'proj');
    state.workspace.updateFolder(id, { fileCount: 42, gitBranch: 'main', gitStatus: 'clean' });
    expect(state.workspace.folders[0].fileCount).toBe(42);
    expect(state.workspace.folders[0].gitBranch).toBe('main');
    expect(state.workspace.folders[0].gitStatus).toBe('clean');
  });

  it('should reorder folders', () => {
    state.workspace.addFolder('/a', 'A');
    state.workspace.addFolder('/b', 'B');
    state.workspace.addFolder('/c', 'C');
    state.workspace.reorderFolders(2, 0);
    expect(state.workspace.folders[0].name).toBe('C');
    expect(state.workspace.folders[1].name).toBe('A');
  });

  it('should set folder color', () => {
    const id = state.workspace.addFolder('/proj', 'proj');
    state.workspace.setFolderColor(id, '#ff0000');
    expect(state.workspace.folders[0].color).toBe('#ff0000');
  });

  it('should toggle folder expand', () => {
    const id = state.workspace.addFolder('/proj', 'proj');
    expect(state.workspace.folders[0].isExpanded).toBe(true);
    state.workspace.toggleFolderExpand(id);
    expect(state.workspace.folders[0].isExpanded).toBe(false);
  });

  it('should manage trust levels', () => {
    const id = state.workspace.addFolder('/untrusted', 'untrusted');
    state.workspace.setTrustLevel(id, 'restricted');
    expect(state.workspace.folders[0].trustLevel).toBe('restricted');

    state.workspace.setGlobalTrust('untrusted');
    expect(state.workspace.globalTrustLevel).toBe('untrusted');

    state.workspace.toggleTrustEnabled();
    expect(state.workspace.trustEnabled).toBe(false);
  });

  it('should set workspace name', () => {
    state.workspace.setWorkspaceName('My Project');
    expect(state.workspace.workspaceName).toBe('My Project');
  });

  it('should manage recent workspaces', () => {
    state.workspace.addRecentWorkspace('Project A', '/path/a');
    state.workspace.addRecentWorkspace('Project B', '/path/b');
    expect(state.workspace.recentWorkspaces).toHaveLength(2);
    expect(state.workspace.recentWorkspaces[0].name).toBe('Project B');

    // Re-adding should move to top
    state.workspace.addRecentWorkspace('Project A', '/path/a');
    expect(state.workspace.recentWorkspaces).toHaveLength(2);
    expect(state.workspace.recentWorkspaces[0].name).toBe('Project A');

    state.workspace.clearRecentWorkspaces();
    expect(state.workspace.recentWorkspaces).toHaveLength(0);
  });
});
