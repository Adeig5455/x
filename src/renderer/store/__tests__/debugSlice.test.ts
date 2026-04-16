import { createDebugSlice, DebugSlice } from '../debugSlice';

describe('debugSlice', () => {
  let state: { debug: DebugSlice };

  beforeEach(() => {
    state = { debug: null as unknown as DebugSlice };
    const set = (fn: (s: { debug: DebugSlice }) => Partial<{ debug: DebugSlice }>) => {
      const result = fn(state);
      if (result.debug) {
        state = { debug: { ...state.debug, ...result.debug } };
      }
    };
    const get = () => state;
    const slice = createDebugSlice(set, get);
    state = { debug: slice };
  });

  it('should have correct initial state', () => {
    expect(state.debug.status).toBe('idle');
    expect(state.debug.activeConfiguration).toBeNull();
    expect(state.debug.breakpoints).toEqual([]);
    expect(state.debug.callStack).toEqual([]);
    expect(state.debug.watchExpressions).toEqual([]);
    expect(state.debug.configurations).toHaveLength(2);
  });

  it('should start and stop debug session', () => {
    const config = { name: 'Test', type: 'node', request: 'launch' as const, program: 'index.js' };
    state.debug.startDebug(config);
    expect(state.debug.status).toBe('running');
    expect(state.debug.activeConfiguration).toEqual(config);
    expect(state.debug.consoleEntries.length).toBeGreaterThan(0);

    state.debug.stopDebug();
    expect(state.debug.status).toBe('stopped');
    expect(state.debug.activeConfiguration).toBeNull();
    expect(state.debug.callStack).toEqual([]);
  });

  it('should pause and continue', () => {
    state.debug.startDebug({ name: 'Test', type: 'node', request: 'launch' });
    state.debug.pauseDebug();
    expect(state.debug.status).toBe('paused');
    state.debug.continueDebug();
    expect(state.debug.status).toBe('running');
  });

  it('should manage breakpoints', () => {
    const id = state.debug.addBreakpoint('/src/app.ts', 10, 'line');
    expect(state.debug.breakpoints).toHaveLength(1);
    expect(state.debug.breakpoints[0].file).toBe('/src/app.ts');
    expect(state.debug.breakpoints[0].line).toBe(10);
    expect(state.debug.breakpoints[0].enabled).toBe(true);

    state.debug.toggleBreakpoint(id);
    expect(state.debug.breakpoints[0].enabled).toBe(false);

    state.debug.removeBreakpoint(id);
    expect(state.debug.breakpoints).toHaveLength(0);
  });

  it('should add conditional breakpoints', () => {
    state.debug.addBreakpoint('/src/app.ts', 20, 'conditional', 'x > 5');
    expect(state.debug.breakpoints[0].type).toBe('conditional');
    expect(state.debug.breakpoints[0].condition).toBe('x > 5');
  });

  it('should clear breakpoints by file', () => {
    state.debug.addBreakpoint('/src/a.ts', 1);
    state.debug.addBreakpoint('/src/a.ts', 5);
    state.debug.addBreakpoint('/src/b.ts', 10);
    expect(state.debug.breakpoints).toHaveLength(3);

    state.debug.clearBreakpoints('/src/a.ts');
    expect(state.debug.breakpoints).toHaveLength(1);
    expect(state.debug.breakpoints[0].file).toBe('/src/b.ts');
  });

  it('should clear all breakpoints', () => {
    state.debug.addBreakpoint('/src/a.ts', 1);
    state.debug.addBreakpoint('/src/b.ts', 10);
    state.debug.clearBreakpoints();
    expect(state.debug.breakpoints).toHaveLength(0);
  });

  it('should manage call stack', () => {
    const frames = [
      { id: 'f1', name: 'main', file: '/src/app.ts', line: 10, column: 1, scopes: [] },
      { id: 'f2', name: 'init', file: '/src/init.ts', line: 5, column: 1, scopes: [] },
    ];
    state.debug.setCallStack(frames);
    expect(state.debug.callStack).toHaveLength(2);
    expect(state.debug.activeFrameId).toBe('f1');

    state.debug.setActiveFrame('f2');
    expect(state.debug.activeFrameId).toBe('f2');
  });

  it('should manage watch expressions', () => {
    const id = state.debug.addWatchExpression('myVar');
    expect(state.debug.watchExpressions).toHaveLength(1);
    expect(state.debug.watchExpressions[0].expression).toBe('myVar');

    state.debug.updateWatchValue(id, '42');
    expect(state.debug.watchExpressions[0].value).toBe('42');

    state.debug.removeWatchExpression(id);
    expect(state.debug.watchExpressions).toHaveLength(0);
  });

  it('should manage console entries', () => {
    state.debug.addConsoleEntry('output', 'Hello world', 'stdout');
    state.debug.addConsoleEntry('error', 'Error occurred', 'stderr');
    expect(state.debug.consoleEntries).toHaveLength(2);
    expect(state.debug.consoleEntries[0].type).toBe('output');
    expect(state.debug.consoleEntries[1].type).toBe('error');

    state.debug.clearConsole();
    expect(state.debug.consoleEntries).toHaveLength(0);
  });

  it('should manage configurations', () => {
    const config = { name: 'Custom', type: 'python', request: 'launch' as const, program: 'main.py' };
    state.debug.addConfiguration(config);
    expect(state.debug.configurations).toHaveLength(3);

    state.debug.removeConfiguration('Custom');
    expect(state.debug.configurations).toHaveLength(2);
  });

  it('should handle step operations', () => {
    state.debug.startDebug({ name: 'Test', type: 'node', request: 'launch' });
    state.debug.stepOver();
    expect(state.debug.status).toBe('paused');
    state.debug.stepInto();
    expect(state.debug.status).toBe('paused');
    state.debug.stepOut();
    expect(state.debug.status).toBe('paused');
  });
});
