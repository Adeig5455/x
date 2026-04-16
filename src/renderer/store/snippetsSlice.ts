// ============================================================================
// Snippets Store Slice - User snippet management with tab stops,
// variables, scope filtering, and snippet insertion
// ============================================================================

import { generateId } from '../../shared/utils';

export type SnippetSource = 'user' | 'extension' | 'builtin';

export interface SnippetTabStop {
  index: number;
  placeholder?: string;
  choices?: string[];
}

export interface Snippet {
  id: string;
  name: string;
  prefix: string;
  body: string[];
  description: string;
  scope: string[];
  source: SnippetSource;
  tabStops: SnippetTabStop[];
  isActive: boolean;
  lastUsed?: number;
  useCount: number;
}

export interface SnippetsState {
  snippets: Snippet[];
  activeSnippetId: string | null;
  filterScope: string;
  filterSource: SnippetSource | 'all';
  filterText: string;
  isEditing: boolean;
  editingSnippetId: string | null;
}

export interface SnippetsSlice extends SnippetsState {
  addSnippet: (snippet: Omit<Snippet, 'id' | 'useCount'>) => string;
  removeSnippet: (id: string) => void;
  updateSnippet: (id: string, updates: Partial<Snippet>) => void;
  duplicateSnippet: (id: string) => string;
  useSnippet: (id: string) => void;
  setFilterScope: (scope: string) => void;
  setFilterSource: (source: SnippetSource | 'all') => void;
  setFilterText: (text: string) => void;
  startEditing: (id: string | null) => void;
  stopEditing: () => void;
  toggleActive: (id: string) => void;
  importSnippets: (snippets: Array<Omit<Snippet, 'id' | 'useCount'>>) => void;
  getSnippetsForScope: (scope: string) => Snippet[];
  getSortedByUsage: () => Snippet[];
}

export const createSnippetsSlice = (
  set: (fn: (state: { snippets: SnippetsSlice }) => Partial<{ snippets: SnippetsSlice }>) => void,
  get: () => { snippets: SnippetsSlice }
): SnippetsSlice => ({
  snippets: [
    {
      id: 'builtin-log',
      name: 'Console Log',
      prefix: 'log',
      body: ['console.log($1);'],
      description: 'Log output to console',
      scope: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
      source: 'builtin',
      tabStops: [{ index: 1, placeholder: 'message' }],
      isActive: true,
      useCount: 0,
    },
    {
      id: 'builtin-fn',
      name: 'Arrow Function',
      prefix: 'fn',
      body: ['const $1 = ($2) => {', '\t$0', '};'],
      description: 'Create an arrow function',
      scope: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
      source: 'builtin',
      tabStops: [{ index: 1, placeholder: 'name' }, { index: 2, placeholder: 'params' }],
      isActive: true,
      useCount: 0,
    },
    {
      id: 'builtin-rfc',
      name: 'React Functional Component',
      prefix: 'rfc',
      body: [
        'import React from \'react\';',
        '',
        'interface $1Props {',
        '\t$2',
        '}',
        '',
        'export const $1: React.FC<$1Props> = ({ $3 }) => {',
        '\treturn (',
        '\t\t<div>',
        '\t\t\t$0',
        '\t\t</div>',
        '\t);',
        '};',
      ],
      description: 'Create a React functional component with TypeScript',
      scope: ['typescriptreact'],
      source: 'builtin',
      tabStops: [
        { index: 1, placeholder: 'ComponentName' },
        { index: 2, placeholder: 'props' },
        { index: 3, placeholder: 'destructured props' },
      ],
      isActive: true,
      useCount: 0,
    },
  ],
  activeSnippetId: null,
  filterScope: '',
  filterSource: 'all',
  filterText: '',
  isEditing: false,
  editingSnippetId: null,

  addSnippet: (snippet) => {
    const id = generateId();
    set((state) => ({
      snippets: {
        ...state.snippets,
        snippets: [...state.snippets.snippets, { ...snippet, id, useCount: 0 }],
      },
    }));
    return id;
  },

  removeSnippet: (id) => {
    set((state) => ({
      snippets: {
        ...state.snippets,
        snippets: state.snippets.snippets.filter((s) => s.id !== id),
        activeSnippetId: state.snippets.activeSnippetId === id ? null : state.snippets.activeSnippetId,
      },
    }));
  },

  updateSnippet: (id, updates) => {
    set((state) => ({
      snippets: {
        ...state.snippets,
        snippets: state.snippets.snippets.map((s) =>
          s.id === id ? { ...s, ...updates } : s
        ),
      },
    }));
  },

  duplicateSnippet: (id) => {
    const newId = generateId();
    const state = get().snippets;
    const original = state.snippets.find((s) => s.id === id);
    if (original) {
      set((st) => ({
        snippets: {
          ...st.snippets,
          snippets: [
            ...st.snippets.snippets,
            { ...original, id: newId, name: `${original.name} (copy)`, prefix: `${original.prefix}-copy`, source: 'user' as SnippetSource, useCount: 0 },
          ],
        },
      }));
    }
    return newId;
  },

  useSnippet: (id) => {
    set((state) => ({
      snippets: {
        ...state.snippets,
        snippets: state.snippets.snippets.map((s) =>
          s.id === id ? { ...s, useCount: s.useCount + 1, lastUsed: Date.now() } : s
        ),
      },
    }));
  },

  setFilterScope: (scope) => {
    set((state) => ({ snippets: { ...state.snippets, filterScope: scope } }));
  },

  setFilterSource: (source) => {
    set((state) => ({ snippets: { ...state.snippets, filterSource: source } }));
  },

  setFilterText: (text) => {
    set((state) => ({ snippets: { ...state.snippets, filterText: text } }));
  },

  startEditing: (id) => {
    set((state) => ({
      snippets: { ...state.snippets, isEditing: true, editingSnippetId: id },
    }));
  },

  stopEditing: () => {
    set((state) => ({
      snippets: { ...state.snippets, isEditing: false, editingSnippetId: null },
    }));
  },

  toggleActive: (id) => {
    set((state) => ({
      snippets: {
        ...state.snippets,
        snippets: state.snippets.snippets.map((s) =>
          s.id === id ? { ...s, isActive: !s.isActive } : s
        ),
      },
    }));
  },

  importSnippets: (newSnippets) => {
    set((state) => ({
      snippets: {
        ...state.snippets,
        snippets: [
          ...state.snippets.snippets,
          ...newSnippets.map((s) => ({ ...s, id: generateId(), useCount: 0 })),
        ],
      },
    }));
  },

  getSnippetsForScope: (scope) => {
    const state = get().snippets;
    return state.snippets.filter(
      (s) => s.isActive && (s.scope.length === 0 || s.scope.includes(scope))
    );
  },

  getSortedByUsage: () => {
    const state = get().snippets;
    return [...state.snippets].sort((a, b) => b.useCount - a.useCount);
  },
});
