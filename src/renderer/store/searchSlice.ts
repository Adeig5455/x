import type { SearchResult } from '../../shared/types';

export interface SearchState {
  searchQuery: string;
  searchResults: SearchResult[];
  replaceQuery: string;
  isSearching: boolean;
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  includePattern: string;
  excludePattern: string;
  matchCount: number;
  fileCount: number;
  preserveCase: boolean;
}

export interface SearchSlice extends SearchState {
  setSearchQuery: (query: string) => void;
  setReplaceQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setIsSearching: (searching: boolean) => void;
  toggleCaseSensitive: () => void;
  toggleWholeWord: () => void;
  toggleUseRegex: () => void;
  setIncludePattern: (pattern: string) => void;
  setExcludePattern: (pattern: string) => void;
  togglePreserveCase: () => void;
  clearSearch: () => void;
}

export const createSearchSlice = (
  set: (fn: (state: { search: SearchSlice }) => Partial<{ search: SearchSlice }>) => void,
  _get: () => { search: SearchSlice }
): SearchSlice => ({
  searchQuery: '',
  searchResults: [],
  replaceQuery: '',
  isSearching: false,
  caseSensitive: false,
  wholeWord: false,
  useRegex: false,
  includePattern: '',
  excludePattern: '',
  matchCount: 0,
  fileCount: 0,
  preserveCase: false,

  setSearchQuery: (query) => {
    set((state) => ({ search: { ...state.search, searchQuery: query } }));
  },

  setReplaceQuery: (query) => {
    set((state) => ({ search: { ...state.search, replaceQuery: query } }));
  },

  setSearchResults: (results) => {
    const fileCount = new Set(results.map((r) => r.filePath)).size;
    set((state) => ({
      search: {
        ...state.search,
        searchResults: results,
        matchCount: results.length,
        fileCount,
        isSearching: false,
      },
    }));
  },

  setIsSearching: (searching) => {
    set((state) => ({ search: { ...state.search, isSearching: searching } }));
  },

  toggleCaseSensitive: () => {
    set((state) => ({ search: { ...state.search, caseSensitive: !state.search.caseSensitive } }));
  },

  toggleWholeWord: () => {
    set((state) => ({ search: { ...state.search, wholeWord: !state.search.wholeWord } }));
  },

  toggleUseRegex: () => {
    set((state) => ({ search: { ...state.search, useRegex: !state.search.useRegex } }));
  },

  setIncludePattern: (pattern) => {
    set((state) => ({ search: { ...state.search, includePattern: pattern } }));
  },

  setExcludePattern: (pattern) => {
    set((state) => ({ search: { ...state.search, excludePattern: pattern } }));
  },

  togglePreserveCase: () => {
    set((state) => ({ search: { ...state.search, preserveCase: !state.search.preserveCase } }));
  },

  clearSearch: () => {
    set((state) => ({
      search: {
        ...state.search,
        searchQuery: '',
        searchResults: [],
        replaceQuery: '',
        matchCount: 0,
        fileCount: 0,
      },
    }));
  },
});
