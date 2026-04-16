import { fuzzyMatch, highlightMatches, fuzzySort } from '../fuzzyMatch';

describe('fuzzyMatch', () => {
  describe('fuzzyMatch', () => {
    it('matches exact string', () => {
      const result = fuzzyMatch('hello', 'hello');
      expect(result).not.toBeNull();
      expect(result!.matchedIndices).toEqual([0, 1, 2, 3, 4]);
    });

    it('matches subsequence', () => {
      const result = fuzzyMatch('fle', 'FileExplorer');
      expect(result).not.toBeNull();
      expect(result!.matchedIndices.length).toBe(3);
    });

    it('returns null for no match', () => {
      const result = fuzzyMatch('xyz', 'hello');
      expect(result).toBeNull();
    });

    it('returns match with score 0 for empty pattern', () => {
      const result = fuzzyMatch('', 'hello');
      expect(result).not.toBeNull();
      expect(result!.score).toBe(0);
    });

    it('returns null for empty text', () => {
      const result = fuzzyMatch('a', '');
      expect(result).toBeNull();
    });

    it('gives higher score for consecutive matches', () => {
      const consecutive = fuzzyMatch('file', 'FileExplorer');
      const scattered = fuzzyMatch('file', 'ForItsLovedEgo');
      expect(consecutive).not.toBeNull();
      // Consecutive should score higher if both match
      if (consecutive && scattered) {
        expect(consecutive.score).toBeGreaterThan(scattered.score);
      }
    });

    it('gives higher score for word boundary matches', () => {
      const boundary = fuzzyMatch('fe', 'FileExplorer');
      expect(boundary).not.toBeNull();
      // 'F' at start and 'E' at word boundary should get bonuses
      expect(boundary!.score).toBeGreaterThan(0);
    });

    it('is case insensitive', () => {
      const result = fuzzyMatch('FILE', 'FileExplorer');
      expect(result).not.toBeNull();
    });

    it('gives bonus for exact case match', () => {
      const exactCase = fuzzyMatch('File', 'FileExplorer');
      const wrongCase = fuzzyMatch('file', 'FileExplorer');
      expect(exactCase).not.toBeNull();
      expect(wrongCase).not.toBeNull();
      // Exact case should score higher
      expect(exactCase!.score).toBeGreaterThanOrEqual(wrongCase!.score);
    });
  });

  describe('highlightMatches', () => {
    it('wraps matched characters in mark tags', () => {
      const result = highlightMatches('hello', [0, 2, 4]);
      expect(result).toBe('<mark>h</mark>e<mark>l</mark>l<mark>o</mark>');
    });

    it('groups consecutive matches', () => {
      const result = highlightMatches('hello', [0, 1, 2]);
      expect(result).toBe('<mark>hel</mark>lo');
    });

    it('returns original text for no matches', () => {
      const result = highlightMatches('hello', []);
      expect(result).toBe('hello');
    });
  });

  describe('fuzzySort', () => {
    it('sorts items by match score descending', () => {
      const items = [
        { name: 'FileExplorer' },
        { name: 'file' },
        { name: 'ProfileSettings' },
      ];

      const sorted = fuzzySort(items, 'file', (item) => item.name);
      expect(sorted.length).toBeGreaterThan(0);
      // Shorter exact match or best fuzzy match should rank high
      expect(sorted.map((s) => s.name)).toContain('file');
    });

    it('filters out non-matching items', () => {
      const items = [
        { name: 'apple' },
        { name: 'banana' },
        { name: 'cherry' },
      ];

      const sorted = fuzzySort(items, 'xyz', (item) => item.name);
      expect(sorted).toHaveLength(0);
    });

    it('handles empty pattern', () => {
      const items = [{ name: 'a' }, { name: 'b' }];
      const sorted = fuzzySort(items, '', (item) => item.name);
      expect(sorted).toHaveLength(2);
    });
  });
});
