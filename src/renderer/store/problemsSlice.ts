// ============================================================================
// Problems Store Slice - Diagnostic management with error/warning aggregation,
// file-level grouping, quick fixes, and severity filtering
// ============================================================================

import { generateId } from '../../shared/utils';

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface DiagnosticRange {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface QuickFix {
  id: string;
  title: string;
  isPreferred: boolean;
}

export interface Diagnostic {
  id: string;
  file: string;
  severity: DiagnosticSeverity;
  message: string;
  source: string;
  code?: string | number;
  range: DiagnosticRange;
  relatedInfo?: Array<{ file: string; range: DiagnosticRange; message: string }>;
  quickFixes: QuickFix[];
}

export interface FileProblems {
  file: string;
  diagnostics: Diagnostic[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  hintCount: number;
}

export interface ProblemsState {
  diagnostics: Diagnostic[];
  filterSeverity: DiagnosticSeverity | 'all';
  filterSource: string;
  filterText: string;
  groupByFile: boolean;
  showErrors: boolean;
  showWarnings: boolean;
  showInfos: boolean;
  showHints: boolean;
  selectedDiagnosticId: string | null;
}

export interface ProblemsSlice extends ProblemsState {
  addDiagnostic: (diagnostic: Omit<Diagnostic, 'id'>) => string;
  addDiagnostics: (diagnostics: Array<Omit<Diagnostic, 'id'>>) => void;
  removeDiagnostic: (id: string) => void;
  clearDiagnosticsForFile: (file: string) => void;
  clearDiagnosticsForSource: (source: string) => void;
  clearAll: () => void;
  setFilterSeverity: (severity: DiagnosticSeverity | 'all') => void;
  setFilterSource: (source: string) => void;
  setFilterText: (text: string) => void;
  toggleGroupByFile: () => void;
  toggleShowErrors: () => void;
  toggleShowWarnings: () => void;
  toggleShowInfos: () => void;
  toggleShowHints: () => void;
  selectDiagnostic: (id: string | null) => void;
  getFileProblems: () => FileProblems[];
  getTotalCounts: () => { errors: number; warnings: number; infos: number; hints: number };
}

export const createProblemsSlice = (
  set: (fn: (state: { problems: ProblemsSlice }) => Partial<{ problems: ProblemsSlice }>) => void,
  get: () => { problems: ProblemsSlice }
): ProblemsSlice => ({
  diagnostics: [],
  filterSeverity: 'all',
  filterSource: '',
  filterText: '',
  groupByFile: true,
  showErrors: true,
  showWarnings: true,
  showInfos: true,
  showHints: false,
  selectedDiagnosticId: null,

  addDiagnostic: (diagnostic) => {
    const id = generateId();
    set((state) => ({
      problems: {
        ...state.problems,
        diagnostics: [...state.problems.diagnostics, { ...diagnostic, id }],
      },
    }));
    return id;
  },

  addDiagnostics: (diagnostics) => {
    set((state) => ({
      problems: {
        ...state.problems,
        diagnostics: [
          ...state.problems.diagnostics,
          ...diagnostics.map((d) => ({ ...d, id: generateId() })),
        ],
      },
    }));
  },

  removeDiagnostic: (id) => {
    set((state) => ({
      problems: {
        ...state.problems,
        diagnostics: state.problems.diagnostics.filter((d) => d.id !== id),
      },
    }));
  },

  clearDiagnosticsForFile: (file) => {
    set((state) => ({
      problems: {
        ...state.problems,
        diagnostics: state.problems.diagnostics.filter((d) => d.file !== file),
      },
    }));
  },

  clearDiagnosticsForSource: (source) => {
    set((state) => ({
      problems: {
        ...state.problems,
        diagnostics: state.problems.diagnostics.filter((d) => d.source !== source),
      },
    }));
  },

  clearAll: () => {
    set((state) => ({
      problems: { ...state.problems, diagnostics: [], selectedDiagnosticId: null },
    }));
  },

  setFilterSeverity: (severity) => {
    set((state) => ({
      problems: { ...state.problems, filterSeverity: severity },
    }));
  },

  setFilterSource: (source) => {
    set((state) => ({
      problems: { ...state.problems, filterSource: source },
    }));
  },

  setFilterText: (text) => {
    set((state) => ({
      problems: { ...state.problems, filterText: text },
    }));
  },

  toggleGroupByFile: () => {
    set((state) => ({
      problems: { ...state.problems, groupByFile: !state.problems.groupByFile },
    }));
  },

  toggleShowErrors: () => {
    set((state) => ({
      problems: { ...state.problems, showErrors: !state.problems.showErrors },
    }));
  },

  toggleShowWarnings: () => {
    set((state) => ({
      problems: { ...state.problems, showWarnings: !state.problems.showWarnings },
    }));
  },

  toggleShowInfos: () => {
    set((state) => ({
      problems: { ...state.problems, showInfos: !state.problems.showInfos },
    }));
  },

  toggleShowHints: () => {
    set((state) => ({
      problems: { ...state.problems, showHints: !state.problems.showHints },
    }));
  },

  selectDiagnostic: (id) => {
    set((state) => ({
      problems: { ...state.problems, selectedDiagnosticId: id },
    }));
  },

  getFileProblems: () => {
    const state = get().problems;
    const fileMap = new Map<string, Diagnostic[]>();
    
    for (const d of state.diagnostics) {
      const existing = fileMap.get(d.file) || [];
      existing.push(d);
      fileMap.set(d.file, existing);
    }

    return Array.from(fileMap.entries()).map(([file, diagnostics]) => ({
      file,
      diagnostics,
      errorCount: diagnostics.filter((d) => d.severity === 'error').length,
      warningCount: diagnostics.filter((d) => d.severity === 'warning').length,
      infoCount: diagnostics.filter((d) => d.severity === 'info').length,
      hintCount: diagnostics.filter((d) => d.severity === 'hint').length,
    }));
  },

  getTotalCounts: () => {
    const state = get().problems;
    return {
      errors: state.diagnostics.filter((d) => d.severity === 'error').length,
      warnings: state.diagnostics.filter((d) => d.severity === 'warning').length,
      infos: state.diagnostics.filter((d) => d.severity === 'info').length,
      hints: state.diagnostics.filter((d) => d.severity === 'hint').length,
    };
  },
});
