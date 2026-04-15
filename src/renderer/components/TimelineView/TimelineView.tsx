import React, { useState, useMemo } from 'react';

// ============================================================================
// Timeline View - File history, git commits, local edits, saved snapshots
// ============================================================================

export type TimelineEventType = 'git-commit' | 'local-save' | 'file-create' | 'file-rename' | 'file-delete' | 'refactor' | 'external-change';

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: number;
  title: string;
  description?: string;
  author?: string;
  hash?: string;
  filePath: string;
  additions?: number;
  deletions?: number;
  diff?: string;
}

interface TimelineViewProps {
  events: TimelineEvent[];
  filePath?: string;
  onEventClick: (event: TimelineEvent) => void;
  onCompare: (eventA: TimelineEvent, eventB: TimelineEvent) => void;
  onRevert: (event: TimelineEvent) => void;
}

const EVENT_ICONS: Record<TimelineEventType, { icon: string; color: string }> = {
  'git-commit': { icon: '●', color: '#4ec9b0' },
  'local-save': { icon: '◆', color: '#3794ff' },
  'file-create': { icon: '+', color: '#4ec9b0' },
  'file-rename': { icon: '↹', color: '#cca700' },
  'file-delete': { icon: '×', color: '#f44747' },
  'refactor': { icon: '⟲', color: '#c586c0' },
  'external-change': { icon: '⇄', color: '#969696' },
};

const formatDate = (ts: number): string => {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const formatFullDate = (ts: number): string => {
  return new Date(ts).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  filePath,
  onEventClick,
  onCompare,
  onRevert,
}) => {
  const [filter, setFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<Set<TimelineEventType>>(
    new Set(['git-commit', 'local-save', 'file-create', 'file-rename', 'file-delete', 'refactor', 'external-change'])
  );
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    let result = events.filter((e) => typeFilter.has(e.type));
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter((e) =>
        e.title.toLowerCase().includes(q) ||
        e.author?.toLowerCase().includes(q) ||
        e.hash?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => b.timestamp - a.timestamp);
  }, [events, typeFilter, filter]);

  // Group events by date
  const grouped = useMemo(() => {
    const groups = new Map<string, TimelineEvent[]>();
    for (const event of filtered) {
      const d = new Date(event.timestamp);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(event);
    }
    return groups;
  }, [filtered]);

  const toggleType = (type: TimelineEventType) => {
    setTypeFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        if (next.size >= 2) next.clear();
        next.add(id);
      }
      return next;
    });
  };

  const handleCompare = () => {
    const selected = Array.from(selectedEvents);
    if (selected.length === 2) {
      const a = events.find((e) => e.id === selected[0])!;
      const b = events.find((e) => e.id === selected[1])!;
      onCompare(a, b);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
            Timeline
          </span>
          {filePath && (
            <span style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {filePath.split('/').pop()}
            </span>
          )}
          <div style={{ flex: 1 }} />
          {selectedEvents.size === 2 && (
            <button
              onClick={handleCompare}
              style={{
                padding: '2px 8px', borderRadius: 3, border: 'none',
                background: 'var(--accent-color)', color: '#fff', fontSize: 10, cursor: 'pointer',
              }}
            >
              Compare Selected
            </button>
          )}
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter timeline..."
          style={{
            width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', padding: '3px 6px', borderRadius: 3, fontSize: 11, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
          {(Object.keys(EVENT_ICONS) as TimelineEventType[]).map((type) => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              style={{
                padding: '1px 6px', borderRadius: 3, border: 'none', fontSize: 10, cursor: 'pointer',
                background: typeFilter.has(type) ? `${EVENT_ICONS[type].color}22` : 'transparent',
                color: typeFilter.has(type) ? EVENT_ICONS[type].color : 'var(--text-secondary)',
                opacity: typeFilter.has(type) ? 1 : 0.4,
              }}
            >
              {EVENT_ICONS[type].icon} {type.replace(/-/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div style={{ flex: 1, overflow: 'auto', padding: '4px 0' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 12 }}>
            No timeline events
          </div>
        ) : (
          Array.from(grouped.entries()).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              <div style={{
                padding: '4px 12px', fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)',
                textTransform: 'uppercase', letterSpacing: 0.5, background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-color)',
              }}>
                {formatDate(dayEvents[0].timestamp)}
              </div>
              {dayEvents.map((event) => {
                const iconInfo = EVENT_ICONS[event.type];
                const isSelected = selectedEvents.has(event.id);
                return (
                  <div
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 12px',
                      cursor: 'pointer', borderBottom: '1px solid rgba(60,60,60,0.2)',
                      background: isSelected ? 'rgba(55,148,255,0.1)' : 'transparent',
                      borderLeft: isSelected ? '2px solid var(--accent-color)' : '2px solid transparent',
                    }}
                    onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                  >
                    {/* Timeline dot */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                      <span style={{ color: iconInfo.color, fontSize: 14 }}>{iconInfo.icon}</span>
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{event.title}</span>
                        {event.hash && (
                          <span style={{ fontSize: 10, color: 'var(--text-accent)', fontFamily: 'monospace' }}>
                            {event.hash.substring(0, 7)}
                          </span>
                        )}
                      </div>
                      {event.description && (
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{event.description}</div>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, fontSize: 10, color: 'var(--text-secondary)' }}>
                        {event.author && <span>{event.author}</span>}
                        <span>{formatFullDate(event.timestamp)}</span>
                        {event.additions != null && <span style={{ color: '#4ec9b0' }}>+{event.additions}</span>}
                        {event.deletions != null && <span style={{ color: '#f44747' }}>-{event.deletions}</span>}
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => toggleSelect(event.id)}
                        title="Select for compare"
                        style={{
                          background: isSelected ? 'var(--accent-color)' : 'none', border: isSelected ? 'none' : '1px solid var(--border-color)',
                          color: isSelected ? '#fff' : 'var(--text-secondary)', borderRadius: 3, width: 20, height: 20,
                          fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ◉
                      </button>
                      {event.type === 'git-commit' && (
                        <button
                          onClick={() => onRevert(event)}
                          title="Revert to this version"
                          style={{
                            background: 'none', border: '1px solid rgba(244,71,71,0.3)', borderRadius: 3,
                            color: '#f44747', width: 20, height: 20, fontSize: 10, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          ↩
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '3px 8px', borderTop: '1px solid var(--border-color)', fontSize: 10, color: 'var(--text-secondary)' }}>
        {filtered.length} events · Select 2 events to compare
      </div>
    </div>
  );
};
