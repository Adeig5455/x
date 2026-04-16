import {
  getLanguageFromFilePath,
  generateId,
  formatFileSize,
  debounce,
  throttle,
  truncatePath,
} from '../index';

// Mock path module for browser environment
jest.mock('path', () => ({
  extname: (filePath: string) => {
    const lastDot = filePath.lastIndexOf('.');
    return lastDot !== -1 ? filePath.slice(lastDot) : '';
  },
  sep: '/',
}));

describe('shared utils', () => {
  describe('getLanguageFromFilePath', () => {
    it('detects TypeScript', () => {
      expect(getLanguageFromFilePath('file.ts')).toBe('typescript');
    });

    it('detects TypeScript React', () => {
      expect(getLanguageFromFilePath('component.tsx')).toBe('typescriptreact');
    });

    it('detects JavaScript', () => {
      expect(getLanguageFromFilePath('script.js')).toBe('javascript');
    });

    it('detects Python', () => {
      expect(getLanguageFromFilePath('main.py')).toBe('python');
    });

    it('detects JSON', () => {
      expect(getLanguageFromFilePath('package.json')).toBe('json');
    });

    it('detects Markdown', () => {
      expect(getLanguageFromFilePath('README.md')).toBe('markdown');
    });

    it('detects CSS', () => {
      expect(getLanguageFromFilePath('styles.css')).toBe('css');
    });

    it('returns plaintext for unknown extensions', () => {
      expect(getLanguageFromFilePath('file.xyz')).toBe('plaintext');
    });

    it('handles uppercase extensions', () => {
      expect(getLanguageFromFilePath('FILE.TS')).toBe('typescript');
    });
  });

  describe('generateId', () => {
    it('generates a non-empty string', () => {
      const id = generateId();
      expect(id).toBeTruthy();
      expect(typeof id).toBe('string');
    });

    it('generates unique IDs', () => {
      const ids = new Set(Array.from({ length: 100 }, () => generateId()));
      expect(ids.size).toBe(100);
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('formats kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(2048)).toBe('2.0 KB');
    });

    it('formats megabytes', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    });

    it('formats gigabytes', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });
  });

  describe('debounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('delays function execution', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('resets timer on subsequent calls', () => {
      const fn = jest.fn();
      const debounced = debounce(fn, 100);

      debounced();
      jest.advanceTimersByTime(50);
      debounced();
      jest.advanceTimersByTime(50);
      expect(fn).not.toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls function immediately on first call', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('blocks subsequent calls within limit', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      throttled();
      throttled();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('allows calls after limit passes', () => {
      const fn = jest.fn();
      const throttled = throttle(fn, 100);

      throttled();
      jest.advanceTimersByTime(100);
      throttled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('truncatePath', () => {
    it('returns short paths unchanged', () => {
      expect(truncatePath('/src/file.ts')).toBe('/src/file.ts');
    });

    it('truncates long paths', () => {
      const longPath = '/very/long/path/to/some/deeply/nested/file.ts';
      const result = truncatePath(longPath, 20);
      expect(result).toContain('...');
      expect(result.length).toBeLessThan(longPath.length);
    });
  });
});
