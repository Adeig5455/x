import type { GitFileStatus, GitBranch } from '../../shared/types';

export interface GitLogEntry {
  hash: string;
  shortHash: string;
  author: string;
  authorEmail: string;
  date: string;
  message: string;
  refs: string[];
}

export interface GitDiffHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  header: string;
  lines: Array<{
    type: 'context' | 'addition' | 'deletion';
    content: string;
    oldLineNumber?: number;
    newLineNumber?: number;
  }>;
}

export interface GitDiff {
  filePath: string;
  oldPath?: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'copied';
  hunks: GitDiffHunk[];
  additions: number;
  deletions: number;
  isBinary: boolean;
}

export interface GitStashEntry {
  index: number;
  message: string;
  date: string;
}

// Service interface - implementations differ between main (uses simple-git) and renderer (uses IPC)
export interface IGitService {
  isGitRepo(path: string): Promise<boolean>;
  getStatus(path: string): Promise<GitFileStatus[]>;
  getBranches(path: string): Promise<GitBranch[]>;
  getCurrentBranch(path: string): Promise<string>;
  checkout(path: string, branch: string): Promise<void>;
  createBranch(path: string, name: string, startPoint?: string): Promise<void>;
  deleteBranch(path: string, name: string, force?: boolean): Promise<void>;
  stageFile(path: string, filePath: string): Promise<void>;
  stageAll(path: string): Promise<void>;
  unstageFile(path: string, filePath: string): Promise<void>;
  unstageAll(path: string): Promise<void>;
  commit(path: string, message: string): Promise<string>;
  push(path: string, remote?: string, branch?: string): Promise<void>;
  pull(path: string, remote?: string, branch?: string): Promise<void>;
  fetch(path: string, remote?: string): Promise<void>;
  getLog(path: string, maxCount?: number): Promise<GitLogEntry[]>;
  getDiff(path: string, filePath?: string, staged?: boolean): Promise<GitDiff[]>;
  getRemoteUrl(path: string): Promise<string | null>;
  stash(path: string, message?: string): Promise<void>;
  stashPop(path: string, index?: number): Promise<void>;
  stashList(path: string): Promise<GitStashEntry[]>;
  blame(path: string, filePath: string): Promise<Array<{ hash: string; author: string; date: string; line: number; content: string }>>;
  merge(path: string, branch: string): Promise<void>;
  rebase(path: string, branch: string): Promise<void>;
  getAheadBehind(path: string): Promise<{ ahead: number; behind: number }>;
}

// Renderer-side git service using IPC
export class GitServiceIPC implements IGitService {
  private invoke(channel: string, ...args: unknown[]): Promise<unknown> {
    if (typeof window !== 'undefined' && (window as unknown as { electronAPI?: { invoke: (channel: string, ...args: unknown[]) => Promise<unknown> } }).electronAPI) {
      return (window as unknown as { electronAPI: { invoke: (channel: string, ...args: unknown[]) => Promise<unknown> } }).electronAPI.invoke(channel, ...args);
    }
    return Promise.reject(new Error('Electron API not available'));
  }

  async isGitRepo(path: string): Promise<boolean> {
    return this.invoke('git:isRepo', path) as Promise<boolean>;
  }

  async getStatus(path: string): Promise<GitFileStatus[]> {
    return this.invoke('git:status', path) as Promise<GitFileStatus[]>;
  }

  async getBranches(path: string): Promise<GitBranch[]> {
    return this.invoke('git:branches', path) as Promise<GitBranch[]>;
  }

  async getCurrentBranch(path: string): Promise<string> {
    return this.invoke('git:currentBranch', path) as Promise<string>;
  }

  async checkout(path: string, branch: string): Promise<void> {
    await this.invoke('git:checkout', path, branch);
  }

  async createBranch(path: string, name: string, startPoint?: string): Promise<void> {
    await this.invoke('git:createBranch', path, name, startPoint);
  }

  async deleteBranch(path: string, name: string, force?: boolean): Promise<void> {
    await this.invoke('git:deleteBranch', path, name, force);
  }

  async stageFile(path: string, filePath: string): Promise<void> {
    await this.invoke('git:stage', path, filePath);
  }

  async stageAll(path: string): Promise<void> {
    await this.invoke('git:stageAll', path);
  }

  async unstageFile(path: string, filePath: string): Promise<void> {
    await this.invoke('git:unstage', path, filePath);
  }

  async unstageAll(path: string): Promise<void> {
    await this.invoke('git:unstageAll', path);
  }

  async commit(path: string, message: string): Promise<string> {
    return this.invoke('git:commit', path, message) as Promise<string>;
  }

  async push(path: string, remote = 'origin', branch?: string): Promise<void> {
    await this.invoke('git:push', path, remote, branch);
  }

  async pull(path: string, remote = 'origin', branch?: string): Promise<void> {
    await this.invoke('git:pull', path, remote, branch);
  }

  async fetch(path: string, remote = 'origin'): Promise<void> {
    await this.invoke('git:fetch', path, remote);
  }

  async getLog(path: string, maxCount = 50): Promise<GitLogEntry[]> {
    return this.invoke('git:log', path, maxCount) as Promise<GitLogEntry[]>;
  }

  async getDiff(path: string, filePath?: string, staged?: boolean): Promise<GitDiff[]> {
    return this.invoke('git:diff', path, filePath, staged) as Promise<GitDiff[]>;
  }

  async getRemoteUrl(path: string): Promise<string | null> {
    return this.invoke('git:remoteUrl', path) as Promise<string | null>;
  }

  async stash(path: string, message?: string): Promise<void> {
    await this.invoke('git:stash', path, message);
  }

  async stashPop(path: string, index?: number): Promise<void> {
    await this.invoke('git:stashPop', path, index);
  }

  async stashList(path: string): Promise<GitStashEntry[]> {
    return this.invoke('git:stashList', path) as Promise<GitStashEntry[]>;
  }

  async blame(path: string, filePath: string): Promise<Array<{ hash: string; author: string; date: string; line: number; content: string }>> {
    return this.invoke('git:blame', path, filePath) as Promise<Array<{ hash: string; author: string; date: string; line: number; content: string }>>;
  }

  async merge(path: string, branch: string): Promise<void> {
    await this.invoke('git:merge', path, branch);
  }

  async rebase(path: string, branch: string): Promise<void> {
    await this.invoke('git:rebase', path, branch);
  }

  async getAheadBehind(path: string): Promise<{ ahead: number; behind: number }> {
    return this.invoke('git:aheadBehind', path) as Promise<{ ahead: number; behind: number }>;
  }
}

export const gitService = new GitServiceIPC();
