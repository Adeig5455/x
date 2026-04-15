// ============================================================================
// Debug Store Slice - Debug session management with DAP protocol,
// breakpoints, call stacks, variables, and watch expressions
// ============================================================================

import { generateId } from '../../shared/utils';

export type DebugStatus = 'idle' | 'running' | 'paused' | 'stopped' | 'error';
export type BreakpointType = 'line' | 'conditional' | 'logpoint' | 'function' | 'exception';

export interface Breakpoint {
  id: string;
  file: string;
  line: number;
  column?: number;
  enabled: boolean;
  type: BreakpointType;
  condition?: string;
  hitCount?: number;
  logMessage?: string;
  verified: boolean;
}

export interface StackFrame {
  id: string;
  name: string;
  file: string;
  line: number;
  column: number;
  scopes: VariableScope[];
}

export interface VariableScope {
  name: string;
  variables: DebugVariable[];
  expensive: boolean;
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
  variablesReference: number;
  children?: DebugVariable[];
  changed?: boolean;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: string;
  error?: string;
}

export interface DebugConsoleEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'warning' | 'info';
  text: string;
  timestamp: number;
  source?: string;
}

export interface DebugConfiguration {
  name: string;
  type: string;
  request: 'launch' | 'attach';
  program?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;
  port?: number;
}

export interface DebugState {
  status: DebugStatus;
  activeConfiguration: DebugConfiguration | null;
  configurations: DebugConfiguration[];
  breakpoints: Breakpoint[];
  callStack: StackFrame[];
  activeFrameId: string | null;
  watchExpressions: WatchExpression[];
  consoleEntries: DebugConsoleEntry[];
  supportsRestart: boolean;
  supportsStepBack: boolean;
}

export interface DebugSlice extends DebugState {
  startDebug: (config: DebugConfiguration) => void;
  stopDebug: () => void;
  pauseDebug: () => void;
  continueDebug: () => void;
  stepOver: () => void;
  stepInto: () => void;
  stepOut: () => void;
  addBreakpoint: (file: string, line: number, type?: BreakpointType, condition?: string) => string;
  removeBreakpoint: (id: string) => void;
  toggleBreakpoint: (id: string) => void;
  clearBreakpoints: (file?: string) => void;
  setCallStack: (frames: StackFrame[]) => void;
  setActiveFrame: (frameId: string) => void;
  addWatchExpression: (expression: string) => string;
  removeWatchExpression: (id: string) => void;
  updateWatchValue: (id: string, value: string, error?: string) => void;
  addConsoleEntry: (type: DebugConsoleEntry['type'], text: string, source?: string) => void;
  clearConsole: () => void;
  addConfiguration: (config: DebugConfiguration) => void;
  removeConfiguration: (name: string) => void;
}

export const createDebugSlice = (
  set: (fn: (state: { debug: DebugSlice }) => Partial<{ debug: DebugSlice }>) => void,
  _get: () => { debug: DebugSlice }
): DebugSlice => ({
  status: 'idle',
  activeConfiguration: null,
  configurations: [
    { name: 'Launch Program', type: 'node', request: 'launch', program: '${workspaceFolder}/index.js' },
    { name: 'Attach to Process', type: 'node', request: 'attach', port: 9229 },
  ],
  breakpoints: [],
  callStack: [],
  activeFrameId: null,
  watchExpressions: [],
  consoleEntries: [],
  supportsRestart: true,
  supportsStepBack: false,

  startDebug: (config) => {
    set((state) => ({
      debug: {
        ...state.debug,
        status: 'running',
        activeConfiguration: config,
        consoleEntries: [
          ...state.debug.consoleEntries,
          {
            id: generateId(),
            type: 'info',
            text: `Debug session started: ${config.name}`,
            timestamp: Date.now(),
            source: 'system',
          },
        ],
      },
    }));
  },

  stopDebug: () => {
    set((state) => ({
      debug: {
        ...state.debug,
        status: 'stopped',
        activeConfiguration: null,
        callStack: [],
        activeFrameId: null,
        consoleEntries: [
          ...state.debug.consoleEntries,
          {
            id: generateId(),
            type: 'info',
            text: 'Debug session ended',
            timestamp: Date.now(),
            source: 'system',
          },
        ],
      },
    }));
  },

  pauseDebug: () => {
    set((state) => ({ debug: { ...state.debug, status: 'paused' } }));
  },

  continueDebug: () => {
    set((state) => ({ debug: { ...state.debug, status: 'running', callStack: [], activeFrameId: null } }));
  },

  stepOver: () => {
    set((state) => ({ debug: { ...state.debug, status: 'paused' } }));
  },

  stepInto: () => {
    set((state) => ({ debug: { ...state.debug, status: 'paused' } }));
  },

  stepOut: () => {
    set((state) => ({ debug: { ...state.debug, status: 'paused' } }));
  },

  addBreakpoint: (file, line, type = 'line', condition) => {
    const id = generateId();
    set((state) => ({
      debug: {
        ...state.debug,
        breakpoints: [
          ...state.debug.breakpoints,
          { id, file, line, enabled: true, type, condition, hitCount: 0, verified: true },
        ],
      },
    }));
    return id;
  },

  removeBreakpoint: (id) => {
    set((state) => ({
      debug: {
        ...state.debug,
        breakpoints: state.debug.breakpoints.filter((bp) => bp.id !== id),
      },
    }));
  },

  toggleBreakpoint: (id) => {
    set((state) => ({
      debug: {
        ...state.debug,
        breakpoints: state.debug.breakpoints.map((bp) =>
          bp.id === id ? { ...bp, enabled: !bp.enabled } : bp
        ),
      },
    }));
  },

  clearBreakpoints: (file) => {
    set((state) => ({
      debug: {
        ...state.debug,
        breakpoints: file
          ? state.debug.breakpoints.filter((bp) => bp.file !== file)
          : [],
      },
    }));
  },

  setCallStack: (frames) => {
    set((state) => ({
      debug: {
        ...state.debug,
        callStack: frames,
        activeFrameId: frames.length > 0 ? frames[0].id : null,
      },
    }));
  },

  setActiveFrame: (frameId) => {
    set((state) => ({ debug: { ...state.debug, activeFrameId: frameId } }));
  },

  addWatchExpression: (expression) => {
    const id = generateId();
    set((state) => ({
      debug: {
        ...state.debug,
        watchExpressions: [...state.debug.watchExpressions, { id, expression }],
      },
    }));
    return id;
  },

  removeWatchExpression: (id) => {
    set((state) => ({
      debug: {
        ...state.debug,
        watchExpressions: state.debug.watchExpressions.filter((w) => w.id !== id),
      },
    }));
  },

  updateWatchValue: (id, value, error) => {
    set((state) => ({
      debug: {
        ...state.debug,
        watchExpressions: state.debug.watchExpressions.map((w) =>
          w.id === id ? { ...w, value, error } : w
        ),
      },
    }));
  },

  addConsoleEntry: (type, text, source) => {
    set((state) => ({
      debug: {
        ...state.debug,
        consoleEntries: [
          ...state.debug.consoleEntries,
          { id: generateId(), type, text, timestamp: Date.now(), source },
        ].slice(-500),
      },
    }));
  },

  clearConsole: () => {
    set((state) => ({ debug: { ...state.debug, consoleEntries: [] } }));
  },

  addConfiguration: (config) => {
    set((state) => ({
      debug: {
        ...state.debug,
        configurations: [...state.debug.configurations, config],
      },
    }));
  },

  removeConfiguration: (name) => {
    set((state) => ({
      debug: {
        ...state.debug,
        configurations: state.debug.configurations.filter((c) => c.name !== name),
      },
    }));
  },
});
