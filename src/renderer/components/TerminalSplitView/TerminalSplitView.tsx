import React, { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Terminal Split View - Multiple terminal panes with drag-drop, split, resize
// ============================================================================

export type SplitDirection = 'horizontal' | 'vertical';

export interface TerminalPane {
  id: string;
  title: string;
  shellType: 'bash' | 'zsh' | 'powershell' | 'cmd' | 'fish' | 'node' | 'python';
  cwd: string;
  pid?: number;
  isActive: boolean;
  exitCode?: number;
  output: string[];
  env?: Record<string, string>;
  profile?: string;
}

export interface SplitNode {
  id: string;
  type: 'leaf' | 'split';
  direction?: SplitDirection;
  ratio?: number; // 0-1 ratio for first child
  children?: SplitNode[];
  paneId?: string; // only for leaf nodes
}

interface TerminalSplitViewProps {
  panes: TerminalPane[];
  layout: SplitNode;
  activePaneId: string;
  onActivatePane: (id: string) => void;
  onClosePane: (id: string) => void;
  onSplitPane: (id: string, direction: SplitDirection) => void;
  onCreatePane: (shellType: TerminalPane['shellType']) => void;
  onResizeSplit: (splitId: string, ratio: number) => void;
  onRenamePane: (id: string, title: string) => void;
  onInput: (paneId: string, data: string) => void;
  onDragPane: (fromId: string, toId: string) => void;
}

const SHELL_ICONS: Record<TerminalPane['shellType'], { icon: string; color: string }> = {
  bash: { icon: '$', color: '#4ec9b0' },
  zsh: { icon: '%', color: '#c586c0' },
  powershell: { icon: 'PS', color: '#569cd6' },
  cmd: { icon: '>', color: '#cca700' },
  fish: { icon: '><>', color: '#f44747' },
  node: { icon: 'N', color: '#4ec9b0' },
  python: { icon: '>>>', color: '#3776ab' },
};

const TerminalPaneView: React.FC<{
  pane: TerminalPane;
  isActive: boolean;
  onActivate: () => void;
  onClose: () => void;
  onSplit: (dir: SplitDirection) => void;
  onInput: (data: string) => void;
  onRename: (title: string) => void;
}> = ({ pane, isActive, onActivate, onClose, onSplit, onInput, onRename }) => {
  const [inputValue, setInputValue] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(pane.title);
  const shellInfo = SHELL_ICONS[pane.shellType];

  const handleSubmit = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onInput(inputValue);
      setInputValue('');
    }
  }, [inputValue, onInput]);

  return (
    <div
      onClick={onActivate}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        border: isActive ? '1px solid var(--accent-color)' : '1px solid var(--border-color)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Pane header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '2px 6px',
        background: isActive ? 'var(--bg-active)' : 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        cursor: 'grab',
        minHeight: 24,
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, color: shellInfo.color,
          background: `${shellInfo.color}22`, padding: '0 3px', borderRadius: 2,
          fontFamily: 'monospace',
        }}>{shellInfo.icon}</span>

        {isRenaming ? (
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => { onRename(renameValue); setIsRenaming(false); }}
            onKeyDown={(e) => { if (e.key === 'Enter') { onRename(renameValue); setIsRenaming(false); } }}
            autoFocus
            style={{
              flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--accent-color)',
              borderRadius: 2, color: 'var(--text-primary)', fontSize: 10, padding: '0 4px',
              outline: 'none',
            }}
          />
        ) : (
          <span
            onDoubleClick={() => setIsRenaming(true)}
            style={{ flex: 1, fontSize: 10, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {pane.title}
          </span>
        )}

        <span style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
          {pane.cwd.split('/').pop()}
        </span>

        {pane.exitCode != null && (
          <span style={{
            fontSize: 8, padding: '0 3px', borderRadius: 2,
            background: pane.exitCode === 0 ? 'rgba(78,201,176,0.15)' : 'rgba(244,71,71,0.15)',
            color: pane.exitCode === 0 ? '#4ec9b0' : '#f44747',
          }}>
            exit {pane.exitCode}
          </span>
        )}

        <button onClick={(e) => { e.stopPropagation(); onSplit('horizontal'); }} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10, padding: 1,
        }} title="Split Right">⇥</button>
        <button onClick={(e) => { e.stopPropagation(); onSplit('vertical'); }} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10, padding: 1,
        }} title="Split Down">⇩</button>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} style={{
          background: 'none', border: 'none', color: '#f44747', cursor: 'pointer', fontSize: 12, padding: 1,
        }}>×</button>
      </div>

      {/* Terminal output */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '4px 8px',
        background: '#0d0d0d', fontFamily: 'monospace', fontSize: 12,
        lineHeight: '18px', color: '#cccccc',
      }}>
        {pane.output.map((line, i) => (
          <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {line}
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'center', padding: '2px 4px',
        background: '#0d0d0d', borderTop: '1px solid #333',
      }}>
        <span style={{ color: shellInfo.color, fontSize: 11, fontFamily: 'monospace', marginRight: 4 }}>
          {shellInfo.icon}
        </span>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleSubmit}
          style={{
            flex: 1, background: 'transparent', border: 'none',
            color: '#cccccc', fontSize: 12, fontFamily: 'monospace',
            outline: 'none',
          }}
          placeholder="Type command..."
        />
      </div>
    </div>
  );
};

const SplitNodeRenderer: React.FC<{
  node: SplitNode;
  panes: TerminalPane[];
  activePaneId: string;
  onActivatePane: (id: string) => void;
  onClosePane: (id: string) => void;
  onSplitPane: (id: string, dir: SplitDirection) => void;
  onInput: (paneId: string, data: string) => void;
  onRenamePane: (id: string, title: string) => void;
}> = ({ node, panes, activePaneId, onActivatePane, onClosePane, onSplitPane, onInput, onRenamePane }) => {
  if (node.type === 'leaf' && node.paneId) {
    const pane = panes.find((p) => p.id === node.paneId);
    if (!pane) return null;
    return (
      <TerminalPaneView
        pane={pane}
        isActive={activePaneId === pane.id}
        onActivate={() => onActivatePane(pane.id)}
        onClose={() => onClosePane(pane.id)}
        onSplit={(dir) => onSplitPane(pane.id, dir)}
        onInput={(data) => onInput(pane.id, data)}
        onRename={(title) => onRenamePane(pane.id, title)}
      />
    );
  }

  if (node.type === 'split' && node.children && node.children.length >= 2) {
    const ratio = node.ratio || 0.5;
    const isHorizontal = node.direction === 'horizontal';

    return (
      <div style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        height: '100%',
        gap: 2,
      }}>
        <div style={{
          [isHorizontal ? 'width' : 'height']: `${ratio * 100}%`,
          overflow: 'hidden',
        }}>
          <SplitNodeRenderer
            node={node.children[0]}
            panes={panes}
            activePaneId={activePaneId}
            onActivatePane={onActivatePane}
            onClosePane={onClosePane}
            onSplitPane={onSplitPane}
            onInput={onInput}
            onRenamePane={onRenamePane}
          />
        </div>
        {/* Resize handle */}
        <div style={{
          [isHorizontal ? 'width' : 'height']: 4,
          background: 'var(--border-color)',
          cursor: isHorizontal ? 'col-resize' : 'row-resize',
          flexShrink: 0,
        }} />
        <div style={{
          flex: 1,
          overflow: 'hidden',
        }}>
          <SplitNodeRenderer
            node={node.children[1]}
            panes={panes}
            activePaneId={activePaneId}
            onActivatePane={onActivatePane}
            onClosePane={onClosePane}
            onSplitPane={onSplitPane}
            onInput={onInput}
            onRenamePane={onRenamePane}
          />
        </div>
      </div>
    );
  }

  return null;
};

export const TerminalSplitView: React.FC<TerminalSplitViewProps> = ({
  panes,
  layout,
  activePaneId,
  onActivatePane,
  onClosePane,
  onSplitPane,
  onCreatePane,
  onInput,
  onRenamePane,
}) => {
  const [showNewTerminalMenu, setShowNewTerminalMenu] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '2px 6px',
        borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
      }}>
        {/* Pane tabs */}
        {panes.map((pane) => {
          const shellInfo = SHELL_ICONS[pane.shellType];
          return (
            <button
              key={pane.id}
              onClick={() => onActivatePane(pane.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 3, padding: '2px 8px',
                borderRadius: 3, border: 'none', fontSize: 10, cursor: 'pointer',
                background: activePaneId === pane.id ? 'var(--bg-active)' : 'transparent',
                color: activePaneId === pane.id ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <span style={{ color: shellInfo.color, fontFamily: 'monospace', fontSize: 8 }}>{shellInfo.icon}</span>
              {pane.title}
            </button>
          );
        })}

        <div style={{ flex: 1 }} />

        {/* New terminal button */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowNewTerminalMenu(!showNewTerminalMenu)}
            style={{
              background: 'none', border: 'none', color: 'var(--accent-color)',
              cursor: 'pointer', fontSize: 14,
            }}
            title="New Terminal"
          >
            +
          </button>
          {showNewTerminalMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)', borderRadius: 4, padding: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)', zIndex: 100, minWidth: 140,
            }}>
              {(Object.entries(SHELL_ICONS) as Array<[TerminalPane['shellType'], typeof SHELL_ICONS[TerminalPane['shellType']]]>).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => { onCreatePane(type); setShowNewTerminalMenu(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, width: '100%',
                    padding: '4px 8px', borderRadius: 2, border: 'none', fontSize: 11,
                    background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: info.color, fontFamily: 'monospace', fontSize: 9, width: 20 }}>{info.icon}</span>
                  {type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Split layout */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 2 }}>
        {panes.length === 0 ? (
          <div style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-secondary)', fontSize: 12,
          }}>
            No terminal open. Click + to create one.
          </div>
        ) : (
          <SplitNodeRenderer
            node={layout}
            panes={panes}
            activePaneId={activePaneId}
            onActivatePane={onActivatePane}
            onClosePane={onClosePane}
            onSplitPane={onSplitPane}
            onInput={onInput}
            onRenamePane={onRenamePane}
          />
        )}
      </div>
    </div>
  );
};
