import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Enhanced Bottom Panel - Terminal multiplexer, Output, Problems tabs
// ============================================================================

type PanelTab = 'terminal' | 'output' | 'problems' | 'debug-console';

interface TerminalInstance {
  id: string;
  name: string;
  shellType: 'bash' | 'zsh' | 'powershell' | 'cmd' | 'fish';
  cwd: string;
  history: TerminalLine[];
  exitCode?: number;
}

interface TerminalLine {
  id: string;
  content: string;
  type: 'input' | 'output' | 'error' | 'system';
  timestamp: number;
}

interface Problem {
  severity: 'error' | 'warning' | 'info' | 'hint';
  message: string;
  source: string;
  filePath: string;
  line: number;
  column: number;
  code?: string;
}

interface BottomPanelProps {
  visible: boolean;
  height: number;
  onResize?: (height: number) => void;
  onClose?: () => void;
  problems?: Problem[];
  outputLines?: string[];
}

const SHELL_TYPES = [
  { id: 'bash', label: 'Bash', icon: '$' },
  { id: 'zsh', label: 'Zsh', icon: '%' },
  { id: 'powershell', label: 'PowerShell', icon: 'PS>' },
  { id: 'fish', label: 'Fish', icon: '>' },
] as const;

let terminalIdCounter = 0;

const createTerminal = (shellType: TerminalInstance['shellType'] = 'bash'): TerminalInstance => ({
  id: `term-${++terminalIdCounter}`,
  name: `${shellType} ${terminalIdCounter}`,
  shellType,
  cwd: '~/project',
  history: [{
    id: `line-${Date.now()}`,
    content: `Welcome to Cursor IDE Terminal (${shellType})`,
    type: 'system',
    timestamp: Date.now(),
  }],
});

export const BottomPanel: React.FC<BottomPanelProps> = ({
  visible,
  height,
  onResize,
  onClose,
  problems = [],
  outputLines = [],
}) => {
  const [activeTab, setActiveTab] = useState<PanelTab>('terminal');
  const [terminals, setTerminals] = useState<TerminalInstance[]>(() => [createTerminal()]);
  const [activeTerminalId, setActiveTerminalId] = useState<string>('term-1');
  const [inputValue, setInputValue] = useState('');
  const [isResizing, setIsResizing] = useState(false);
  const [problemFilter, setProblemFilter] = useState<'all' | 'errors' | 'warnings'>('all');
  const [showTerminalDropdown, setShowTerminalDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<number>(0);

  const activeTerminal = terminals.find((t) => t.id === activeTerminalId) || terminals[0];

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [activeTerminal?.history.length]);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeRef.current = e.clientY;
    const handleMouseMove = (ev: MouseEvent) => {
      const delta = resizeRef.current - ev.clientY;
      resizeRef.current = ev.clientY;
      onResize?.(Math.max(100, Math.min(600, height + delta)));
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [height, onResize]);

  const handleCommand = useCallback((command: string) => {
    if (!command.trim()) return;
    setTerminals((prev) =>
      prev.map((t) => {
        if (t.id !== activeTerminalId) return t;
        const newHistory = [...t.history];
        newHistory.push({ id: `line-${Date.now()}-in`, content: `${t.cwd} $ ${command}`, type: 'input', timestamp: Date.now() });
        let output = '';
        const cmd = command.trim().split(' ')[0];
        switch (cmd) {
          case 'clear': return { ...t, history: [] };
          case 'pwd': output = t.cwd; break;
          case 'echo': output = command.slice(5); break;
          case 'ls': output = 'src/  node_modules/  package.json  tsconfig.json  README.md'; break;
          case 'whoami': output = 'developer'; break;
          case 'date': output = new Date().toString(); break;
          case 'help': output = 'Available: clear, pwd, echo, ls, whoami, date, help, exit'; break;
          case 'exit': return { ...t, history: [...newHistory, { id: `line-${Date.now()}-out`, content: 'Process exited with code 0', type: 'system' as const, timestamp: Date.now() }], exitCode: 0 };
          default: output = `Command simulated: ${command}\n(Connect real PTY via IPC for full terminal)`;
        }
        if (output) newHistory.push({ id: `line-${Date.now()}-out`, content: output, type: 'output', timestamp: Date.now() });
        return { ...t, history: newHistory };
      })
    );
    setInputValue('');
  }, [activeTerminalId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCommand(inputValue);
    else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setTerminals((prev) => prev.map((t) => t.id === activeTerminalId ? { ...t, history: [] } : t));
    }
  }, [inputValue, handleCommand, activeTerminalId]);

  const addTerminal = useCallback((shellType: TerminalInstance['shellType'] = 'bash') => {
    const newTerm = createTerminal(shellType);
    setTerminals((prev) => [...prev, newTerm]);
    setActiveTerminalId(newTerm.id);
    setShowTerminalDropdown(false);
  }, []);

  const removeTerminal = useCallback((id: string) => {
    setTerminals((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (filtered.length === 0) { const n = createTerminal(); setActiveTerminalId(n.id); return [n]; }
      if (id === activeTerminalId) setActiveTerminalId(filtered[0].id);
      return filtered;
    });
  }, [activeTerminalId]);

  const filteredProblems = problems.filter((p) => {
    if (problemFilter === 'errors') return p.severity === 'error';
    if (problemFilter === 'warnings') return p.severity === 'warning';
    return true;
  });
  const errorCount = problems.filter((p) => p.severity === 'error').length;
  const warningCount = problems.filter((p) => p.severity === 'warning').length;

  if (!visible) return null;

  const tabStyle = (tab: PanelTab): React.CSSProperties => ({
    padding: '4px 12px', cursor: 'pointer', fontSize: 12,
    color: activeTab === tab ? 'var(--foreground, #ccc)' : 'var(--foreground-muted, #888)',
    borderBottom: activeTab === tab ? '1px solid var(--accent, #007acc)' : '1px solid transparent',
    background: 'transparent', border: 'none', textTransform: 'uppercase', letterSpacing: 0.5,
    fontWeight: activeTab === tab ? 600 : 400,
  });

  const getLineColor = (type: TerminalLine['type']): string => {
    switch (type) {
      case 'input': return 'var(--terminal-ansi-bright-green, #4ec9b0)';
      case 'error': return 'var(--terminal-ansi-red, #f44747)';
      case 'system': return 'var(--terminal-ansi-bright-yellow, #dcdcaa)';
      default: return 'var(--terminal-foreground, #d4d4d4)';
    }
  };

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', background: 'var(--panel-background, #1e1e1e)', borderTop: '1px solid var(--panel-border, #333)' }}>
      <div onMouseDown={handleResizeStart} style={{ height: 4, cursor: 'ns-resize', background: isResizing ? 'var(--accent, #007acc)' : 'transparent', flexShrink: 0 }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--panel-border, #333)', flexShrink: 0, height: 35, padding: '0 8px' }}>
        <div style={{ display: 'flex', gap: 0 }}>
          <button style={tabStyle('terminal')} onClick={() => setActiveTab('terminal')}>Terminal</button>
          <button style={tabStyle('output')} onClick={() => setActiveTab('output')}>Output</button>
          <button style={tabStyle('problems')} onClick={() => setActiveTab('problems')}>
            Problems{problems.length > 0 && <span style={{ marginLeft: 4, background: errorCount > 0 ? 'var(--error, #f44747)' : 'var(--warning, #cca700)', color: '#fff', borderRadius: 8, padding: '0 5px', fontSize: 10 }}>{problems.length}</span>}
          </button>
          <button style={tabStyle('debug-console')} onClick={() => setActiveTab('debug-console')}>Debug Console</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {activeTab === 'terminal' && (
            <>
              {terminals.map((t) => (
                <div key={t.id} onClick={() => setActiveTerminalId(t.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 3, fontSize: 11, cursor: 'pointer', background: t.id === activeTerminalId ? 'var(--list-active-background, #37373d)' : 'transparent', color: t.id === activeTerminalId ? 'var(--foreground, #ccc)' : 'var(--foreground-muted, #888)' }}>
                  <span>{t.name}</span>
                  <span onClick={(e) => { e.stopPropagation(); removeTerminal(t.id); }} style={{ cursor: 'pointer', opacity: 0.5, fontSize: 10 }}>x</span>
                </div>
              ))}
              <div style={{ position: 'relative' }}>
                <button onClick={() => setShowTerminalDropdown(!showTerminalDropdown)} style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted, #888)', cursor: 'pointer', fontSize: 16, padding: '2px 6px' }} title="New Terminal">+</button>
                {showTerminalDropdown && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--dropdown-background, #252526)', border: '1px solid var(--dropdown-border, #454545)', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.3)', zIndex: 100, minWidth: 150 }}>
                    {SHELL_TYPES.map((shell) => (
                      <div key={shell.id} onClick={() => addTerminal(shell.id as TerminalInstance['shellType'])} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--foreground, #ccc)' }}>
                        <span style={{ fontFamily: 'monospace', opacity: 0.6, width: 24 }}>{shell.icon}</span>
                        <span>{shell.label}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted, #888)', cursor: 'pointer', fontSize: 14, padding: '2px 6px' }} title="Close Panel">x</button>
        </div>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'terminal' && activeTerminal && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', fontFamily: "'Fira Code', Consolas, monospace", fontSize: 13 }}>
            <div ref={outputRef} style={{ flex: 1, overflow: 'auto', padding: '8px 12px', lineHeight: 1.5 }} onClick={() => inputRef.current?.focus()}>
              {activeTerminal.history.map((line) => (
                <div key={line.id} style={{ color: getLineColor(line.type), whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line.content}</div>
              ))}
            </div>
            {activeTerminal.exitCode === undefined && (
              <div style={{ display: 'flex', alignItems: 'center', padding: '4px 12px', borderTop: '1px solid var(--panel-border, #333)', gap: 8 }}>
                <span style={{ color: 'var(--terminal-ansi-bright-green, #4ec9b0)', fontSize: 12, flexShrink: 0 }}>{activeTerminal.cwd} $</span>
                <input ref={inputRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--terminal-foreground, #d4d4d4)', fontFamily: 'inherit', fontSize: 13 }} autoFocus spellCheck={false} />
              </div>
            )}
          </div>
        )}
        {activeTab === 'output' && (
          <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>
            {outputLines.length === 0 ? <div style={{ color: 'var(--foreground-muted, #888)', textAlign: 'center', paddingTop: 20 }}>No output</div>
              : outputLines.map((line, i) => <div key={i} style={{ color: 'var(--foreground, #ccc)', lineHeight: 1.5 }}>{line}</div>)}
          </div>
        )}
        {activeTab === 'problems' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', gap: 8, padding: '4px 12px', borderBottom: '1px solid var(--panel-border, #333)' }}>
              {(['all', 'errors', 'warnings'] as const).map((f) => (
                <button key={f} onClick={() => setProblemFilter(f)} style={{ background: problemFilter === f ? 'var(--button-background, #0e639c)' : 'transparent', border: 'none', color: 'var(--foreground, #ccc)', padding: '2px 8px', borderRadius: 3, cursor: 'pointer', fontSize: 11 }}>
                  {f === 'all' ? `All (${problems.length})` : f === 'errors' ? `Errors (${errorCount})` : `Warnings (${warningCount})`}
                </button>
              ))}
            </div>
            <div style={{ flex: 1, overflow: 'auto' }}>
              {filteredProblems.length === 0 ? <div style={{ color: 'var(--foreground-muted, #888)', textAlign: 'center', paddingTop: 20, fontSize: 12 }}>No problems detected</div>
                : filteredProblems.map((p, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 12px', fontSize: 12, cursor: 'pointer', borderBottom: '1px solid var(--list-separator, #222)' }}>
                    <span style={{ color: p.severity === 'error' ? 'var(--error, #f44747)' : p.severity === 'warning' ? 'var(--warning, #cca700)' : 'var(--info, #75beff)', flexShrink: 0 }}>
                      {p.severity === 'error' ? '!' : p.severity === 'warning' ? '!' : 'i'}
                    </span>
                    <span style={{ color: 'var(--foreground, #ccc)', flex: 1 }}>{p.message}</span>
                    <span style={{ color: 'var(--foreground-muted, #888)' }}>{p.source}</span>
                    <span style={{ color: 'var(--foreground-muted, #666)', fontFamily: 'monospace' }}>[{p.line}:{p.column}]</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        {activeTab === 'debug-console' && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'var(--foreground-muted, #888)', fontSize: 12 }}>Debug console available when debug session is active</span>
          </div>
        )}
      </div>
    </div>
  );
};
