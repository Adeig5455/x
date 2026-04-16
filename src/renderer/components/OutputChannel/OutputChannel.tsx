import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// Output Channel - Multi-channel logging with filtering, search, auto-scroll
// ============================================================================

export interface OutputEntry {
  id: string;
  timestamp: number;
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error';
  message: string;
  channel: string;
  metadata?: Record<string, string>;
}

export interface OutputChannelDef {
  id: string;
  name: string;
  language?: string;
  isActive: boolean;
}

interface OutputChannelProps {
  channels: OutputChannelDef[];
  entries: OutputEntry[];
  activeChannelId: string;
  onChannelChange: (id: string) => void;
  onClear: (channelId: string) => void;
  onClose: (channelId: string) => void;
  onToggleLock?: () => void;
  isLocked?: boolean;
}

const LEVEL_STYLES: Record<OutputEntry['level'], { color: string; icon: string }> = {
  trace: { color: '#969696', icon: '·' },
  debug: { color: '#569cd6', icon: '◇' },
  info: { color: '#4ec9b0', icon: '●' },
  warn: { color: '#cca700', icon: '▲' },
  error: { color: '#f44747', icon: '✕' },
};

export const OutputChannel: React.FC<OutputChannelProps> = ({
  channels,
  entries,
  activeChannelId,
  onChannelChange,
  onClear,
  onClose,
  onToggleLock,
  isLocked = false,
}) => {
  const [filter, setFilter] = useState('');
  const [levelFilter, setLevelFilter] = useState<Set<OutputEntry['level']>>(
    new Set(['trace', 'debug', 'info', 'warn', 'error'])
  );
  const [autoScroll, setAutoScroll] = useState(true);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const channelEntries = useMemo(() => {
    let result = entries.filter((e) => e.channel === activeChannelId);
    result = result.filter((e) => levelFilter.has(e.level));
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter((e) => e.message.toLowerCase().includes(q));
    }
    return result;
  }, [entries, activeChannelId, levelFilter, filter]);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [channelEntries.length, autoScroll]);

  const toggleLevel = useCallback((level: OutputEntry['level']) => {
    setLevelFilter((prev) => {
      const next = new Set(prev);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }, []);

  const formatTimestamp = useCallback((ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}.${d.getMilliseconds().toString().padStart(3, '0')}`;
  }, []);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <select
          value={activeChannelId}
          onChange={(e) => onChannelChange(e.target.value)}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 11,
            outline: 'none',
            maxWidth: 180,
          }}
        >
          {channels.map((ch) => (
            <option key={ch.id} value={ch.id}>{ch.name}</option>
          ))}
        </select>

        <div style={{ flex: 1 }} />

        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter output..."
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '2px 6px',
            borderRadius: 3,
            fontSize: 11,
            outline: 'none',
            width: 150,
          }}
        />

        {(['error', 'warn', 'info', 'debug'] as OutputEntry['level'][]).map((lvl) => (
          <button
            key={lvl}
            onClick={() => toggleLevel(lvl)}
            title={lvl}
            style={{
              background: 'none',
              border: 'none',
              color: levelFilter.has(lvl) ? LEVEL_STYLES[lvl].color : 'var(--text-secondary)',
              opacity: levelFilter.has(lvl) ? 1 : 0.3,
              cursor: 'pointer',
              fontSize: 11,
              padding: '0 3px',
            }}
          >
            {LEVEL_STYLES[lvl].icon}
          </button>
        ))}

        <button
          onClick={() => setShowTimestamps(!showTimestamps)}
          title="Toggle timestamps"
          style={{
            background: 'none',
            border: 'none',
            color: showTimestamps ? 'var(--accent-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '0 3px',
          }}
        >
          ⏱
        </button>
        <button
          onClick={() => setWordWrap(!wordWrap)}
          title="Toggle word wrap"
          style={{
            background: 'none',
            border: 'none',
            color: wordWrap ? 'var(--accent-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '0 3px',
          }}
        >
          ↩
        </button>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          title="Auto-scroll"
          style={{
            background: 'none',
            border: 'none',
            color: autoScroll ? 'var(--accent-color)' : 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '0 3px',
          }}
        >
          ↓
        </button>
        <button
          onClick={() => onClear(activeChannelId)}
          title="Clear output"
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 11,
            padding: '0 3px',
          }}
        >
          ∅
        </button>
        {onToggleLock && (
          <button
            onClick={onToggleLock}
            title={isLocked ? 'Unlock' : 'Lock'}
            style={{
              background: 'none',
              border: 'none',
              color: isLocked ? '#f44747' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 11,
              padding: '0 3px',
            }}
          >
            {isLocked ? '🔒' : '🔓'}
          </button>
        )}
      </div>

      {/* Output Content */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: 12,
          lineHeight: '18px',
          padding: 4,
        }}
      >
        {channelEntries.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 12 }}>
            No output for {activeChannel?.name ?? 'this channel'}
          </div>
        ) : (
          channelEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                display: 'flex',
                gap: 6,
                padding: '1px 4px',
                whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
                wordBreak: wordWrap ? 'break-all' : 'normal',
                background: entry.level === 'error' ? 'rgba(244,71,71,0.06)' :
                  entry.level === 'warn' ? 'rgba(204,167,0,0.06)' : 'transparent',
              }}
            >
              {showTimestamps && (
                <span style={{ color: 'var(--text-secondary)', opacity: 0.5, fontSize: 10, flexShrink: 0 }}>
                  [{formatTimestamp(entry.timestamp)}]
                </span>
              )}
              <span style={{ color: LEVEL_STYLES[entry.level].color, flexShrink: 0, width: 12 }}>
                {LEVEL_STYLES[entry.level].icon}
              </span>
              <span style={{ color: 'var(--text-primary)' }}>{entry.message}</span>
            </div>
          ))
        )}
      </div>

      {/* Status */}
      <div style={{
        padding: '2px 8px',
        borderTop: '1px solid var(--border-color)',
        fontSize: 10,
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{channelEntries.length} entries</span>
        <span>{channels.length} channels</span>
      </div>
    </div>
  );
};
