import { createProblemsSlice, ProblemsSlice } from '../problemsSlice';

describe('problemsSlice', () => {
  let state: { problems: ProblemsSlice };

  beforeEach(() => {
    state = { problems: null as unknown as ProblemsSlice };
    const set = (fn: (s: { problems: ProblemsSlice }) => Partial<{ problems: ProblemsSlice }>) => {
      const result = fn(state);
      if (result.problems) {
        state = { problems: { ...state.problems, ...result.problems } };
      }
    };
    const get = () => state;
    const slice = createProblemsSlice(set, get);
    state = { problems: slice };
  });

  it('should have correct initial state', () => {
    expect(state.problems.diagnostics).toEqual([]);
    expect(state.problems.groupByFile).toBe(true);
    expect(state.problems.showErrors).toBe(true);
    expect(state.problems.showWarnings).toBe(true);
  });

  it('should add a diagnostic', () => {
    const id = state.problems.addDiagnostic({
      file: '/src/app.ts',
      severity: 'error',
      message: 'Type error',
      source: 'typescript',
      range: { startLine: 10, startColumn: 1, endLine: 10, endColumn: 20 },
      quickFixes: [],
    });
    expect(id).toBeTruthy();
    expect(state.problems.diagnostics).toHaveLength(1);
  });

  it('should add multiple diagnostics at once', () => {
    state.problems.addDiagnostics([
      { file: '/src/a.ts', severity: 'error', message: 'err1', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 }, quickFixes: [] },
      { file: '/src/b.ts', severity: 'warning', message: 'warn1', source: 'ts', range: { startLine: 5, startColumn: 1, endLine: 5, endColumn: 15 }, quickFixes: [] },
    ]);
    expect(state.problems.diagnostics).toHaveLength(2);
  });

  it('should remove a diagnostic', () => {
    const id = state.problems.addDiagnostic({
      file: '/src/app.ts', severity: 'error', message: 'err', source: 'ts',
      range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 10 }, quickFixes: [],
    });
    state.problems.removeDiagnostic(id);
    expect(state.problems.diagnostics).toHaveLength(0);
  });

  it('should clear diagnostics for a file', () => {
    state.problems.addDiagnostic({ file: '/src/a.ts', severity: 'error', message: 'e1', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.addDiagnostic({ file: '/src/a.ts', severity: 'warning', message: 'w1', source: 'ts', range: { startLine: 2, startColumn: 1, endLine: 2, endColumn: 1 }, quickFixes: [] });
    state.problems.addDiagnostic({ file: '/src/b.ts', severity: 'error', message: 'e2', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.clearDiagnosticsForFile('/src/a.ts');
    expect(state.problems.diagnostics).toHaveLength(1);
    expect(state.problems.diagnostics[0].file).toBe('/src/b.ts');
  });

  it('should clear diagnostics for a source', () => {
    state.problems.addDiagnostic({ file: '/src/a.ts', severity: 'error', message: 'e1', source: 'eslint', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.addDiagnostic({ file: '/src/b.ts', severity: 'error', message: 'e2', source: 'typescript', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.clearDiagnosticsForSource('eslint');
    expect(state.problems.diagnostics).toHaveLength(1);
    expect(state.problems.diagnostics[0].source).toBe('typescript');
  });

  it('should clear all diagnostics', () => {
    state.problems.addDiagnostic({ file: '/a.ts', severity: 'error', message: 'e', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.clearAll();
    expect(state.problems.diagnostics).toHaveLength(0);
  });

  it('should get file problems grouped', () => {
    state.problems.addDiagnostic({ file: '/a.ts', severity: 'error', message: 'e', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.addDiagnostic({ file: '/a.ts', severity: 'warning', message: 'w', source: 'ts', range: { startLine: 2, startColumn: 1, endLine: 2, endColumn: 1 }, quickFixes: [] });
    state.problems.addDiagnostic({ file: '/b.ts', severity: 'error', message: 'e2', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });

    const fileProblems = state.problems.getFileProblems();
    expect(fileProblems).toHaveLength(2);
    const fileA = fileProblems.find((f) => f.file === '/a.ts');
    expect(fileA?.errorCount).toBe(1);
    expect(fileA?.warningCount).toBe(1);
  });

  it('should get total counts', () => {
    state.problems.addDiagnostic({ file: '/a.ts', severity: 'error', message: 'e', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.addDiagnostic({ file: '/b.ts', severity: 'warning', message: 'w', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.addDiagnostic({ file: '/c.ts', severity: 'info', message: 'i', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });

    const counts = state.problems.getTotalCounts();
    expect(counts.errors).toBe(1);
    expect(counts.warnings).toBe(1);
    expect(counts.infos).toBe(1);
    expect(counts.hints).toBe(0);
  });

  it('should toggle filters', () => {
    state.problems.setFilterSeverity('error');
    expect(state.problems.filterSeverity).toBe('error');
    state.problems.setFilterSource('eslint');
    expect(state.problems.filterSource).toBe('eslint');
    state.problems.setFilterText('type');
    expect(state.problems.filterText).toBe('type');
    state.problems.toggleGroupByFile();
    expect(state.problems.groupByFile).toBe(false);
    state.problems.toggleShowErrors();
    expect(state.problems.showErrors).toBe(false);
    state.problems.toggleShowWarnings();
    expect(state.problems.showWarnings).toBe(false);
  });

  it('should select a diagnostic', () => {
    const id = state.problems.addDiagnostic({ file: '/a.ts', severity: 'error', message: 'e', source: 'ts', range: { startLine: 1, startColumn: 1, endLine: 1, endColumn: 1 }, quickFixes: [] });
    state.problems.selectDiagnostic(id);
    expect(state.problems.selectedDiagnosticId).toBe(id);
  });
});
