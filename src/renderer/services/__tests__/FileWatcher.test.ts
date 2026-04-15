import {
  FileWatcher,
  globToRegex,
  matchesPattern,
  deduplicateEvents,
  aggregateEvents,
  getFileWatcher,
  resetFileWatcher,
  FileChangeEvent,
} from '../FileWatcher';

describe('FileWatcher', () => {
  afterEach(() => {
    resetFileWatcher();
  });

  describe('globToRegex', () => {
    it('should match simple glob patterns', () => {
      expect(globToRegex('*.ts').test('file.ts')).toBe(true);
      expect(globToRegex('*.ts').test('file.js')).toBe(false);
    });

    it('should match double star patterns', () => {
      expect(globToRegex('**/*.ts').test('src/foo/bar.ts')).toBe(true);
      expect(globToRegex('**/*.ts').test('bar.ts')).toBe(true);
      expect(globToRegex('**/node_modules/**').test('foo/node_modules/bar/baz.js')).toBe(true);
    });

    it('should match question mark wildcard', () => {
      expect(globToRegex('file?.ts').test('file1.ts')).toBe(true);
      expect(globToRegex('file?.ts').test('file12.ts')).toBe(false);
    });

    it('should escape special regex characters', () => {
      expect(globToRegex('file.ts').test('file.ts')).toBe(true);
      expect(globToRegex('file.ts').test('filexts')).toBe(false);
    });
  });

  describe('matchesPattern', () => {
    it('should return true if path matches any pattern', () => {
      expect(matchesPattern('src/foo.ts', ['*.ts', '*.js'])).toBe(false);
      expect(matchesPattern('foo.ts', ['*.ts', '*.js'])).toBe(true);
      expect(matchesPattern('src/foo.ts', ['**/*.ts'])).toBe(true);
    });

    it('should return false if path matches no patterns', () => {
      expect(matchesPattern('foo.py', ['*.ts', '*.js'])).toBe(false);
    });

    it('should match node_modules exclusion', () => {
      expect(matchesPattern('foo/node_modules/bar/baz.js', ['**/node_modules/**'])).toBe(true);
    });
  });

  describe('deduplicateEvents', () => {
    it('should keep latest event per path', () => {
      const events: FileChangeEvent[] = [
        { type: 'modified', path: '/foo.ts', timestamp: 100, isDirectory: false },
        { type: 'modified', path: '/foo.ts', timestamp: 200, isDirectory: false },
      ];
      const result = deduplicateEvents(events);
      expect(result).toHaveLength(1);
      expect(result[0].timestamp).toBe(200);
    });

    it('should cancel out created then deleted', () => {
      const events: FileChangeEvent[] = [
        { type: 'created', path: '/foo.ts', timestamp: 100, isDirectory: false },
        { type: 'deleted', path: '/foo.ts', timestamp: 200, isDirectory: false },
      ];
      const result = deduplicateEvents(events);
      expect(result).toHaveLength(0);
    });

    it('should merge created then modified into created', () => {
      const events: FileChangeEvent[] = [
        { type: 'created', path: '/foo.ts', timestamp: 100, isDirectory: false },
        { type: 'modified', path: '/foo.ts', timestamp: 200, isDirectory: false },
      ];
      const result = deduplicateEvents(events);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('created');
    });

    it('should merge modified then deleted into deleted', () => {
      const events: FileChangeEvent[] = [
        { type: 'modified', path: '/foo.ts', timestamp: 100, isDirectory: false },
        { type: 'deleted', path: '/foo.ts', timestamp: 200, isDirectory: false },
      ];
      const result = deduplicateEvents(events);
      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('deleted');
    });

    it('should handle multiple different paths', () => {
      const events: FileChangeEvent[] = [
        { type: 'modified', path: '/foo.ts', timestamp: 100, isDirectory: false },
        { type: 'created', path: '/bar.ts', timestamp: 200, isDirectory: false },
        { type: 'modified', path: '/foo.ts', timestamp: 300, isDirectory: false },
      ];
      const result = deduplicateEvents(events);
      expect(result).toHaveLength(2);
    });
  });

  describe('aggregateEvents', () => {
    it('should count events by type', () => {
      const events: FileChangeEvent[] = [
        { type: 'created', path: '/a.ts', timestamp: 100, isDirectory: false },
        { type: 'modified', path: '/b.ts', timestamp: 200, isDirectory: false },
        { type: 'deleted', path: '/c.ts', timestamp: 300, isDirectory: false },
        { type: 'renamed', path: '/d.ts', timestamp: 400, isDirectory: false },
        { type: 'modified', path: '/e.ts', timestamp: 500, isDirectory: false },
      ];
      const summary = aggregateEvents(events);
      expect(summary.created).toBe(1);
      expect(summary.modified).toBe(2);
      expect(summary.deleted).toBe(1);
      expect(summary.renamed).toBe(1);
      expect(summary.total).toBe(5);
      expect(summary.affectedPaths).toHaveLength(5);
    });

    it('should handle empty events', () => {
      const summary = aggregateEvents([]);
      expect(summary.total).toBe(0);
      expect(summary.affectedPaths).toHaveLength(0);
    });

    it('should deduplicate affected paths', () => {
      const events: FileChangeEvent[] = [
        { type: 'modified', path: '/a.ts', timestamp: 100, isDirectory: false },
        { type: 'modified', path: '/a.ts', timestamp: 200, isDirectory: false },
      ];
      const summary = aggregateEvents(events);
      expect(summary.affectedPaths).toHaveLength(1);
    });
  });

  describe('FileWatcher class', () => {
    it('should create and dispose watchers', () => {
      const watcher = new FileWatcher();
      const id = watcher.watch('**', () => {});
      expect(watcher.watcherCount).toBe(1);
      expect(watcher.running).toBe(true);
      watcher.unwatch(id);
      expect(watcher.watcherCount).toBe(0);
      watcher.dispose();
    });

    it('should emit events to matching watchers', (done) => {
      const watcher = new FileWatcher([]);
      watcher.watch('**', (events) => {
        expect(events.length).toBeGreaterThan(0);
        expect(events[0].path).toBe('/src/foo.ts');
        watcher.dispose();
        done();
      }, { debounceMs: 10 });

      watcher.emit({
        type: 'modified',
        path: '/src/foo.ts',
        timestamp: Date.now(),
        isDirectory: false,
      });
    });

    it('should filter out excluded patterns', (done) => {
      const watcher = new FileWatcher(['**/node_modules/**']);
      let called = false;
      watcher.watch('**', (events) => {
        called = true;
        // Should not include node_modules files
        expect(events.every((e) => !e.path.includes('node_modules'))).toBe(true);
      }, { debounceMs: 10 });

      watcher.emit({
        type: 'modified',
        path: '/foo/node_modules/bar.js',
        timestamp: Date.now(),
        isDirectory: false,
      });

      setTimeout(() => {
        expect(called).toBe(false);
        watcher.dispose();
        done();
      }, 50);
    });

    it('should batch events with debouncing', (done) => {
      const watcher = new FileWatcher([]);
      let callCount = 0;
      watcher.watch('**', (events) => {
        callCount++;
        // Should receive all events in one batch
        expect(events.length).toBe(3);
        watcher.dispose();
        done();
      }, { debounceMs: 50 });

      // Emit 3 events quickly
      watcher.emit({ type: 'modified', path: '/a.ts', timestamp: Date.now(), isDirectory: false });
      watcher.emit({ type: 'modified', path: '/b.ts', timestamp: Date.now(), isDirectory: false });
      watcher.emit({ type: 'modified', path: '/c.ts', timestamp: Date.now(), isDirectory: false });
    });

    it('should flush pending events', () => {
      const watcher = new FileWatcher([]);
      const events: FileChangeEvent[][] = [];
      watcher.watch('**', (e) => events.push(e), { debounceMs: 5000 });

      watcher.emit({ type: 'modified', path: '/a.ts', timestamp: Date.now(), isDirectory: false });
      expect(events).toHaveLength(0);

      watcher.flush();
      expect(events).toHaveLength(1);

      watcher.dispose();
    });

    it('should return watcher IDs', () => {
      const watcher = new FileWatcher();
      const id1 = watcher.watch('**/*.ts', () => {});
      const id2 = watcher.watch('**/*.js', () => {});
      const ids = watcher.getWatchers();
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
      expect(ids).toHaveLength(2);
      watcher.dispose();
    });

    it('should handle emitBatch', (done) => {
      const watcher = new FileWatcher([]);
      watcher.watch('**', (events) => {
        expect(events.length).toBe(2);
        watcher.dispose();
        done();
      }, { debounceMs: 10 });

      watcher.emitBatch([
        { type: 'created', path: '/a.ts', timestamp: Date.now(), isDirectory: false },
        { type: 'created', path: '/b.ts', timestamp: Date.now(), isDirectory: false },
      ]);
    });
  });

  describe('singleton', () => {
    it('should return same instance', () => {
      const w1 = getFileWatcher();
      const w2 = getFileWatcher();
      expect(w1).toBe(w2);
    });

    it('should reset instance', () => {
      const w1 = getFileWatcher();
      resetFileWatcher();
      const w2 = getFileWatcher();
      expect(w1).not.toBe(w2);
    });
  });
});
