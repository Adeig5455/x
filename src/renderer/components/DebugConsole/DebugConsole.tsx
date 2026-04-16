import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';

// ============================================================================
// Debug Console - DAP protocol types, variable inspection, call stack,
// breakpoints, watch expressions, REPL evaluation
// ============================================================================

export type DebugState = 'inactive' | 'running' | 'paused' | 'stopped';

export interface DebugBreakpoint {
  id: string;
  filePath: string;
  line: number;
  column?: number;
  condition?: string;
  hitCount?: number;
  enabled: boolean;
  verified: boolean;
  logMessage?: string;
}

export interface DebugVariable {
  name: string;
  value: string;
  type: string;
  variablesReference: number;
  children?: DebugVariable[];
  isExpanded?: boolean;
  evaluateName?: string;
  presentationHint?: 'property' | 'method' | 'class' | 'data' | 'event' | 'baseClass';
}

export interface DebugStackFrame {
  id: number;
  name: string;
  filePath: string;
  line: number;
  column: number;
  source?: string;
  isSubtle?: boolean;
  moduleId?: string;
}

export interface DebugThread {
  id: number;
  name: string;
  state: 'running' | 'stopped' | 'paused';
  stackFrames: DebugStackFrame[];
}

export interface DebugConsoleEntry {
  id: string;
  type: 'input' | 'output' | 'error' | 'warning' | 'info' | 'group' | 'groupEnd';
  content: string;
  timestamp: number;
  source?: string;
  variables?: DebugVariable[];
  count?: number;
}

export interface WatchExpression {
  id: string;
  expression: string;
  value?: string;
  type?: string;
  hasError?: boolean;
}

interface DebugConsoleProps {
  state: DebugState;
  threads: DebugThread[];
  activeThreadId?: number;
  activeFrameId?: number;
  consoleEntries: DebugConsoleEntry[];
  breakpoints: DebugBreakpoint[];
  watchExpressions: WatchExpression[];
  localVariables: DebugVariable[];
  onEvaluate: (expression: string) => void;
  onContinue: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onPause: () => void;
  onStop: () => void;
  onRestart: () => void;
  onToggleBreakpoint: (id: string) => void;
  onAddWatch: (expression: string) => void;
  onRemoveWatch: (id: string) => void;
  onSelectFrame: (threadId: number, frameId: number) => void;
  onExpandVariable: (variablesReference: number) => void;
}

const DebugToolbar: React.FC<{
  state: DebugState;
  onContinue: () => void;
  onPause: () => void;
  onStepOver: () => void;
  onStepInto: () => void;
  onStepOut: () => void;
  onStop: () => void;
  onRestart: () => void;
}> = ({ state, onContinue, onPause, onStepOver, onStepInto, onStepOut, onStop, onRestart }) => {
  const buttons = [
    { icon: '▶', title: 'Continue (F5)', action: onContinue, disabled: state !== 'paused', color: '#4ec9b0' },
    { icon: '⏸', title: 'Pause (F6)', action: onPause, disabled: state !== 'running', color: '#cca700' },
    { icon: '⤵', title: 'Step Over (F10)', action: onStepOver, disabled: state !== 'paused', color: '#3794ff' },
    { icon: '↓', title: 'Step Into (F11)', action: onStepInto, disabled: state !== 'paused', color: '#3794ff' },
    { icon: '↑', title: 'Step Out (Shift+F11)', action: onStepOut, disabled: state !== 'paused', color: '#3794ff' },
    { icon: '⟳', title: 'Restart (Ctrl+Shift+F5)', action: onRestart, disabled: state === 'inactive', color: '#4ec9b0' },
    { icon: '■', title: 'Stop (Shift+F5)', action: onStop, disabled: state === 'inactive', color: '#f44747' },
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 2,
      padding: '4px 8px',
      background: state === 'paused' ? 'rgba(204, 167, 0, 0.15)' : state === 'running' ? 'rgba(78, 201, 176, 0.1)' : 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color, #3c3c3c)',
    }}>
      <span style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        background: state === 'running' ? '#4ec9b0' : state === 'paused' ? '#cca700' : '#969696',
        marginRight: 8,
      }} />
      <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginRight: 12, textTransform: 'uppercase' }}>
        {state}
      </span>
      {buttons.map((btn) => (
        <button
          key={btn.title}
          onClick={btn.action}
          disabled={btn.disabled}
          title={btn.title}
          style={{
            width: 28,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            borderRadius: 3,
            color: btn.disabled ? 'var(--text-secondary)' : btn.color,
            opacity: btn.disabled ? 0.3 : 1,
            cursor: btn.disabled ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  );
};

const VariableTree: React.FC<{
  variables: DebugVariable[];
  depth?: number;
  onExpand: (ref: number) => void;
}> = ({ variables, depth = 0, onExpand }) => (
  <div>
    {variables.map((v, i) => (
      <div key={`${v.name}-${i}`}>
        <div
          onClick={() => v.variablesReference > 0 && onExpand(v.variablesReference)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '1px 0 1px ' + (depth * 16 + 8) + 'px',
            cursor: v.variablesReference > 0 ? 'pointer' : 'default',
            fontSize: 12,
            fontFamily: 'monospace',
            lineHeight: '20px',
          }}
        >
          {v.variablesReference > 0 && (
            <span style={{ fontSize: 8, width: 12 }}>{v.isExpanded ? '▼' : '▶'}</span>
          )}
          <span style={{ color: v.presentationHint === 'method' ? '#dcdcaa' : '#9cdcfe' }}>{v.name}</span>
          <span style={{ color: 'var(--text-secondary)' }}>:</span>
          <span style={{
            color: v.type === 'string' ? '#ce9178' : v.type === 'number' ? '#b5cea8' : v.type === 'boolean' ? '#569cd6' : '#4ec9b0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {v.value}
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 10, marginLeft: 4 }}>
            {v.type}
          </span>
        </div>
        {v.isExpanded && v.children && (
          <VariableTree variables={v.children} depth={depth + 1} onExpand={onExpand} />
        )}
      </div>
    ))}
  </div>
);

export const DebugConsole: React.FC<DebugConsoleProps> = ({
  state,
  threads,
  consoleEntries,
  breakpoints,
  watchExpressions,
  localVariables,
  onEvaluate,
  onContinue,
  onStepOver,
  onStepInto,
  onStepOut,
  onPause,
  onStop,
  onRestart,
  onToggleBreakpoint,
  onAddWatch,
  onRemoveWatch,
  onSelectFrame,
  onExpandVariable,
}) => {
  const [input, setInput] = useState('');
  const [activeTab, setActiveTab] = useState<'console' | 'variables' | 'watch' | 'callstack' | 'breakpoints'>('console');
  const [watchInput, setWatchInput] = useState('');
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const inputHistory = useRef<string[]>([]);
  const historyIndex = useRef(-1);

  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consoleEntries.length]);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    inputHistory.current.unshift(input);
    historyIndex.current = -1;
    onEvaluate(input);
    setInput('');
  }, [input, onEvaluate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex.current < inputHistory.current.length - 1) {
        historyIndex.current++;
        setInput(inputHistory.current[historyIndex.current]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex.current > 0) {
        historyIndex.current--;
        setInput(inputHistory.current[historyIndex.current]);
      } else {
        historyIndex.current = -1;
        setInput('');
      }
    }
  }, [handleSubmit]);

  const tabs = [
    { id: 'console' as const, label: 'Console', count: consoleEntries.length },
    { id: 'variables' as const, label: 'Variables', count: localVariables.length },
    { id: 'watch' as const, label: 'Watch', count: watchExpressions.length },
    { id: 'callstack' as const, label: 'Call Stack', count: threads.reduce((s, t) => s + t.stackFrames.length, 0) },
    { id: 'breakpoints' as const, label: 'Breakpoints', count: breakpoints.length },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary, #1e1e1e)' }}>
      <DebugToolbar
        state={state}
        onContinue={onContinue}
        onPause={onPause}
        onStepOver={onStepOver}
        onStepInto={onStepInto}
        onStepOut={onStepOut}
        onStop={onStop}
        onRestart={onRestart}
      />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color, #3c3c3c)' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '4px 12px',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--accent-color)' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 11,
              textTransform: 'uppercase',
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{ marginLeft: 4, opacity: 0.6 }}>({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {activeTab === 'console' && (
          <div style={{ fontFamily: 'monospace', fontSize: 12, padding: 4 }}>
            {consoleEntries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  display: 'flex',
                  gap: 8,
                  padding: '2px 8px',
                  borderBottom: '1px solid rgba(60,60,60,0.3)',
                  background:
                    entry.type === 'error' ? 'rgba(244,71,71,0.08)' :
                    entry.type === 'warning' ? 'rgba(204,167,0,0.08)' :
                    entry.type === 'input' ? 'rgba(55,148,255,0.05)' : 'transparent',
                }}
              >
                <span style={{
                  color: entry.type === 'error' ? '#f44747' :
                    entry.type === 'warning' ? '#cca700' :
                    entry.type === 'input' ? '#569cd6' :
                    entry.type === 'info' ? '#3794ff' : 'var(--text-primary)',
                  minWidth: 14,
                  fontSize: 10,
                }}>
                  {entry.type === 'input' ? '>' : entry.type === 'error' ? '✕' : entry.type === 'warning' ? '⚠' : '·'}
                </span>
                <span style={{
                  color: entry.type === 'error' ? '#f44747' :
                    entry.type === 'warning' ? '#cca700' : 'var(--text-primary, #ccc)',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  flex: 1,
                }}>
                  {entry.content}
                </span>
                {entry.count && entry.count > 1 && (
                  <span style={{
                    minWidth: 18,
                    height: 16,
                    borderRadius: 8,
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-secondary)',
                    fontSize: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                  }}>
                    {entry.count}
                  </span>
                )}
              </div>
            ))}
            <div ref={consoleEndRef} />
          </div>
        )}

        {activeTab === 'variables' && (
          <VariableTree variables={localVariables} onExpand={onExpandVariable} />
        )}

        {activeTab === 'watch' && (
          <div style={{ padding: 4 }}>
            <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid var(--border-color)' }}>
              <input
                value={watchInput}
                onChange={(e) => setWatchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && watchInput.trim()) {
                    onAddWatch(watchInput.trim());
                    setWatchInput('');
                  }
                }}
                placeholder="Add watch expression..."
                style={{
                  flex: 1,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '3px 8px',
                  borderRadius: 3,
                  fontSize: 12,
                  fontFamily: 'monospace',
                  outline: 'none',
                }}
              />
            </div>
            {watchExpressions.map((w) => (
              <div key={w.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '2px 8px',
                fontFamily: 'monospace',
                fontSize: 12,
                lineHeight: '22px',
              }}>
                <span style={{ color: '#9cdcfe' }}>{w.expression}</span>
                <span style={{ color: 'var(--text-secondary)' }}>=</span>
                <span style={{ color: w.hasError ? '#f44747' : '#ce9178', flex: 1 }}>{w.value ?? 'not available'}</span>
                <button
                  onClick={() => onRemoveWatch(w.id)}
                  style={{ background: 'none', border: 'none', color: '#f44747', cursor: 'pointer', fontSize: 12 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'callstack' && (
          <div style={{ padding: 4 }}>
            {threads.map((thread) => (
              <div key={thread.id}>
                <div style={{
                  padding: '4px 8px',
                  fontWeight: 600,
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  textTransform: 'uppercase',
                  background: 'var(--bg-tertiary)',
                }}>
                  Thread {thread.id}: {thread.name} [{thread.state}]
                </div>
                {thread.stackFrames.map((frame) => (
                  <div
                    key={frame.id}
                    onClick={() => onSelectFrame(thread.id, frame.id)}
                    style={{
                      padding: '2px 8px 2px 24px',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontFamily: 'monospace',
                      lineHeight: '20px',
                      color: frame.isSubtle ? 'var(--text-secondary)' : 'var(--text-primary)',
                      opacity: frame.isSubtle ? 0.6 : 1,
                    }}
                  >
                    <span style={{ color: '#dcdcaa' }}>{frame.name}</span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: 10 }}>
                      {frame.filePath}:{frame.line}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'breakpoints' && (
          <div style={{ padding: 4 }}>
            {breakpoints.map((bp) => (
              <div key={bp.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '2px 8px',
                fontSize: 12,
                fontFamily: 'monospace',
                lineHeight: '22px',
              }}>
                <input
                  type="checkbox"
                  checked={bp.enabled}
                  onChange={() => onToggleBreakpoint(bp.id)}
                  style={{ accentColor: 'var(--accent-color)' }}
                />
                <span style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: bp.verified ? '#f44747' : '#969696',
                  flexShrink: 0,
                }} />
                <span style={{ color: 'var(--text-primary)', flex: 1 }}>
                  {bp.filePath.split('/').pop()}:{bp.line}
                </span>
                {bp.condition && (
                  <span style={{ color: '#cca700', fontSize: 10 }}>if: {bp.condition}</span>
                )}
                {bp.hitCount != null && (
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>hits: {bp.hitCount}</span>
                )}
              </div>
            ))}
            {breakpoints.length === 0 && (
              <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 12 }}>
                No breakpoints set
              </div>
            )}
          </div>
        )}
      </div>

      {/* REPL Input */}
      {activeTab === 'console' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          borderTop: '1px solid var(--border-color, #3c3c3c)',
          padding: '4px 8px',
        }}>
          <span style={{ color: '#569cd6', marginRight: 8, fontFamily: 'monospace', fontSize: 12 }}>{'>'}</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Evaluate expression..."
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              fontFamily: 'monospace',
              fontSize: 12,
              outline: 'none',
            }}
          />
        </div>
      )}
    </div>
  );
};
