import React, { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Problems Panel - Error/warning/info aggregation, filtering, grouping
// ============================================================================

export type DiagnosticSeverity = 'error' | 'warning' | 'info' | 'hint';

export interface Diagnostic {
  id: string;
  severity: DiagnosticSeverity;
  message: string;
  source: string;
  code?: string | number;
  filePath: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
  relatedInfo?: Array<{
    message: string;
    filePath: string;
    line: number;
  }>;
  quickFixes?: Array<{
    title: string;
    command: string;
  }>;
}

export type ProblemGroupBy = 'file' | 'severity' | 'source';
export type ProblemSortBy = 'severity' | 'file' | 'position';

interface ProblemsPanelProps {
  diagnostics: Diagnostic[];
  onDiagnosticClick: (diagnostic: Diagnostic) => void;
  onQuickFix: (diagnostic: Diagnostic, fixCommand: string) => void;
  onFilterChange?: (filter: string) => void;
}

const SEVERITY_ICONS: Record<DiagnosticSeverity, { icon: string; color: string }> = {
  error: { icon: '✕', color: '#f44747' },
  warning: { icon: '⚠', color: '#cca700' },
  info: { icon: 'ℹ', color: '#3794ff' },
  hint: { icon: '💡', color: '#4ec9b0' },
};

const SEVERITY_ORDER: Record<DiagnosticSeverity, number> = { error: 0, warning: 1, info: 2, hint: 3 };

export const ProblemsPanel: React.FC<ProblemsPanelProps> = ({
  diagnostics,
  onDiagnosticClick,
  onQuickFix,
  onFilterChange,
}) => {
  const [filter, setFilter] = useState('');
  const [groupBy, setGroupBy] = useState<ProblemGroupBy>('file');
  const [sortBy, setSortBy] = useState<ProblemSortBy>('severity');
  const [severityFilter, setSeverityFilter] = useState<Set<DiagnosticSeverity>>(
    new Set(['error', 'warning', 'info', 'hint'])
  );
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const counts = useMemo(() => ({
    error: diagnostics.filter((d) => d.severity === 'error').length,
    warning: diagnostics.filter((d) => d.severity === 'warning').length,
    info: diagnostics.filter((d) => d.severity === 'info').length,
    hint: diagnostics.filter((d) => d.severity === 'hint').length,
  }), [diagnostics]);

  const filtered = useMemo(() => {
    let result = diagnostics.filter((d) => severityFilter.has(d.severity));
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter((d) =>
        d.message.toLowerCase().includes(q) ||
        d.filePath.toLowerCase().includes(q) ||
        d.source.toLowerCase().includes(q) ||
        (d.code?.toString() || '').toLowerCase().includes(q)
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'severity') return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      if (sortBy === 'file') return a.filePath.localeCompare(b.filePath);
      return a.startLine - b.startLine;
    });
    return result;
  }, [diagnostics, severityFilter, filter, sortBy]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Diagnostic[]>();
    for (const d of filtered) {
      const key = groupBy === 'file' ? d.filePath : groupBy === 'severity' ? d.severity : d.source;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(d);
    }
    return groups;
  }, [filtered, groupBy]);

  const toggleSeverity = useCallback((sev: DiagnosticSeverity) => {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(sev)) next.delete(sev);
      else next.add(sev);
      return next;
    });
  }, []);

  const toggleGroup = useCallback((key: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <input
          value={filter}
          onChange={(e) => { setFilter(e.target.value); onFilterChange?.(e.target.value); }}
          placeholder="Filter problems..."
          style={{
            flex: 1,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '3px 8px',
            borderRadius: 3,
            fontSize: 11,
            outline: 'none',
          }}
        />
        {/* Severity toggles */}
        {(['error', 'warning', 'info', 'hint'] as DiagnosticSeverity[]).map((sev) => (
          <button
            key={sev}
            onClick={() => toggleSeverity(sev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              padding: '2px 6px',
              borderRadius: 3,
              border: 'none',
              background: severityFilter.has(sev) ? 'var(--bg-active)' : 'transparent',
              color: severityFilter.has(sev) ? SEVERITY_ICONS[sev].color : 'var(--text-secondary)',
              cursor: 'pointer',
              fontSize: 11,
              opacity: severityFilter.has(sev) ? 1 : 0.4,
            }}
          >
            <span>{SEVERITY_ICONS[sev].icon}</span>
            <span>{counts[sev]}</span>
          </button>
        ))}
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as ProblemGroupBy)}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: 3,
            padding: '2px 4px',
            fontSize: 10,
            outline: 'none',
          }}
        >
          <option value="file">Group by File</option>
          <option value="severity">Group by Severity</option>
          <option value="source">Group by Source</option>
        </select>
      </div>

      {/* Problem List */}
      <div style={{ flex: 1, overflow: 'auto', fontSize: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
            No problems detected in workspace
          </div>
        ) : (
          Array.from(grouped.entries()).map(([key, items]) => (
            <div key={key}>
              {/* Group Header */}
              <div
                onClick={() => toggleGroup(key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  background: 'var(--bg-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                }}
              >
                <span style={{ fontSize: 8 }}>{collapsedGroups.has(key) ? '▶' : '▼'}</span>
                <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'monospace', fontSize: 11 }}>
                  {key}
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>({items.length})</span>
              </div>
              {/* Items */}
              {!collapsedGroups.has(key) && items.map((diag) => (
                <div
                  key={diag.id}
                  onClick={() => onDiagnosticClick(diag)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 6,
                    padding: '3px 8px 3px 24px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(60,60,60,0.2)',
                    lineHeight: '20px',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: SEVERITY_ICONS[diag.severity].color, fontSize: 11, flexShrink: 0, marginTop: 2 }}>
                    {SEVERITY_ICONS[diag.severity].icon}
                  </span>
                  <span style={{ flex: 1, color: 'var(--text-primary)' }}>{diag.message}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10, flexShrink: 0 }}>
                    [{diag.source}{diag.code ? ` ${diag.code}` : ''}]
                  </span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10, flexShrink: 0, fontFamily: 'monospace' }}>
                    {diag.startLine}:{diag.startColumn}
                  </span>
                  {diag.quickFixes && diag.quickFixes.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onQuickFix(diag, diag.quickFixes![0].command); }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#cca700',
                        cursor: 'pointer',
                        fontSize: 11,
                        padding: '0 2px',
                      }}
                      title={diag.quickFixes[0].title}
                    >
                      💡
                    </button>
                  )}
                </div>
              ))}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '3px 8px',
        borderTop: '1px solid var(--border-color)',
        fontSize: 11,
        color: 'var(--text-secondary)',
      }}>
        <span style={{ color: '#f44747' }}>✕ {counts.error} errors</span>
        <span style={{ color: '#cca700' }}>⚠ {counts.warning} warnings</span>
        <span style={{ color: '#3794ff' }}>ℹ {counts.info} info</span>
        <span style={{ color: '#4ec9b0' }}>💡 {counts.hint} hints</span>
      </div>
    </div>
  );
};
