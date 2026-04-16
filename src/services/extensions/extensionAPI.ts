export interface ExtensionManifest {
  id: string;
  name: string;
  version: string;
  displayName: string;
  description: string;
  publisher: string;
  categories: string[];
  activationEvents: string[];
  contributes?: {
    commands?: Array<{ command: string; title: string; category?: string }>;
    keybindings?: Array<{ command: string; key: string; when?: string }>;
    themes?: Array<{ id: string; label: string; uiTheme: 'vs-dark' | 'vs' }>;
    languages?: Array<{ id: string; extensions: string[]; aliases?: string[] }>;
    menus?: Record<string, Array<{ command: string; when?: string; group?: string }>>;
    configuration?: {
      title: string;
      properties: Record<string, {
        type: string;
        default?: unknown;
        description?: string;
        enum?: string[];
      }>;
    };
  };
}

export interface ExtensionContext {
  extensionId: string;
  extensionPath: string;
  subscriptions: Array<{ dispose: () => void }>;
  globalState: StateStorage;
  workspaceState: StateStorage;
}

export interface StateStorage {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: unknown): void;
  keys(): string[];
}

export interface ExtensionAPI {
  commands: {
    registerCommand: (id: string, handler: (...args: unknown[]) => unknown) => { dispose: () => void };
    executeCommand: (id: string, ...args: unknown[]) => Promise<unknown>;
    getCommands: () => string[];
  };
  window: {
    showInformationMessage: (message: string, ...items: string[]) => Promise<string | undefined>;
    showWarningMessage: (message: string, ...items: string[]) => Promise<string | undefined>;
    showErrorMessage: (message: string, ...items: string[]) => Promise<string | undefined>;
    showInputBox: (options: { prompt: string; value?: string; placeHolder?: string }) => Promise<string | undefined>;
    showQuickPick: (items: string[], options?: { placeHolder?: string; canPickMany?: boolean }) => Promise<string | undefined>;
    createOutputChannel: (name: string) => OutputChannel;
    createStatusBarItem: (alignment: 'left' | 'right', priority?: number) => StatusBarItem;
    withProgress: <T>(options: { title: string; cancellable?: boolean }, task: (progress: Progress) => Promise<T>) => Promise<T>;
  };
  workspace: {
    getConfiguration: (section?: string) => ConfigurationProxy;
    onDidChangeConfiguration: (listener: (e: { affectsConfiguration: (section: string) => boolean }) => void) => { dispose: () => void };
    rootPath: string | undefined;
    workspaceFolders: Array<{ uri: string; name: string; index: number }> | undefined;
    findFiles: (include: string, exclude?: string, maxResults?: number) => Promise<string[]>;
  };
  languages: {
    registerCompletionItemProvider: (selector: string, provider: CompletionProvider) => { dispose: () => void };
    registerHoverProvider: (selector: string, provider: HoverProvider) => { dispose: () => void };
    registerDefinitionProvider: (selector: string, provider: DefinitionProvider) => { dispose: () => void };
  };
}

export interface OutputChannel {
  name: string;
  append: (value: string) => void;
  appendLine: (value: string) => void;
  clear: () => void;
  show: () => void;
  hide: () => void;
  dispose: () => void;
}

export interface StatusBarItem {
  text: string;
  tooltip: string;
  command: string | undefined;
  color: string | undefined;
  backgroundColor: string | undefined;
  show: () => void;
  hide: () => void;
  dispose: () => void;
}

export interface Progress {
  report: (value: { message?: string; increment?: number }) => void;
}

export interface ConfigurationProxy {
  get<T>(key: string, defaultValue?: T): T | undefined;
  update(key: string, value: unknown): void;
  has(key: string): boolean;
}

export interface CompletionProvider {
  provideCompletionItems: (
    document: { uri: string; getText: () => string; lineAt: (line: number) => { text: string } },
    position: { line: number; character: number }
  ) => Array<{ label: string; kind: number; detail?: string; insertText?: string; documentation?: string }>;
}

export interface HoverProvider {
  provideHover: (
    document: { uri: string; getText: () => string },
    position: { line: number; character: number }
  ) => { contents: string[] } | null;
}

export interface DefinitionProvider {
  provideDefinition: (
    document: { uri: string; getText: () => string },
    position: { line: number; character: number }
  ) => { uri: string; range: { start: { line: number; character: number }; end: { line: number; character: number } } } | null;
}

// Extension host manages loaded extensions
export class ExtensionHost {
  private extensions: Map<string, { manifest: ExtensionManifest; context: ExtensionContext; active: boolean }> = new Map();
  private commandHandlers: Map<string, (...args: unknown[]) => unknown> = new Map();
  private outputChannels: Map<string, OutputChannel> = new Map();
  private statusBarItems: StatusBarItem[] = [];
  private configListeners: Array<(e: { affectsConfiguration: (section: string) => boolean }) => void> = [];

  registerExtension(manifest: ExtensionManifest): ExtensionContext {
    const context: ExtensionContext = {
      extensionId: manifest.id,
      extensionPath: `/extensions/${manifest.id}`,
      subscriptions: [],
      globalState: this.createStateStorage(`global-${manifest.id}`),
      workspaceState: this.createStateStorage(`workspace-${manifest.id}`),
    };

    this.extensions.set(manifest.id, { manifest, context, active: false });

    // Register contributed commands
    if (manifest.contributes?.commands) {
      for (const cmd of manifest.contributes.commands) {
        // Commands will be registered when extension activates
      }
    }

    return context;
  }

  activateExtension(extensionId: string): void {
    const ext = this.extensions.get(extensionId);
    if (ext) {
      ext.active = true;
    }
  }

  deactivateExtension(extensionId: string): void {
    const ext = this.extensions.get(extensionId);
    if (ext) {
      ext.active = false;
      // Dispose all subscriptions
      for (const sub of ext.context.subscriptions) {
        sub.dispose();
      }
      ext.context.subscriptions = [];
    }
  }

  getAPI(): ExtensionAPI {
    return {
      commands: {
        registerCommand: (id, handler) => {
          this.commandHandlers.set(id, handler);
          return {
            dispose: () => this.commandHandlers.delete(id),
          };
        },
        executeCommand: async (id, ...args) => {
          const handler = this.commandHandlers.get(id);
          if (handler) return handler(...args);
          throw new Error(`Command not found: ${id}`);
        },
        getCommands: () => Array.from(this.commandHandlers.keys()),
      },
      window: {
        showInformationMessage: async (message) => {
          console.log(`[INFO] ${message}`);
          return undefined;
        },
        showWarningMessage: async (message) => {
          console.warn(`[WARN] ${message}`);
          return undefined;
        },
        showErrorMessage: async (message) => {
          console.error(`[ERROR] ${message}`);
          return undefined;
        },
        showInputBox: async () => undefined,
        showQuickPick: async () => undefined,
        createOutputChannel: (name) => {
          const channel: OutputChannel = {
            name,
            append: (value) => console.log(`[${name}] ${value}`),
            appendLine: (value) => console.log(`[${name}] ${value}`),
            clear: () => {},
            show: () => {},
            hide: () => {},
            dispose: () => this.outputChannels.delete(name),
          };
          this.outputChannels.set(name, channel);
          return channel;
        },
        createStatusBarItem: (alignment, priority = 0) => {
          const item: StatusBarItem = {
            text: '',
            tooltip: '',
            command: undefined,
            color: undefined,
            backgroundColor: undefined,
            show: () => {},
            hide: () => {},
            dispose: () => {
              const idx = this.statusBarItems.indexOf(item);
              if (idx !== -1) this.statusBarItems.splice(idx, 1);
            },
          };
          this.statusBarItems.push(item);
          return item;
        },
        withProgress: async (_options, task) => {
          const progress: Progress = {
            report: () => {},
          };
          return task(progress);
        },
      },
      workspace: {
        getConfiguration: (section) => ({
          get: <T>(key: string, defaultValue?: T) => defaultValue,
          update: () => {},
          has: () => false,
        }),
        onDidChangeConfiguration: (listener) => {
          this.configListeners.push(listener);
          return {
            dispose: () => {
              this.configListeners = this.configListeners.filter((l) => l !== listener);
            },
          };
        },
        rootPath: undefined,
        workspaceFolders: undefined,
        findFiles: async () => [],
      },
      languages: {
        registerCompletionItemProvider: (_selector, _provider) => ({
          dispose: () => {},
        }),
        registerHoverProvider: (_selector, _provider) => ({
          dispose: () => {},
        }),
        registerDefinitionProvider: (_selector, _provider) => ({
          dispose: () => {},
        }),
      },
    };
  }

  private createStateStorage(prefix: string): StateStorage {
    const store = new Map<string, unknown>();
    return {
      get: <T>(key: string, defaultValue?: T) => (store.get(`${prefix}:${key}`) as T) ?? defaultValue,
      update: (key, value) => store.set(`${prefix}:${key}`, value),
      keys: () => {
        const keys: string[] = [];
        for (const k of store.keys()) {
          if (k.startsWith(`${prefix}:`)) {
            keys.push(k.slice(prefix.length + 1));
          }
        }
        return keys;
      },
    };
  }

  getExtensions(): Array<{ id: string; manifest: ExtensionManifest; active: boolean }> {
    return Array.from(this.extensions.entries()).map(([id, ext]) => ({
      id,
      manifest: ext.manifest,
      active: ext.active,
    }));
  }

  getActiveExtensions(): string[] {
    return Array.from(this.extensions.entries())
      .filter(([, ext]) => ext.active)
      .map(([id]) => id);
  }
}

export const extensionHost = new ExtensionHost();
