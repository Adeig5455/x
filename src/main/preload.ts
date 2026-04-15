import { contextBridge, ipcRenderer } from 'electron';

// ============================================================================
// Electron Preload Script - Secure Bridge between Main and Renderer
// ============================================================================

export interface ElectronAPI {
  invoke: (channel: string, ...args: unknown[]) => Promise<unknown>;
  on: (channel: string, callback: (...args: unknown[]) => void) => () => void;
  once: (channel: string, callback: (...args: unknown[]) => void) => void;
  send: (channel: string, ...args: unknown[]) => void;
  platform: string;
  versions: {
    node: string;
    chrome: string;
    electron: string;
  };
}

// Allowed IPC channels for security
const ALLOWED_INVOKE_CHANNELS = [
  // File operations
  'file:read',
  'file:write',
  'file:list',
  'file:watch',
  'file:unwatch',
  'file:delete',
  'file:rename',
  'file:create',
  'file:stat',
  'file:exists',
  'file:mkdir',
  'file:copy',
  'file:move',
  'file:readBinary',
  'file:writeBinary',
  'file:glob',

  // Terminal operations
  'terminal:create',
  'terminal:write',
  'terminal:resize',
  'terminal:destroy',
  'terminal:list',
  'terminal:getBuffer',

  // Git operations
  'git:status',
  'git:diff',
  'git:commit',
  'git:branch',
  'git:checkout',
  'git:push',
  'git:pull',
  'git:fetch',
  'git:log',
  'git:blame',
  'git:stash',
  'git:stash-pop',
  'git:stash-list',
  'git:merge',
  'git:rebase',
  'git:remote-url',
  'git:ahead-behind',
  'git:stage',
  'git:stage-all',
  'git:unstage',
  'git:unstage-all',
  'git:create-branch',
  'git:delete-branch',
  'git:is-repo',
  'git:branches',

  // Dialog operations
  'dialog:open-folder',
  'dialog:open-file',
  'dialog:save-file',
  'dialog:message-box',

  // Window operations
  'window:minimize',
  'window:maximize',
  'window:close',
  'window:is-maximized',
  'window:is-fullscreen',
  'window:toggle-fullscreen',
  'window:set-title',

  // App operations
  'app:get-path',
  'app:get-version',
  'app:get-locale',
  'app:open-external',
  'app:show-item-in-folder',

  // Clipboard operations
  'clipboard:read',
  'clipboard:write',
  'clipboard:read-html',
  'clipboard:write-html',

  // Shell operations
  'shell:open-external',
  'shell:open-path',

  // Extension operations
  'extension:list',
  'extension:install',
  'extension:uninstall',
  'extension:enable',
  'extension:disable',
  'extension:get-config',

  // Search operations
  'search:in-files',
  'search:replace-in-files',
] as const;

const ALLOWED_EVENT_CHANNELS = [
  'file:changed',
  'file:created',
  'file:deleted',
  'file:renamed',
  'terminal:data',
  'terminal:exit',
  'git:status-changed',
  'window:focus',
  'window:blur',
  'window:maximize-change',
  'app:before-quit',
  'app:second-instance',
  'menu:command',
  'extension:event',
  'update:available',
  'update:downloaded',
  'update:progress',
] as const;

type AllowedInvokeChannel = (typeof ALLOWED_INVOKE_CHANNELS)[number];
type AllowedEventChannel = (typeof ALLOWED_EVENT_CHANNELS)[number];

function isAllowedInvokeChannel(channel: string): channel is AllowedInvokeChannel {
  return (ALLOWED_INVOKE_CHANNELS as readonly string[]).includes(channel);
}

function isAllowedEventChannel(channel: string): channel is AllowedEventChannel {
  return (ALLOWED_EVENT_CHANNELS as readonly string[]).includes(channel);
}

// Expose protected APIs to the renderer process
contextBridge.exposeInMainWorld('electron', {
  invoke: (channel: string, ...args: unknown[]): Promise<unknown> => {
    if (!isAllowedInvokeChannel(channel)) {
      return Promise.reject(new Error(`IPC channel "${channel}" is not allowed`));
    }
    return ipcRenderer.invoke(channel, ...args);
  },

  on: (channel: string, callback: (...args: unknown[]) => void): (() => void) => {
    if (!isAllowedEventChannel(channel)) {
      console.warn(`IPC event channel "${channel}" is not allowed`);
      return () => {};
    }
    const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => {
      ipcRenderer.removeListener(channel, handler);
    };
  },

  once: (channel: string, callback: (...args: unknown[]) => void): void => {
    if (!isAllowedEventChannel(channel)) {
      console.warn(`IPC event channel "${channel}" is not allowed`);
      return;
    }
    ipcRenderer.once(channel, (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
      callback(...args)
    );
  },

  send: (channel: string, ...args: unknown[]): void => {
    if (!isAllowedInvokeChannel(channel)) {
      console.warn(`IPC channel "${channel}" is not allowed`);
      return;
    }
    ipcRenderer.send(channel, ...args);
  },

  platform: process.platform,

  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
} satisfies ElectronAPI);

// Type declaration for renderer process
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
