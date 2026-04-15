import React, { useMemo } from 'react';

// ============================================================================
// Code Lens - Inline reference counts, test status, git blame, run/debug
// ============================================================================

export type CodeLensType = 'references' | 'implementations' | 'test' | 'git-blame' | 'run' | 'debug' | 'custom';

export interface CodeLensItem {
  id: string;
  type: CodeLensType;
  line: number;
  title: string;
  command?: string;
  tooltip?: string;
  icon?: string;
  count?: number;
  isClickable: boolean;
  data?: Record<string, unknown>;
}

export interface CodeLensGroup {
  line: number;
  items: CodeLensItem[];
}

interface CodeLensProps {
  groups: CodeLensGroup[];
  onClick: (item: CodeLensItem) => void;
  lineHeight?: number;
  visible?: boolean;
}

const LENS_STYLES: Record<CodeLensType, { color: string; prefix: string }> = {
  references: { color: '#969696', prefix: '' },
  implementations: { color: '#4ec9b0', prefix: '' },
  test: { color: '#4ec9b0', prefix: '' },
  'git-blame': { color: '#969696', prefix: '' },
  run: { color: '#4ec9b0', prefix: '▶ ' },
  debug: { color: '#f44747', prefix: '🐛 ' },
  custom: { color: '#c586c0', prefix: '' },
};

const CodeLensLine: React.FC<{
  group: CodeLensGroup;
  onClick: (item: CodeLensItem) => void;
}> = ({ group, onClick }) => (
  <div style={{
    display: 'flex',
    gap: 12,
    padding: '0 0 0 60px',
    height: 18,
    alignItems: 'center',
    fontSize: 11,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    lineHeight: '18px',
    userSelect: 'none',
  }}>
    {group.items.map((item) => {
      const style = LENS_STYLES[item.type];
      return (
        <span
          key={item.id}
          onClick={() => item.isClickable && onClick(item)}
          title={item.tooltip}
          style={{
            color: style.color,
            cursor: item.isClickable ? 'pointer' : 'default',
            opacity: 0.8,
            transition: 'opacity 0.15s',
          }}
          onMouseOver={(e) => { if (item.isClickable) (e.target as HTMLElement).style.opacity = '1'; }}
          onMouseOut={(e) => { (e.target as HTMLElement).style.opacity = '0.8'; }}
        >
          {style.prefix}{item.title}
          {item.count != null && (
            <span style={{ marginLeft: 2 }}>({item.count})</span>
          )}
        </span>
      );
    })}
  </div>
);

export const CodeLens: React.FC<CodeLensProps> = ({
  groups,
  onClick,
  visible = true,
}) => {
  const sortedGroups = useMemo(() =>
    [...groups].sort((a, b) => a.line - b.line),
  [groups]);

  if (!visible || groups.length === 0) return null;

  return (
    <div style={{ position: 'relative' }}>
      {sortedGroups.map((group) => (
        <CodeLensLine key={group.line} group={group} onClick={onClick} />
      ))}
    </div>
  );
};

// Helper to create common code lens items
export function createReferenceLens(line: number, count: number, command: string): CodeLensItem {
  return {
    id: `ref-${line}`,
    type: 'references',
    line,
    title: `${count} reference${count !== 1 ? 's' : ''}`,
    command,
    tooltip: `${count} reference${count !== 1 ? 's' : ''} - Click to show`,
    count,
    isClickable: true,
  };
}

export function createImplementationLens(line: number, count: number, command: string): CodeLensItem {
  return {
    id: `impl-${line}`,
    type: 'implementations',
    line,
    title: `${count} implementation${count !== 1 ? 's' : ''}`,
    command,
    tooltip: `${count} implementation${count !== 1 ? 's' : ''} - Click to show`,
    count,
    isClickable: true,
  };
}

export function createTestLens(line: number, status: 'pass' | 'fail' | 'skip' | 'unknown', testName: string): CodeLensItem {
  const icons = { pass: '✓', fail: '✕', skip: '○', unknown: '?' };
  const colors = { pass: '#4ec9b0', fail: '#f44747', skip: '#cca700', unknown: '#969696' };
  return {
    id: `test-${line}`,
    type: 'test',
    line,
    title: `${icons[status]} ${testName}`,
    tooltip: `Test: ${testName} (${status})`,
    isClickable: true,
    data: { status, testName },
  };
}

export function createGitBlameLens(line: number, author: string, date: string, message: string): CodeLensItem {
  return {
    id: `blame-${line}`,
    type: 'git-blame',
    line,
    title: `${author}, ${date} · ${message}`,
    tooltip: `${author} committed on ${date}: ${message}`,
    isClickable: true,
  };
}

export function createRunLens(line: number, label: string, command: string): CodeLensItem {
  return {
    id: `run-${line}`,
    type: 'run',
    line,
    title: label,
    command,
    tooltip: `Run: ${label}`,
    isClickable: true,
  };
}

export function createDebugLens(line: number, label: string, command: string): CodeLensItem {
  return {
    id: `debug-${line}`,
    type: 'debug',
    line,
    title: label,
    command,
    tooltip: `Debug: ${label}`,
    isClickable: true,
  };
}
