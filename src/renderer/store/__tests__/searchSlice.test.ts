import { createSearchSlice, SearchSlice } from '../searchSlice';

function createTestSlice() {
  let state: { search: SearchSlice };

  const set = (fn: (s: { search: SearchSlice }) => Partial<{ search: SearchSlice }>) => {
    const partial = fn(state);
    if (partial.search) {
      state = { search: { ...state.search, ...partial.search } };
    }
  };

  const get = () => state;
  const slice = createSearchSlice(set, get);
  state = { search: slice };

  return { getState: () => state.search };
}

describe('SearchSlice', () => {
  let store: ReturnType<typeof createTestSlice>;

  beforeEach(() => {
    store = createTestSlice();
  });

  describe('initial state', () => {
    it('should have empty search query', () => {
      expect(store.getState().searchQuery).toBe('');
    });

    it('should have empty results', () => {
      expect(store.getState().searchResults).toEqual([]);
      expect(store.getState().matchCount).toBe(0);
      expect(store.getState().fileCount).toBe(0);
    });

    it('should have all toggles off', () => {
      expect(store.getState().caseSensitive).toBe(false);
      expect(store.getState().wholeWord).toBe(false);
      expect(store.getState().useRegex).toBe(false);
      expect(store.getState().preserveCase).toBe(false);
    });

    it('should not be searching', () => {
      expect(store.getState().isSearching).toBe(false);
    });
  });

  describe('setSearchQuery', () => {
    it('should set search query', () => {
      store.getState().setSearchQuery('hello');
      expect(store.getState().searchQuery).toBe('hello');
    });
  });

  describe('setReplaceQuery', () => {
    it('should set replace query', () => {
      store.getState().setReplaceQuery('world');
      expect(store.getState().replaceQuery).toBe('world');
    });
  });

  describe('setSearchResults', () => {
    it('should set results and compute counts', () => {
      const results = [
        { filePath: '/src/a.ts', lineNumber: 1, lineContent: 'hello', matchStart: 0, matchEnd: 5 },
        { filePath: '/src/a.ts', lineNumber: 5, lineContent: 'hello world', matchStart: 0, matchEnd: 5 },
        { filePath: '/src/b.ts', lineNumber: 3, lineContent: 'say hello', matchStart: 4, matchEnd: 9 },
      ];

      store.getState().setSearchResults(results);
      expect(store.getState().searchResults).toHaveLength(3);
      expect(store.getState().matchCount).toBe(3);
      expect(store.getState().fileCount).toBe(2);
      expect(store.getState().isSearching).toBe(false);
    });
  });

  describe('setIsSearching', () => {
    it('should set searching flag', () => {
      store.getState().setIsSearching(true);
      expect(store.getState().isSearching).toBe(true);
    });
  });

  describe('toggle options', () => {
    it('should toggle case sensitive', () => {
      store.getState().toggleCaseSensitive();
      expect(store.getState().caseSensitive).toBe(true);
      store.getState().toggleCaseSensitive();
      expect(store.getState().caseSensitive).toBe(false);
    });

    it('should toggle whole word', () => {
      store.getState().toggleWholeWord();
      expect(store.getState().wholeWord).toBe(true);
    });

    it('should toggle regex', () => {
      store.getState().toggleUseRegex();
      expect(store.getState().useRegex).toBe(true);
    });

    it('should toggle preserve case', () => {
      store.getState().togglePreserveCase();
      expect(store.getState().preserveCase).toBe(true);
    });
  });

  describe('patterns', () => {
    it('should set include pattern', () => {
      store.getState().setIncludePattern('*.ts');
      expect(store.getState().includePattern).toBe('*.ts');
    });

    it('should set exclude pattern', () => {
      store.getState().setExcludePattern('node_modules');
      expect(store.getState().excludePattern).toBe('node_modules');
    });
  });

  describe('clearSearch', () => {
    it('should clear search state', () => {
      store.getState().setSearchQuery('test');
      store.getState().setReplaceQuery('replacement');
      store.getState().setSearchResults([
        { filePath: '/a.ts', lineNumber: 1, lineContent: 'test', matchStart: 0, matchEnd: 4 },
      ]);

      store.getState().clearSearch();
      expect(store.getState().searchQuery).toBe('');
      expect(store.getState().replaceQuery).toBe('');
      expect(store.getState().searchResults).toEqual([]);
      expect(store.getState().matchCount).toBe(0);
      expect(store.getState().fileCount).toBe(0);
    });

    it('should not clear toggle states', () => {
      store.getState().toggleCaseSensitive();
      store.getState().toggleUseRegex();

      store.getState().clearSearch();
      expect(store.getState().caseSensitive).toBe(true);
      expect(store.getState().useRegex).toBe(true);
    });
  });
});
