import React, { useMemo } from 'react';

// ============================================================================
// Semantic Token Highlighting - Token classification, theme-aware coloring,
// scope-based highlighting with modifier support
// ============================================================================

export type SemanticTokenType =
  | 'namespace' | 'type' | 'class' | 'enum' | 'interface' | 'struct'
  | 'typeParameter' | 'parameter' | 'variable' | 'property' | 'enumMember'
  | 'event' | 'function' | 'method' | 'macro' | 'keyword' | 'modifier'
  | 'comment' | 'string' | 'number' | 'regexp' | 'operator' | 'decorator'
  | 'label' | 'lifetime' | 'builtinType' | 'selfKeyword' | 'selfTypeKeyword';

export type SemanticTokenModifier =
  | 'declaration' | 'definition' | 'readonly' | 'static' | 'deprecated'
  | 'abstract' | 'async' | 'modification' | 'documentation' | 'defaultLibrary'
  | 'local' | 'global' | 'mutable' | 'exported';

export interface SemanticToken {
  line: number;
  startChar: number;
  length: number;
  tokenType: SemanticTokenType;
  modifiers: SemanticTokenModifier[];
  text: string;
}

export interface SemanticTokenTheme {
  [key: string]: {
    foreground: string;
    fontStyle?: 'italic' | 'bold' | 'underline' | 'strikethrough' | 'bold italic';
    opacity?: number;
  };
}

// Default VS Code Dark+ semantic token colors
export const DEFAULT_SEMANTIC_THEME: SemanticTokenTheme = {
  'namespace': { foreground: '#4ec9b0' },
  'type': { foreground: '#4ec9b0' },
  'class': { foreground: '#4ec9b0' },
  'enum': { foreground: '#4ec9b0' },
  'interface': { foreground: '#4ec9b0', fontStyle: 'italic' },
  'struct': { foreground: '#4ec9b0' },
  'typeParameter': { foreground: '#4ec9b0' },
  'parameter': { foreground: '#9cdcfe' },
  'variable': { foreground: '#9cdcfe' },
  'variable.readonly': { foreground: '#4fc1ff' },
  'variable.defaultLibrary': { foreground: '#4fc1ff' },
  'property': { foreground: '#9cdcfe' },
  'property.readonly': { foreground: '#4fc1ff' },
  'enumMember': { foreground: '#4fc1ff' },
  'event': { foreground: '#9cdcfe' },
  'function': { foreground: '#dcdcaa' },
  'function.defaultLibrary': { foreground: '#dcdcaa' },
  'method': { foreground: '#dcdcaa' },
  'macro': { foreground: '#569cd6' },
  'keyword': { foreground: '#569cd6' },
  'modifier': { foreground: '#569cd6' },
  'comment': { foreground: '#6a9955' },
  'comment.documentation': { foreground: '#608b4e' },
  'string': { foreground: '#ce9178' },
  'number': { foreground: '#b5cea8' },
  'regexp': { foreground: '#d16969' },
  'operator': { foreground: '#d4d4d4' },
  'decorator': { foreground: '#dcdcaa', fontStyle: 'italic' },
  'label': { foreground: '#c8c8c8' },
  'lifetime': { foreground: '#569cd6', fontStyle: 'italic' },
  'builtinType': { foreground: '#4ec9b0' },
  'selfKeyword': { foreground: '#569cd6', fontStyle: 'bold' },
  'selfTypeKeyword': { foreground: '#4ec9b0', fontStyle: 'bold' },
  // Modifier overrides
  '*.deprecated': { foreground: '#969696', fontStyle: 'strikethrough' },
  '*.declaration': { fontStyle: 'bold', foreground: '' },
  '*.static': { fontStyle: 'italic', foreground: '' },
  '*.async': { fontStyle: 'italic', foreground: '' },
};

export function resolveTokenStyle(
  token: SemanticToken,
  theme: SemanticTokenTheme
): { color: string; fontStyle?: string; textDecoration?: string; opacity?: number } {
  // Try most specific first: type.modifier
  for (const mod of token.modifiers) {
    const key = `${token.tokenType}.${mod}`;
    if (theme[key]) {
      return {
        color: theme[key].foreground || theme[token.tokenType]?.foreground || '#d4d4d4',
        fontStyle: theme[key].fontStyle?.includes('italic') ? 'italic' : undefined,
        textDecoration: theme[key].fontStyle?.includes('strikethrough') ? 'line-through' :
          theme[key].fontStyle?.includes('underline') ? 'underline' : undefined,
        opacity: theme[key].opacity,
      };
    }
  }

  // Try wildcard modifiers
  for (const mod of token.modifiers) {
    const key = `*.${mod}`;
    if (theme[key]) {
      const baseStyle = theme[token.tokenType];
      return {
        color: theme[key].foreground || baseStyle?.foreground || '#d4d4d4',
        fontStyle: theme[key].fontStyle?.includes('italic') ? 'italic' :
          baseStyle?.fontStyle?.includes('italic') ? 'italic' : undefined,
        textDecoration: theme[key].fontStyle?.includes('strikethrough') ? 'line-through' : undefined,
        opacity: theme[key].opacity,
      };
    }
  }

  // Fall back to base type
  const base = theme[token.tokenType];
  if (base) {
    return {
      color: base.foreground,
      fontStyle: base.fontStyle?.includes('italic') ? 'italic' : undefined,
      textDecoration: base.fontStyle?.includes('strikethrough') ? 'line-through' :
        base.fontStyle?.includes('underline') ? 'underline' : undefined,
      opacity: base.opacity,
    };
  }

  return { color: '#d4d4d4' };
}

// Encode semantic tokens into delta-encoded format (LSP-compatible)
export function encodeSemanticTokens(tokens: SemanticToken[]): number[] {
  const sorted = [...tokens].sort((a, b) => a.line - b.line || a.startChar - b.startChar);
  const data: number[] = [];
  let prevLine = 0;
  let prevChar = 0;

  const typeMap = new Map<SemanticTokenType, number>();
  const types: SemanticTokenType[] = [
    'namespace', 'type', 'class', 'enum', 'interface', 'struct',
    'typeParameter', 'parameter', 'variable', 'property', 'enumMember',
    'event', 'function', 'method', 'macro', 'keyword', 'modifier',
    'comment', 'string', 'number', 'regexp', 'operator', 'decorator',
  ];
  types.forEach((t, i) => typeMap.set(t, i));

  const modMap = new Map<SemanticTokenModifier, number>();
  const mods: SemanticTokenModifier[] = [
    'declaration', 'definition', 'readonly', 'static', 'deprecated',
    'abstract', 'async', 'modification', 'documentation', 'defaultLibrary',
  ];
  mods.forEach((m, i) => modMap.set(m, i));

  for (const token of sorted) {
    const deltaLine = token.line - prevLine;
    const deltaChar = deltaLine === 0 ? token.startChar - prevChar : token.startChar;
    const typeIdx = typeMap.get(token.tokenType) ?? 0;
    let modBits = 0;
    for (const mod of token.modifiers) {
      const bit = modMap.get(mod);
      if (bit !== undefined) modBits |= (1 << bit);
    }

    data.push(deltaLine, deltaChar, token.length, typeIdx, modBits);
    prevLine = token.line;
    prevChar = token.startChar;
  }

  return data;
}

// Decode delta-encoded semantic tokens
export function decodeSemanticTokens(data: number[]): Array<{
  deltaLine: number; deltaChar: number; length: number; tokenType: number; modifiers: number;
}> {
  const tokens: Array<{ deltaLine: number; deltaChar: number; length: number; tokenType: number; modifiers: number }> = [];
  for (let i = 0; i < data.length; i += 5) {
    tokens.push({
      deltaLine: data[i],
      deltaChar: data[i + 1],
      length: data[i + 2],
      tokenType: data[i + 3],
      modifiers: data[i + 4],
    });
  }
  return tokens;
}

interface SemanticHighlightingProps {
  tokens: SemanticToken[];
  theme?: SemanticTokenTheme;
  lineContent: string[];
  startLine?: number;
}

export const SemanticHighlighting: React.FC<SemanticHighlightingProps> = ({
  tokens,
  theme = DEFAULT_SEMANTIC_THEME,
  lineContent,
  startLine = 0,
}) => {
  const renderedLines = useMemo(() => {
    const tokensByLine = new Map<number, SemanticToken[]>();
    for (const token of tokens) {
      const line = token.line - startLine;
      if (!tokensByLine.has(line)) tokensByLine.set(line, []);
      tokensByLine.get(line)!.push(token);
    }

    return lineContent.map((content, lineIdx) => {
      const lineTokens = tokensByLine.get(lineIdx);
      if (!lineTokens || lineTokens.length === 0) {
        return { lineNum: startLine + lineIdx, segments: [{ text: content, style: { color: '#d4d4d4' } }] };
      }

      const sorted = [...lineTokens].sort((a, b) => a.startChar - b.startChar);
      const segments: Array<{ text: string; style: ReturnType<typeof resolveTokenStyle> }> = [];
      let pos = 0;

      for (const token of sorted) {
        if (token.startChar > pos) {
          segments.push({ text: content.substring(pos, token.startChar), style: { color: '#d4d4d4' } });
        }
        const style = resolveTokenStyle(token, theme);
        segments.push({ text: content.substring(token.startChar, token.startChar + token.length), style });
        pos = token.startChar + token.length;
      }

      if (pos < content.length) {
        segments.push({ text: content.substring(pos), style: { color: '#d4d4d4' } });
      }

      return { lineNum: startLine + lineIdx, segments };
    });
  }, [tokens, theme, lineContent, startLine]);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 13, lineHeight: '20px' }}>
      {renderedLines.map((line) => (
        <div key={line.lineNum} style={{ display: 'flex' }}>
          <span style={{
            width: 50, textAlign: 'right', paddingRight: 12,
            color: '#858585', fontSize: 12, userSelect: 'none', flexShrink: 0,
          }}>
            {line.lineNum + 1}
          </span>
          <span style={{ whiteSpace: 'pre' }}>
            {line.segments.map((seg, i) => (
              <span
                key={i}
                style={{
                  color: seg.style.color,
                  fontStyle: seg.style.fontStyle as React.CSSProperties['fontStyle'],
                  textDecoration: seg.style.textDecoration,
                  opacity: seg.style.opacity,
                }}
              >
                {seg.text}
              </span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
};
