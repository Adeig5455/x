import type { GitFileStatus, GitBranch } from '../../shared/types';

export interface GitState {
  gitFiles: GitFileStatus[];
  gitBranches: GitBranch[];
  currentBranch: string;
  remoteUrl: string | null;
  isGitRepo: boolean;
  isSyncing: boolean;
  commitMessage: string;
  stagedCount: number;
  unstagedCount: number;
  conflictCount: number;
  aheadCount: number;
  behindCount: number;
  stashCount: number;
  lastFetchTime: number | null;
}

export interface GitSlice extends GitState {
  setGitFiles: (files: GitFileStatus[]) => void;
  setGitBranches: (branches: GitBranch[]) => void;
  setCurrentBranch: (branch: string) => void;
  setRemoteUrl: (url: string | null) => void;
  setIsGitRepo: (isRepo: boolean) => void;
  setIsSyncing: (syncing: boolean) => void;
  setCommitMessage: (message: string) => void;
  stageFile: (path: string) => void;
  unstageFile: (path: string) => void;
  stageAll: () => void;
  unstageAll: () => void;
  setSyncCounts: (ahead: number, behind: number) => void;
  setStashCount: (count: number) => void;
  setLastFetchTime: (time: number) => void;
  refreshGitStatus: () => void;
}

export const createGitSlice = (
  set: (fn: (state: { git: GitSlice }) => Partial<{ git: GitSlice }>) => void,
  _get: () => { git: GitSlice }
): GitSlice => ({
  gitFiles: [],
  gitBranches: [],
  currentBranch: 'main',
  remoteUrl: null,
  isGitRepo: false,
  isSyncing: false,
  commitMessage: '',
  stagedCount: 0,
  unstagedCount: 0,
  conflictCount: 0,
  aheadCount: 0,
  behindCount: 0,
  stashCount: 0,
  lastFetchTime: null,

  setGitFiles: (files) => {
    const stagedCount = files.filter((f) => f.staged).length;
    const unstagedCount = files.filter((f) => !f.staged).length;
    const conflictCount = files.filter((f) => f.status === 'conflicted').length;
    set((state) => ({
      git: { ...state.git, gitFiles: files, stagedCount, unstagedCount, conflictCount },
    }));
  },

  setGitBranches: (branches) => {
    set((state) => ({ git: { ...state.git, gitBranches: branches } }));
  },

  setCurrentBranch: (branch) => {
    set((state) => ({ git: { ...state.git, currentBranch: branch } }));
  },

  setRemoteUrl: (url) => {
    set((state) => ({ git: { ...state.git, remoteUrl: url } }));
  },

  setIsGitRepo: (isRepo) => {
    set((state) => ({ git: { ...state.git, isGitRepo: isRepo } }));
  },

  setIsSyncing: (syncing) => {
    set((state) => ({ git: { ...state.git, isSyncing: syncing } }));
  },

  setCommitMessage: (message) => {
    set((state) => ({ git: { ...state.git, commitMessage: message } }));
  },

  stageFile: (path) => {
    set((state) => {
      const gitFiles = state.git.gitFiles.map((f) =>
        f.path === path ? { ...f, staged: true } : f
      );
      const stagedCount = gitFiles.filter((f) => f.staged).length;
      const unstagedCount = gitFiles.filter((f) => !f.staged).length;
      return { git: { ...state.git, gitFiles, stagedCount, unstagedCount } };
    });
  },

  unstageFile: (path) => {
    set((state) => {
      const gitFiles = state.git.gitFiles.map((f) =>
        f.path === path ? { ...f, staged: false } : f
      );
      const stagedCount = gitFiles.filter((f) => f.staged).length;
      const unstagedCount = gitFiles.filter((f) => !f.staged).length;
      return { git: { ...state.git, gitFiles, stagedCount, unstagedCount } };
    });
  },

  stageAll: () => {
    set((state) => {
      const gitFiles = state.git.gitFiles.map((f) => ({ ...f, staged: true }));
      return {
        git: {
          ...state.git,
          gitFiles,
          stagedCount: gitFiles.length,
          unstagedCount: 0,
        },
      };
    });
  },

  unstageAll: () => {
    set((state) => {
      const gitFiles = state.git.gitFiles.map((f) => ({ ...f, staged: false }));
      return {
        git: {
          ...state.git,
          gitFiles,
          stagedCount: 0,
          unstagedCount: gitFiles.length,
        },
      };
    });
  },

  setSyncCounts: (ahead, behind) => {
    set((state) => ({ git: { ...state.git, aheadCount: ahead, behindCount: behind } }));
  },

  setStashCount: (count) => {
    set((state) => ({ git: { ...state.git, stashCount: count } }));
  },

  setLastFetchTime: (time) => {
    set((state) => ({ git: { ...state.git, lastFetchTime: time } }));
  },

  refreshGitStatus: () => {
    // Trigger git status refresh via IPC
    set((state) => ({ git: { ...state.git, isSyncing: true } }));
  },
});
