import React, { useMemo } from 'react';

export interface DiffLine {
  type: 'context' | 'addition' | 'deletion' | 'header';
  content: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

interface DiffViewerProps {
  oldContent: string;
  newContent: string;
  filePath: string;
  language?: string;
  mode?: 'inline' | 'side-by-side';
}

const LINE_COLORS: Record<string, { bg: string; gutterBg: string; color: string }> = {
  addition: {
    bg: 'rgba(155, 185, 85, 0.15)',
    gutterBg: 'rgba(155, 185, 85, 0.25)',
    color: 'var(--success, #81b88b)',
  },
  deletion: {
    bg: 'rgba(255, 0, 0, 0.12)',
    gutterBg: 'rgba(255, 0, 0, 0.2)',
    color: 'var(--error, #f48771)',
  },
  context: {
    bg: 'transparent',
    gutterBg: 'transparent',
    color: 'var(--text-primary, #d4d4d4)',
  },
  header: {
    bg: 'rgba(0, 122, 204, 0.1)',
    gutterBg: 'rgba(0, 122, 204, 0.15)',
    color: 'var(--accent, #007acc)',
  },
};

export const DiffViewer: React.FC<DiffViewerProps> = ({
  oldContent,
  newContent,
  filePath,
  mode = 'inline',
}) => {
  const diffLines = useMemo(
    () => computeDiff(oldContent, newContent),
    [oldContent, newContent]
  );

  const stats = useMemo(() => {
    const additions = diffLines.filter((l) => l.type === 'addition').length;
    const deletions = diffLines.filter((l) => l.type === 'deletion').length;
    return { additions, deletions };
  }, [diffLines]);

  return (
    <div
      style={{
        fontFamily: "'Fira Code', Consolas, monospace",
        fontSize: 13,
        lineHeight: '20px',
        overflow: 'auto',
        background: 'var(--bg-primary, #1e1e1e)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'var(--bg-secondary, #252526)',
          borderBottom: '1px solid var(--border, #454545)',
        }}
      >
        <span style={{ color: 'var(--text-primary, #d4d4d4)' }}>{filePath}</span>
        <span style={{ fontSize: 12 }}>
          <span style={{ color: 'var(--success, #81b88b)' }}>+{stats.additions}</span>
          {' '}
          <span style={{ color: 'var(--error, #f48771)' }}>-{stats.deletions}</span>
        </span>
      </div>

      {/* Diff content */}
      {mode === 'inline' ? (
        <InlineDiffView lines={diffLines} />
      ) : (
        <SideBySideDiffView lines={diffLines} />
      )}
    </div>
  );
};

const InlineDiffView: React.FC<{ lines: DiffLine[] }> = ({ lines }) => (
  <div>
    {lines.map((line, i) => {
      const colors = LINE_COLORS[line.type];
      const prefix = line.type === 'addition' ? '+' : line.type === 'deletion' ? '-' : ' ';

      return (
        <div
          key={i}
          style={{
            display: 'flex',
            background: colors.bg,
            minHeight: 20,
          }}
        >
          {/* Old line number */}
          <span
            style={{
              width: 50,
              textAlign: 'right',
              padding: '0 8px',
              color: 'var(--text-secondary, #858585)',
              background: colors.gutterBg,
              fontSize: 12,
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {line.oldLineNumber || ''}
          </span>

          {/* New line number */}
          <span
            style={{
              width: 50,
              textAlign: 'right',
              padding: '0 8px',
              color: 'var(--text-secondary, #858585)',
              background: colors.gutterBg,
              fontSize: 12,
              userSelect: 'none',
              flexShrink: 0,
            }}
          >
            {line.newLineNumber || ''}
          </span>

          {/* Prefix */}
          <span
            style={{
              width: 20,
              textAlign: 'center',
              color: colors.color,
              fontWeight: 'bold',
              flexShrink: 0,
            }}
          >
            {line.type === 'header' ? '@@' : prefix}
          </span>

          {/* Content */}
          <pre
            style={{
              margin: 0,
              padding: '0 8px',
              color: colors.color,
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'pre',
            }}
          >
            {line.content}
          </pre>
        </div>
      );
    })}
  </div>
);

const SideBySideDiffView: React.FC<{ lines: DiffLine[] }> = ({ lines }) => {
  const { leftLines, rightLines } = useMemo(() => {
    const left: Array<DiffLine | null> = [];
    const right: Array<DiffLine | null> = [];

    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (line.type === 'context' || line.type === 'header') {
        left.push(line);
        right.push(line);
        i++;
      } else if (line.type === 'deletion') {
        left.push(line);
        // Check if next is addition (paired change)
        if (i + 1 < lines.length && lines[i + 1].type === 'addition') {
          right.push(lines[i + 1]);
          i += 2;
        } else {
          right.push(null);
          i++;
        }
      } else if (line.type === 'addition') {
        left.push(null);
        right.push(line);
        i++;
      } else {
        i++;
      }
    }
    return { leftLines: left, rightLines: right };
  }, [lines]);

  return (
    <div style={{ display: 'flex' }}>
      {/* Left (old) */}
      <div style={{ flex: 1, borderRight: '1px solid var(--border, #454545)' }}>
        {leftLines.map((line, i) => (
          <SideDiffLine key={i} line={line} side="old" />
        ))}
      </div>
      {/* Right (new) */}
      <div style={{ flex: 1 }}>
        {rightLines.map((line, i) => (
          <SideDiffLine key={i} line={line} side="new" />
        ))}
      </div>
    </div>
  );
};

const SideDiffLine: React.FC<{ line: DiffLine | null; side: 'old' | 'new' }> = ({
  line,
  side,
}) => {
  if (!line) {
    return (
      <div
        style={{
          minHeight: 20,
          background: 'var(--bg-secondary, #252526)',
          opacity: 0.3,
        }}
      />
    );
  }

  const colors = LINE_COLORS[line.type];
  const lineNum = side === 'old' ? line.oldLineNumber : line.newLineNumber;

  return (
    <div style={{ display: 'flex', background: colors.bg, minHeight: 20 }}>
      <span
        style={{
          width: 50,
          textAlign: 'right',
          padding: '0 8px',
          color: 'var(--text-secondary, #858585)',
          background: colors.gutterBg,
          fontSize: 12,
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        {lineNum || ''}
      </span>
      <pre
        style={{
          margin: 0,
          padding: '0 8px',
          color: colors.color,
          flex: 1,
          overflow: 'hidden',
          whiteSpace: 'pre',
        }}
      >
        {line.content}
      </pre>
    </div>
  );
};

// Simple line-based diff algorithm
function computeDiff(oldText: string, newText: string): DiffLine[] {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const dp: number[][] = Array.from({ length: oldLines.length + 1 }, () =>
    new Array(newLines.length + 1).fill(0)
  );

  for (let i = 1; i <= oldLines.length; i++) {
    for (let j = 1; j <= newLines.length; j++) {
      if (oldLines[i - 1] === newLines[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const diffOps: Array<{ type: 'context' | 'addition' | 'deletion'; oldIdx?: number; newIdx?: number }> = [];
  let i = oldLines.length;
  let j = newLines.length;

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldLines[i - 1] === newLines[j - 1]) {
      diffOps.unshift({ type: 'context', oldIdx: i, newIdx: j });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      diffOps.unshift({ type: 'addition', newIdx: j });
      j--;
    } else if (i > 0) {
      diffOps.unshift({ type: 'deletion', oldIdx: i });
      i--;
    }
  }

  for (const op of diffOps) {
    result.push({
      type: op.type,
      content:
        op.type === 'deletion'
          ? oldLines[(op.oldIdx || 1) - 1]
          : op.type === 'addition'
            ? newLines[(op.newIdx || 1) - 1]
            : oldLines[(op.oldIdx || 1) - 1],
      oldLineNumber: op.oldIdx,
      newLineNumber: op.newIdx,
    });
  }

  return result;
}
