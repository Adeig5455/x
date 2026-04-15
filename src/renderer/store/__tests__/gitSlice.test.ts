import { createGitSlice, GitSlice } from '../gitSlice';

function createTestSlice() {
  let state: { git: GitSlice };

  const set = (fn: (s: { git: GitSlice }) => Partial<{ git: GitSlice }>) => {
    const partial = fn(state);
    if (partial.git) {
      state = { git: { ...state.git, ...partial.git } };
    }
  };

  const get = () => state;
  const slice = createGitSlice(set, get);
  state = { git: slice };

  return { getState: () => state.git };
}

describe('GitSlice', () => {
  let store: ReturnType<typeof createTestSlice>;

  beforeEach(() => {
    store = createTestSlice();
  });

  describe('initial state', () => {
    it('should have empty git files', () => {
      expect(store.getState().gitFiles).toEqual([]);
    });

    it('should default to main branch', () => {
      expect(store.getState().currentBranch).toBe('main');
    });

    it('should not be a git repo by default', () => {
      expect(store.getState().isGitRepo).toBe(false);
    });

    it('should have zero counts', () => {
      expect(store.getState().stagedCount).toBe(0);
      expect(store.getState().unstagedCount).toBe(0);
      expect(store.getState().conflictCount).toBe(0);
      expect(store.getState().aheadCount).toBe(0);
      expect(store.getState().behindCount).toBe(0);
      expect(store.getState().stashCount).toBe(0);
    });
  });

  describe('setGitFiles', () => {
    it('should set files and compute counts', () => {
      const files = [
        { path: 'a.ts', status: 'modified' as const, staged: true },
        { path: 'b.ts', status: 'added' as const, staged: false },
        { path: 'c.ts', status: 'conflicted' as const, staged: false },
      ];

      store.getState().setGitFiles(files);
      expect(store.getState().gitFiles).toHaveLength(3);
      expect(store.getState().stagedCount).toBe(1);
      expect(store.getState().unstagedCount).toBe(2);
      expect(store.getState().conflictCount).toBe(1);
    });
  });

  describe('setGitBranches', () => {
    it('should set branches', () => {
      const branches = [
        { name: 'main', isCurrent: true, isRemote: false },
        { name: 'feature/x', isCurrent: false, isRemote: false },
        { name: 'origin/main', isCurrent: false, isRemote: true },
      ];

      store.getState().setGitBranches(branches);
      expect(store.getState().gitBranches).toHaveLength(3);
    });
  });

  describe('setCurrentBranch', () => {
    it('should set current branch', () => {
      store.getState().setCurrentBranch('feature/new');
      expect(store.getState().currentBranch).toBe('feature/new');
    });
  });

  describe('setRemoteUrl', () => {
    it('should set remote URL', () => {
      store.getState().setRemoteUrl('https://github.com/user/repo.git');
      expect(store.getState().remoteUrl).toBe('https://github.com/user/repo.git');
    });

    it('should clear remote URL', () => {
      store.getState().setRemoteUrl('https://github.com/user/repo.git');
      store.getState().setRemoteUrl(null);
      expect(store.getState().remoteUrl).toBeNull();
    });
  });

  describe('staging operations', () => {
    beforeEach(() => {
      store.getState().setGitFiles([
        { path: 'a.ts', status: 'modified' as const, staged: false },
        { path: 'b.ts', status: 'added' as const, staged: false },
        { path: 'c.ts', status: 'deleted' as const, staged: true },
      ]);
    });

    it('should stage a file', () => {
      store.getState().stageFile('a.ts');
      const file = store.getState().gitFiles.find((f) => f.path === 'a.ts');
      expect(file!.staged).toBe(true);
      expect(store.getState().stagedCount).toBe(2);
      expect(store.getState().unstagedCount).toBe(1);
    });

    it('should unstage a file', () => {
      store.getState().unstageFile('c.ts');
      const file = store.getState().gitFiles.find((f) => f.path === 'c.ts');
      expect(file!.staged).toBe(false);
      expect(store.getState().stagedCount).toBe(0);
      expect(store.getState().unstagedCount).toBe(3);
    });

    it('should stage all files', () => {
      store.getState().stageAll();
      expect(store.getState().stagedCount).toBe(3);
      expect(store.getState().unstagedCount).toBe(0);
      store.getState().gitFiles.forEach((f) => expect(f.staged).toBe(true));
    });

    it('should unstage all files', () => {
      store.getState().unstageAll();
      expect(store.getState().stagedCount).toBe(0);
      expect(store.getState().unstagedCount).toBe(3);
      store.getState().gitFiles.forEach((f) => expect(f.staged).toBe(false));
    });
  });

  describe('sync counts', () => {
    it('should set ahead/behind counts', () => {
      store.getState().setSyncCounts(3, 1);
      expect(store.getState().aheadCount).toBe(3);
      expect(store.getState().behindCount).toBe(1);
    });
  });

  describe('stash count', () => {
    it('should set stash count', () => {
      store.getState().setStashCount(5);
      expect(store.getState().stashCount).toBe(5);
    });
  });

  describe('setCommitMessage', () => {
    it('should set commit message', () => {
      store.getState().setCommitMessage('feat: add new feature');
      expect(store.getState().commitMessage).toBe('feat: add new feature');
    });
  });

  describe('setIsGitRepo', () => {
    it('should set git repo flag', () => {
      store.getState().setIsGitRepo(true);
      expect(store.getState().isGitRepo).toBe(true);
    });
  });

  describe('refreshGitStatus', () => {
    it('should set syncing to true', () => {
      store.getState().refreshGitStatus();
      expect(store.getState().isSyncing).toBe(true);
    });
  });

  describe('setLastFetchTime', () => {
    it('should set last fetch time', () => {
      const now = Date.now();
      store.getState().setLastFetchTime(now);
      expect(store.getState().lastFetchTime).toBe(now);
    });
  });
});
