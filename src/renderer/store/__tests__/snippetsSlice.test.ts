import { createSnippetsSlice, SnippetsSlice } from '../snippetsSlice';

describe('snippetsSlice', () => {
  let state: { snippets: SnippetsSlice };

  beforeEach(() => {
    state = { snippets: null as unknown as SnippetsSlice };
    const set = (fn: (s: { snippets: SnippetsSlice }) => Partial<{ snippets: SnippetsSlice }>) => {
      const result = fn(state);
      if (result.snippets) {
        state = { snippets: { ...state.snippets, ...result.snippets } };
      }
    };
    const get = () => state;
    const slice = createSnippetsSlice(set, get);
    state = { snippets: slice };
  });

  it('should have correct initial state with builtin snippets', () => {
    expect(state.snippets.snippets).toHaveLength(3);
    expect(state.snippets.snippets[0].source).toBe('builtin');
    expect(state.snippets.filterSource).toBe('all');
    expect(state.snippets.isEditing).toBe(false);
  });

  it('should add a snippet', () => {
    const id = state.snippets.addSnippet({
      name: 'Try Catch',
      prefix: 'trycatch',
      body: ['try {', '\t$1', '} catch (error) {', '\t$2', '}'],
      description: 'Try-catch block',
      scope: ['typescript'],
      source: 'user',
      tabStops: [{ index: 1 }, { index: 2 }],
      isActive: true,
    });
    expect(id).toBeTruthy();
    expect(state.snippets.snippets).toHaveLength(4);
    expect(state.snippets.snippets[3].name).toBe('Try Catch');
    expect(state.snippets.snippets[3].useCount).toBe(0);
  });

  it('should remove a snippet', () => {
    const id = state.snippets.addSnippet({
      name: 'Remove Me', prefix: 'rm', body: ['removed'], description: 'gone',
      scope: [], source: 'user', tabStops: [], isActive: true,
    });
    expect(state.snippets.snippets).toHaveLength(4);
    state.snippets.removeSnippet(id);
    expect(state.snippets.snippets).toHaveLength(3);
  });

  it('should update a snippet', () => {
    const id = state.snippets.snippets[0].id;
    state.snippets.updateSnippet(id, { description: 'Updated description' });
    expect(state.snippets.snippets[0].description).toBe('Updated description');
  });

  it('should duplicate a snippet', () => {
    const originalId = state.snippets.snippets[0].id;
    const newId = state.snippets.duplicateSnippet(originalId);
    expect(newId).toBeTruthy();
    expect(state.snippets.snippets).toHaveLength(4);
    expect(state.snippets.snippets[3].name).toContain('(copy)');
    expect(state.snippets.snippets[3].source).toBe('user');
  });

  it('should track snippet usage', () => {
    const id = state.snippets.snippets[0].id;
    expect(state.snippets.snippets[0].useCount).toBe(0);
    state.snippets.useSnippet(id);
    expect(state.snippets.snippets[0].useCount).toBe(1);
    state.snippets.useSnippet(id);
    expect(state.snippets.snippets[0].useCount).toBe(2);
    expect(state.snippets.snippets[0].lastUsed).toBeDefined();
  });

  it('should filter by scope', () => {
    const result = state.snippets.getSnippetsForScope('typescriptreact');
    expect(result.length).toBeGreaterThanOrEqual(3);
  });

  it('should sort by usage', () => {
    state.snippets.useSnippet(state.snippets.snippets[2].id);
    state.snippets.useSnippet(state.snippets.snippets[2].id);
    state.snippets.useSnippet(state.snippets.snippets[0].id);
    const sorted = state.snippets.getSortedByUsage();
    expect(sorted[0].useCount).toBeGreaterThanOrEqual(sorted[1].useCount);
  });

  it('should toggle active state', () => {
    const id = state.snippets.snippets[0].id;
    expect(state.snippets.snippets[0].isActive).toBe(true);
    state.snippets.toggleActive(id);
    expect(state.snippets.snippets[0].isActive).toBe(false);
  });

  it('should manage editing state', () => {
    state.snippets.startEditing('some-id');
    expect(state.snippets.isEditing).toBe(true);
    expect(state.snippets.editingSnippetId).toBe('some-id');
    state.snippets.stopEditing();
    expect(state.snippets.isEditing).toBe(false);
    expect(state.snippets.editingSnippetId).toBeNull();
  });

  it('should set filters', () => {
    state.snippets.setFilterScope('typescript');
    expect(state.snippets.filterScope).toBe('typescript');
    state.snippets.setFilterSource('user');
    expect(state.snippets.filterSource).toBe('user');
    state.snippets.setFilterText('log');
    expect(state.snippets.filterText).toBe('log');
  });

  it('should import snippets', () => {
    state.snippets.importSnippets([
      { name: 'Import1', prefix: 'imp1', body: ['a'], description: 'd', scope: [], source: 'extension', tabStops: [], isActive: true },
      { name: 'Import2', prefix: 'imp2', body: ['b'], description: 'd', scope: [], source: 'extension', tabStops: [], isActive: true },
    ]);
    expect(state.snippets.snippets).toHaveLength(5);
  });
});
