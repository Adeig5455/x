// ============================================================================
// File Watcher Service - File system event monitoring with debouncing,
// glob pattern matching, recursive watching, and event aggregation
// ============================================================================

export type FileChangeType = 'created' | 'modified' | 'deleted' | 'renamed';

export interface FileChangeEvent {
  type: FileChangeType;
  path: string;
  oldPath?: string; // for renames
  timestamp: number;
  isDirectory: boolean;
  size?: number;
}

export interface FileWatcherOptions {
  recursive: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  debounceMs?: number;
  maxBatchSize?: number;
  usePolling?: boolean;
  pollingIntervalMs?: number;
  ignoreInitialEvents?: boolean;
  followSymlinks?: boolean;
}

export type FileWatcherCallback = (events: FileChangeEvent[]) => void;

interface WatcherSubscription {
  id: string;
  pattern: string;
  callback: FileWatcherCallback;
  options: FileWatcherOptions;
}

const DEFAULT_EXCLUDE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/build/**',
  '**/.cache/**',
  '**/coverage/**',
  '**/__pycache__/**',
  '**/*.pyc',
  '**/target/**',
  '**/.DS_Store',
  '**/Thumbs.db',
];

/**
 * Converts a glob pattern to a regular expression
 */
export function globToRegex(pattern: string): RegExp {
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '<<<GLOBSTAR_SLASH>>>')
    .replace(/\*\*/g, '<<<GLOBSTAR>>>')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/<<<GLOBSTAR_SLASH>>>/g, '(.+/)?')
    .replace(/<<<GLOBSTAR>>>/g, '.*');
  
  return new RegExp(`^${regexStr}$`);
}

/**
 * Tests if a path matches any of the given glob patterns
 */
export function matchesPattern(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => globToRegex(pattern).test(path));
}

/**
 * Debounce utility for batching file change events
 */
function createDebouncer<T>(callback: (items: T[]) => void, delayMs: number, maxBatchSize: number) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let batch: T[] = [];

  return {
    add(item: T) {
      batch.push(item);
      
      // Flush if batch is full
      if (batch.length >= maxBatchSize) {
        this.flush();
        return;
      }

      // Reset timer
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => this.flush(), delayMs);
    },

    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (batch.length > 0) {
        const events = [...batch];
        batch = [];
        callback(events);
      }
    },

    cancel() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      batch = [];
    },
  };
}

/**
 * Deduplicates file change events, keeping only the latest event per path
 */
export function deduplicateEvents(events: FileChangeEvent[]): FileChangeEvent[] {
  const map = new Map<string, FileChangeEvent>();
  
  for (const event of events) {
    const existing = map.get(event.path);
    
    if (!existing) {
      map.set(event.path, event);
      continue;
    }

    // Merge events intelligently
    if (existing.type === 'created' && event.type === 'deleted') {
      // Created then deleted = no net change
      map.delete(event.path);
    } else if (existing.type === 'created' && event.type === 'modified') {
      // Created then modified = still just created
      map.set(event.path, { ...event, type: 'created' });
    } else if (existing.type === 'modified' && event.type === 'deleted') {
      // Modified then deleted = just deleted
      map.set(event.path, event);
    } else {
      // Keep the latest event
      map.set(event.path, event);
    }
  }

  return Array.from(map.values());
}

/**
 * Aggregates events into a summary
 */
export function aggregateEvents(events: FileChangeEvent[]): {
  created: number;
  modified: number;
  deleted: number;
  renamed: number;
  total: number;
  affectedPaths: string[];
} {
  const summary = { created: 0, modified: 0, deleted: 0, renamed: 0, total: events.length, affectedPaths: [] as string[] };
  
  for (const event of events) {
    summary[event.type]++;
    if (!summary.affectedPaths.includes(event.path)) {
      summary.affectedPaths.push(event.path);
    }
  }

  return summary;
}

/**
 * FileWatcher class - manages file system watchers with debouncing and filtering
 */
export class FileWatcher {
  private subscriptions: Map<string, WatcherSubscription> = new Map();
  private debouncers: Map<string, ReturnType<typeof createDebouncer>> = new Map();
  private isRunning = false;
  private nextId = 0;
  private globalExcludePatterns: string[];

  constructor(excludePatterns?: string[]) {
    this.globalExcludePatterns = excludePatterns || DEFAULT_EXCLUDE_PATTERNS;
  }

  /**
   * Watch a path for changes
   */
  watch(
    pattern: string,
    callback: FileWatcherCallback,
    options: Partial<FileWatcherOptions> = {}
  ): string {
    const id = `watcher-${this.nextId++}`;
    const fullOptions: FileWatcherOptions = {
      recursive: true,
      debounceMs: 250,
      maxBatchSize: 100,
      usePolling: false,
      pollingIntervalMs: 1000,
      ignoreInitialEvents: true,
      followSymlinks: false,
      ...options,
      excludePatterns: [
        ...this.globalExcludePatterns,
        ...(options.excludePatterns || []),
      ],
    };

    const debouncer = createDebouncer<FileChangeEvent>(
      (events) => {
        // Deduplicate and filter events
        const deduped = deduplicateEvents(events);
        const filtered = deduped.filter((event) => {
          // Check exclude patterns
          if (fullOptions.excludePatterns && matchesPattern(event.path, fullOptions.excludePatterns)) {
            return false;
          }
          // Check include patterns
          if (fullOptions.includePatterns && !matchesPattern(event.path, fullOptions.includePatterns)) {
            return false;
          }
          return true;
        });

        if (filtered.length > 0) {
          callback(filtered);
        }
      },
      fullOptions.debounceMs!,
      fullOptions.maxBatchSize!
    );

    this.subscriptions.set(id, { id, pattern, callback, options: fullOptions });
    this.debouncers.set(id, debouncer);

    if (!this.isRunning) {
      this.start();
    }

    return id;
  }

  /**
   * Stop watching a specific subscription
   */
  unwatch(id: string): void {
    const debouncer = this.debouncers.get(id);
    if (debouncer) {
      debouncer.flush();
      debouncer.cancel();
    }
    this.subscriptions.delete(id);
    this.debouncers.delete(id);

    if (this.subscriptions.size === 0) {
      this.stop();
    }
  }

  /**
   * Emit a file change event to all matching watchers
   */
  emit(event: FileChangeEvent): void {
    for (const [id, subscription] of this.subscriptions) {
      const debouncer = this.debouncers.get(id);
      if (debouncer) {
        // Check if event path matches the watcher pattern
        if (matchesPattern(event.path, [subscription.pattern]) || subscription.pattern === '**') {
          debouncer.add(event);
        }
      }
    }
  }

  /**
   * Emit multiple events at once
   */
  emitBatch(events: FileChangeEvent[]): void {
    for (const event of events) {
      this.emit(event);
    }
  }

  /**
   * Flush all pending events
   */
  flush(): void {
    for (const debouncer of this.debouncers.values()) {
      debouncer.flush();
    }
  }

  /**
   * Start the file watcher
   */
  private start(): void {
    this.isRunning = true;
  }

  /**
   * Stop the file watcher
   */
  private stop(): void {
    this.isRunning = false;
  }

  /**
   * Dispose all watchers
   */
  dispose(): void {
    this.flush();
    for (const debouncer of this.debouncers.values()) {
      debouncer.cancel();
    }
    this.subscriptions.clear();
    this.debouncers.clear();
    this.stop();
  }

  /**
   * Get all active watcher IDs
   */
  getWatchers(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get watcher count
   */
  get watcherCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Check if running
   */
  get running(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let instance: FileWatcher | null = null;

export function getFileWatcher(): FileWatcher {
  if (!instance) {
    instance = new FileWatcher();
  }
  return instance;
}

export function resetFileWatcher(): void {
  if (instance) {
    instance.dispose();
    instance = null;
  }
}
