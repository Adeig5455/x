// Core application types

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  isExpanded?: boolean;
}

export interface EditorTab {
  id: string;
  filePath: string;
  fileName: string;
  language: string;
  content: string;
  isDirty: boolean;
  isActive: boolean;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  codeBlocks?: CodeBlock[];
}

export interface CodeBlock {
  language: string;
  code: string;
  filePath?: string;
  startLine?: number;
  endLine?: number;
}

export interface AICompletionSuggestion {
  text: string;
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  confidence: number;
}

export interface SearchResult {
  filePath: string;
  lineNumber: number;
  lineContent: string;
  matchStart: number;
  matchEnd: number;
}

export interface GitFileStatus {
  path: string;
  status: 'modified' | 'added' | 'deleted' | 'untracked' | 'renamed' | 'conflicted';
  staged: boolean;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
}

export interface KeyBinding {
  id: string;
  key: string;
  command: string;
  when?: string;
}

export interface AppSettings {
  theme: 'dark' | 'light';
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  breadcrumbs: boolean;
  aiModel: string;
  aiApiKey: string;
  autoComplete: boolean;
  terminalFontSize: number;
}

export interface PanelConfig {
  id: string;
  title: string;
  icon: string;
  isVisible: boolean;
  position: 'left' | 'right' | 'bottom';
  width?: number;
  height?: number;
}

export type SidebarPanel = 'explorer' | 'search' | 'git' | 'extensions' | 'ai-chat';
export type BottomPanel = 'terminal' | 'output' | 'problems';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: number;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  type: 'file' | 'folder' | 'symbol';
}

// IPC Channel names
export const IPC_CHANNELS = {
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',
  FILE_LIST: 'file:list',
  FILE_WATCH: 'file:watch',
  FILE_UNWATCH: 'file:unwatch',
  FILE_DELETE: 'file:delete',
  FILE_RENAME: 'file:rename',
  FILE_CREATE: 'file:create',
  TERMINAL_CREATE: 'terminal:create',
  TERMINAL_WRITE: 'terminal:write',
  TERMINAL_RESIZE: 'terminal:resize',
  TERMINAL_DESTROY: 'terminal:destroy',
  GIT_STATUS: 'git:status',
  GIT_DIFF: 'git:diff',
  GIT_COMMIT: 'git:commit',
  GIT_BRANCH: 'git:branch',
  GIT_CHECKOUT: 'git:checkout',
  GIT_PUSH: 'git:push',
  GIT_PULL: 'git:pull',
  DIALOG_OPEN_FOLDER: 'dialog:open-folder',
  DIALOG_SAVE_FILE: 'dialog:save-file',
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  APP_GET_PATH: 'app:get-path',
} as const;
