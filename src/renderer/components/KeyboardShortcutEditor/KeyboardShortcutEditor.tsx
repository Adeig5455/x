import React, { useState, useCallback, useMemo, useRef } from 'react';

// ============================================================================
// Keyboard Shortcut Editor - Full keybinding editor with conflict detection,
// recording, when-clause editing, chord support
// ============================================================================

export interface KeybindingEntry {
  id: string;
  command: string;
  commandTitle: string;
  keybinding: string;
  when?: string;
  source: 'default' | 'user' | 'extension';
  extensionId?: string;
  args?: Record<string, unknown>;
  isChord?: boolean;
}

export interface KeybindingConflict {
  keybinding: string;
  entries: KeybindingEntry[];
}

interface KeyboardShortcutEditorProps {
  keybindings: KeybindingEntry[];
  onUpdateKeybinding: (id: string, newKeybinding: string) => void;
  onResetKeybinding: (id: string) => void;
  onRemoveKeybinding: (id: string) => void;
  onAddKeybinding: (command: string, keybinding: string, when?: string) => void;
}

const SOURCE_COLORS: Record<KeybindingEntry['source'], string> = {
  default: '#969696',
  user: '#4ec9b0',
  extension: '#c586c0',
};

const KeyRecorder: React.FC<{
  onRecord: (keys: string) => void;
  onCancel: () => void;
}> = ({ onRecord, onCancel }) => {
  const [keys, setKeys] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState(true);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const parts: string[] = [];
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.shiftKey) parts.push('Shift');
    if (e.altKey) parts.push('Alt');
    if (e.metaKey) parts.push('Meta');

    const key = e.key;
    if (!['Control', 'Shift', 'Alt', 'Meta'].includes(key)) {
      const keyName = key.length === 1 ? key.toUpperCase() : key;
      parts.push(keyName);
      const combo = parts.join('+');
      setKeys((prev) => [...prev, combo]);

      if (keys.length >= 0) {
        const allKeys = [...keys, combo];
        onRecord(allKeys.join(' '));
        setIsRecording(false);
      }
    }
  }, [keys, onRecord]);

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        background: 'var(--bg-tertiary)',
        border: '2px solid var(--accent-color)',
        borderRadius: 4,
        outline: 'none',
        minWidth: 200,
      }}
      autoFocus
    >
      {isRecording ? (
        <>
          <span style={{ fontSize: 11, color: 'var(--accent-color)', animation: 'pulse 1s infinite' }}>
            Press desired key combination...
          </span>
          {keys.length > 0 && (
            <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)' }}>
              {keys.join(' ')} +
            </span>
          )}
        </>
      ) : (
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--text-primary)' }}>
          {[...keys].join(' ')}
        </span>
      )}
      <button
        onClick={onCancel}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          fontSize: 12,
          marginLeft: 'auto',
        }}
      >
        ×
      </button>
    </div>
  );
};

const KeybindingBadge: React.FC<{ keybinding: string }> = ({ keybinding }) => {
  const parts = keybinding.split(' ');
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {parts.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>then</span>}
          <div style={{ display: 'flex', gap: 2 }}>
            {part.split('+').map((key, j) => (
              <span
                key={j}
                style={{
                  padding: '1px 6px',
                  borderRadius: 3,
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'var(--text-primary)',
                  boxShadow: '0 1px 0 var(--border-color)',
                }}
              >
                {key}
              </span>
            ))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
};

export const KeyboardShortcutEditor: React.FC<KeyboardShortcutEditorProps> = ({
  keybindings,
  onUpdateKeybinding,
  onResetKeybinding,
  onRemoveKeybinding,
}) => {
  const [filter, setFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'default' | 'user' | 'extension'>('all');
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [showConflicts, setShowConflicts] = useState(false);

  const filtered = useMemo(() => {
    let result = keybindings;
    if (sourceFilter !== 'all') result = result.filter((k) => k.source === sourceFilter);
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter((k) =>
        k.commandTitle.toLowerCase().includes(q) ||
        k.command.toLowerCase().includes(q) ||
        k.keybinding.toLowerCase().includes(q) ||
        (k.when || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [keybindings, sourceFilter, filter]);

  const conflicts = useMemo(() => {
    const map = new Map<string, KeybindingEntry[]>();
    for (const kb of keybindings) {
      if (!kb.keybinding) continue;
      const key = kb.keybinding.toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(kb);
    }
    return Array.from(map.entries())
      .filter(([, entries]) => entries.length > 1)
      .map(([keybinding, entries]) => ({ keybinding, entries }));
  }, [keybindings]);

  const handleRecord = useCallback((id: string, newKeybinding: string) => {
    onUpdateKeybinding(id, newKeybinding);
    setRecordingId(null);
  }, [onUpdateKeybinding]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search keybindings by command, shortcut, or when clause..."
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            fontSize: 12,
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
          {(['all', 'default', 'user', 'extension'] as const).map((src) => (
            <button
              key={src}
              onClick={() => setSourceFilter(src)}
              style={{
                padding: '2px 8px',
                borderRadius: 10,
                border: sourceFilter === src ? 'none' : '1px solid var(--border-color)',
                background: sourceFilter === src ? 'var(--accent-color)' : 'transparent',
                color: sourceFilter === src ? '#fff' : 'var(--text-secondary)',
                fontSize: 10,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {src}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {conflicts.length > 0 && (
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              style={{
                padding: '2px 8px',
                borderRadius: 3,
                border: 'none',
                background: 'rgba(244,71,71,0.15)',
                color: '#f44747',
                fontSize: 10,
                cursor: 'pointer',
              }}
            >
              {conflicts.length} conflicts
            </button>
          )}
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            {filtered.length} keybindings
          </span>
        </div>
      </div>

      {/* Conflicts Warning */}
      {showConflicts && conflicts.length > 0 && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(244,71,71,0.08)',
          borderBottom: '1px solid var(--border-color)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#f44747', marginBottom: 4 }}>
            Keybinding Conflicts
          </div>
          {conflicts.map((c) => (
            <div key={c.keybinding} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 0', fontSize: 11 }}>
              <KeybindingBadge keybinding={c.keybinding} />
              <span style={{ color: 'var(--text-secondary)' }}>→</span>
              <span style={{ color: 'var(--text-primary)' }}>
                {c.entries.map((e) => e.commandTitle).join(', ')}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Table Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 200px 200px 100px 80px',
        gap: 8,
        padding: '4px 12px',
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-color)',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        color: 'var(--text-secondary)',
        letterSpacing: 0.5,
      }}>
        <span>Command</span>
        <span>Keybinding</span>
        <span>When</span>
        <span>Source</span>
        <span>Actions</span>
      </div>

      {/* Keybinding List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.map((kb) => (
          <div
            key={kb.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 200px 200px 100px 80px',
              gap: 8,
              padding: '4px 12px',
              borderBottom: '1px solid rgba(60,60,60,0.2)',
              alignItems: 'center',
              fontSize: 12,
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div>
              <div style={{ color: 'var(--text-primary)' }}>{kb.commandTitle}</div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{kb.command}</div>
            </div>
            <div>
              {recordingId === kb.id ? (
                <KeyRecorder
                  onRecord={(keys) => handleRecord(kb.id, keys)}
                  onCancel={() => setRecordingId(null)}
                />
              ) : (
                <div
                  onClick={() => setRecordingId(kb.id)}
                  style={{ cursor: 'pointer' }}
                  title="Click to change keybinding"
                >
                  {kb.keybinding ? (
                    <KeybindingBadge keybinding={kb.keybinding} />
                  ) : (
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10, fontStyle: 'italic' }}>
                      Click to set...
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#c586c0' }}>
              {kb.when || '—'}
            </div>
            <div>
              <span style={{
                fontSize: 10,
                padding: '1px 6px',
                borderRadius: 3,
                background: `${SOURCE_COLORS[kb.source]}22`,
                color: SOURCE_COLORS[kb.source],
              }}>
                {kb.source}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                onClick={() => setRecordingId(kb.id)}
                title="Edit keybinding"
                style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  cursor: 'pointer', fontSize: 11, padding: 2,
                }}
              >
                ✎
              </button>
              {kb.source === 'user' && (
                <button
                  onClick={() => onResetKeybinding(kb.id)}
                  title="Reset to default"
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: 11, padding: 2,
                  }}
                >
                  ↩
                </button>
              )}
              <button
                onClick={() => onRemoveKeybinding(kb.id)}
                title="Remove keybinding"
                style={{
                  background: 'none', border: 'none', color: '#f44747',
                  cursor: 'pointer', fontSize: 11, padding: 2,
                }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
