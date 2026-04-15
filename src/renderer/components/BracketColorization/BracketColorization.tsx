import React, { useMemo } from 'react';

// ============================================================================
// Bracket Pair Colorization Engine - Matching brackets with colors,
// nesting-aware coloring, bracket guides, pair highlighting
// ============================================================================

export type BracketType = '(' | ')' | '[' | ']' | '{' | '}' | '<' | '>';

export interface BracketPair {
  open: { line: number; column: number; char: BracketType };
  close: { line: number; column: number; char: BracketType };
  depth: number;
  isValid: boolean;
}

export interface BracketGuide {
  startLine: number;
  endLine: number;
  column: number;
  depth: number;
  isActive: boolean;
}

const BRACKET_COLORS = [
  '#ffd700', // Gold
  '#da70d6', // Orchid
  '#179fff', // Dodger Blue
  '#4ec9b0', // Teal
  '#ce9178', // Salmon
  '#c586c0', // Purple
];

const BRACKET_PAIRS: Record<string, string> = {
  '(': ')', ')': '(',
  '[': ']', ']': '[',
  '{': '}', '}': '{',
  '<': '>', '>': '<',
};

const OPEN_BRACKETS = new Set(['(', '[', '{', '<']);
const CLOSE_BRACKETS = new Set([')', ']', '}', '>']);

export function findBracketPairs(lines: string[]): BracketPair[] {
  const pairs: BracketPair[] = [];
  const stack: Array<{ line: number; column: number; char: BracketType; depth: number }> = [];
  let depth = 0;

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];
    let inString = false;
    let stringChar = '';
    let inComment = false;

    for (let col = 0; col < line.length; col++) {
      const ch = line[col];
      const prev = col > 0 ? line[col - 1] : '';

      // Skip string contents
      if ((ch === '"' || ch === "'" || ch === '`') && prev !== '\\') {
        if (!inString) { inString = true; stringChar = ch; continue; }
        if (ch === stringChar) { inString = false; continue; }
      }
      if (inString) continue;

      // Skip line comments
      if (ch === '/' && col + 1 < line.length && line[col + 1] === '/') break;

      if (OPEN_BRACKETS.has(ch)) {
        stack.push({ line: lineNum, column: col, char: ch as BracketType, depth });
        depth++;
      } else if (CLOSE_BRACKETS.has(ch)) {
        depth = Math.max(0, depth - 1);
        const last = stack.length > 0 ? stack[stack.length - 1] : null;
        if (last && BRACKET_PAIRS[last.char] === ch) {
          stack.pop();
          pairs.push({
            open: { line: last.line, column: last.column, char: last.char },
            close: { line: lineNum, column: col, char: ch as BracketType },
            depth: last.depth,
            isValid: true,
          });
        } else {
          // Mismatched bracket
          pairs.push({
            open: { line: lineNum, column: col, char: BRACKET_PAIRS[ch] as BracketType },
            close: { line: lineNum, column: col, char: ch as BracketType },
            depth: depth,
            isValid: false,
          });
        }
      }
    }
  }

  return pairs;
}

export function findBracketGuides(pairs: BracketPair[]): BracketGuide[] {
  return pairs
    .filter((p) => p.isValid && p.open.line !== p.close.line)
    .map((p) => ({
      startLine: p.open.line,
      endLine: p.close.line,
      column: p.open.column,
      depth: p.depth,
      isActive: false,
    }));
}

export function getColorForDepth(depth: number): string {
  return BRACKET_COLORS[depth % BRACKET_COLORS.length];
}

export function findMatchingBracket(
  pairs: BracketPair[],
  line: number,
  column: number
): { line: number; column: number } | null {
  for (const pair of pairs) {
    if (pair.open.line === line && pair.open.column === column) {
      return { line: pair.close.line, column: pair.close.column };
    }
    if (pair.close.line === line && pair.close.column === column) {
      return { line: pair.open.line, column: pair.open.column };
    }
  }
  return null;
}

interface BracketColorizationProps {
  lines: string[];
  cursorLine?: number;
  cursorColumn?: number;
  showGuides?: boolean;
  enabled?: boolean;
}

export const BracketColorization: React.FC<BracketColorizationProps> = ({
  lines,
  cursorLine,
  cursorColumn,
  showGuides = true,
  enabled = true,
}) => {
  const pairs = useMemo(() => findBracketPairs(lines), [lines]);
  const guides = useMemo(() => findBracketGuides(pairs), [pairs]);

  const activePair = useMemo(() => {
    if (cursorLine == null || cursorColumn == null) return null;
    for (const pair of pairs) {
      if (
        (pair.open.line === cursorLine && pair.open.column === cursorColumn) ||
        (pair.close.line === cursorLine && pair.close.column === cursorColumn)
      ) {
        return pair;
      }
    }
    return null;
  }, [pairs, cursorLine, cursorColumn]);

  // Build a map of bracket positions to colors
  const bracketColors = useMemo(() => {
    const map = new Map<string, { color: string; isActive: boolean; isInvalid: boolean }>();
    if (!enabled) return map;

    for (const pair of pairs) {
      const openKey = `${pair.open.line}:${pair.open.column}`;
      const closeKey = `${pair.close.line}:${pair.close.column}`;
      const color = pair.isValid ? getColorForDepth(pair.depth) : '#f44747';
      const isActive = activePair === pair;

      map.set(openKey, { color, isActive, isInvalid: !pair.isValid });
      map.set(closeKey, { color, isActive, isInvalid: !pair.isValid });
    }

    return map;
  }, [pairs, enabled, activePair]);

  const activeGuides = useMemo(() => {
    if (!showGuides || !enabled) return [];
    return guides.map((g) => ({
      ...g,
      isActive: activePair != null &&
        g.startLine === activePair.open.line &&
        g.column === activePair.open.column,
    }));
  }, [guides, showGuides, enabled, activePair]);

  if (!enabled) return null;

  return (
    <div style={{ position: 'relative', fontFamily: 'monospace', fontSize: 13, lineHeight: '20px' }}>
      {lines.map((line, lineIdx) => (
        <div key={lineIdx} style={{ display: 'flex', position: 'relative', height: 20 }}>
          {/* Line number */}
          <span style={{
            width: 50, textAlign: 'right', paddingRight: 12,
            color: '#858585', fontSize: 12, userSelect: 'none', flexShrink: 0,
          }}>
            {lineIdx + 1}
          </span>

          {/* Code with colored brackets */}
          <span style={{ whiteSpace: 'pre', position: 'relative' }}>
            {Array.from(line).map((ch, col) => {
              const key = `${lineIdx}:${col}`;
              const bracketInfo = bracketColors.get(key);

              if (bracketInfo) {
                return (
                  <span
                    key={col}
                    style={{
                      color: bracketInfo.color,
                      fontWeight: bracketInfo.isActive ? 'bold' : 'normal',
                      textDecoration: bracketInfo.isInvalid ? 'wavy underline' : undefined,
                      textDecorationColor: bracketInfo.isInvalid ? '#f44747' : undefined,
                      background: bracketInfo.isActive ? `${bracketInfo.color}22` : undefined,
                      borderRadius: bracketInfo.isActive ? 2 : undefined,
                    }}
                  >
                    {ch}
                  </span>
                );
              }

              return <span key={col}>{ch}</span>;
            })}
          </span>

          {/* Bracket guides for this line */}
          {activeGuides
            .filter((g) => lineIdx > g.startLine && lineIdx <= g.endLine)
            .map((g, i) => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  left: 50 + g.column * 7.8 + 4,
                  top: 0,
                  width: 1,
                  height: 20,
                  background: g.isActive
                    ? getColorForDepth(g.depth)
                    : `${getColorForDepth(g.depth)}44`,
                }}
              />
            ))}
        </div>
      ))}
    </div>
  );
};
