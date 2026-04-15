import React, { useMemo } from 'react';

// ============================================================================
// Sticky Scroll - Shows nested scope context at top of editor
// ============================================================================

export interface StickyScrollScope {
  id: string;
  text: string;
  line: number;
  endLine: number;
  depth: number;
  kind: 'function' | 'class' | 'method' | 'interface' | 'enum' | 'namespace' | 'block' | 'module' | 'if' | 'for' | 'while' | 'switch' | 'try';
  detail?: string;
}

interface StickyScrollProps {
  scopes: StickyScrollScope[];
  currentLine: number;
  maxLines?: number;
  onScopeClick: (scope: StickyScrollScope) => void;
  visible?: boolean;
  lineNumberWidth?: number;
}

const KIND_COLORS: Record<StickyScrollScope['kind'], string> = {
  function: '#dcdcaa',
  class: '#4ec9b0',
  method: '#dcdcaa',
  interface: '#4ec9b0',
  enum: '#4ec9b0',
  namespace: '#4ec9b0',
  module: '#c586c0',
  block: '#d4d4d4',
  if: '#c586c0',
  for: '#c586c0',
  while: '#c586c0',
  switch: '#c586c0',
  try: '#c586c0',
};

export const StickyScroll: React.FC<StickyScrollProps> = ({
  scopes,
  currentLine,
  maxLines = 5,
  onScopeClick,
  visible = true,
  lineNumberWidth = 50,
}) => {
  const activeScopes = useMemo(() => {
    // Find all scopes that contain the current line, sorted by depth
    const containing = scopes
      .filter((s) => currentLine >= s.line && currentLine <= s.endLine)
      .sort((a, b) => a.depth - b.depth);
    
    // Only show scopes whose start line is above the viewport
    // In a real editor, we'd check viewport, but here we show all containing scopes
    return containing.slice(0, maxLines);
  }, [scopes, currentLine, maxLines]);

  if (!visible || activeScopes.length === 0) return null;

  return (
    <div style={{
      position: 'sticky',
      top: 0,
      zIndex: 10,
      background: 'var(--bg-primary, #1e1e1e)',
      borderBottom: '1px solid var(--border-color, #333)',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    }}>
      {activeScopes.map((scope, index) => (
        <div
          key={scope.id}
          onClick={() => onScopeClick(scope)}
          style={{
            display: 'flex',
            alignItems: 'center',
            height: 20,
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'monospace',
            lineHeight: '20px',
            background: index === activeScopes.length - 1
              ? 'rgba(55,148,255,0.05)'
              : 'transparent',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(55,148,255,0.1)')}
          onMouseOut={(e) => (e.currentTarget.style.background = index === activeScopes.length - 1 ? 'rgba(55,148,255,0.05)' : 'transparent')}
        >
          {/* Line number */}
          <span style={{
            width: lineNumberWidth,
            textAlign: 'right',
            paddingRight: 12,
            color: '#858585',
            fontSize: 12,
            userSelect: 'none',
            flexShrink: 0,
          }}>
            {scope.line}
          </span>
          {/* Indentation */}
          <span style={{ width: scope.depth * 16, flexShrink: 0 }} />
          {/* Scope text with syntax highlighting */}
          <span style={{
            color: KIND_COLORS[scope.kind],
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {scope.text}
          </span>
          {/* Detail */}
          {scope.detail && (
            <span style={{
              color: 'var(--text-secondary)',
              fontSize: 11,
              marginLeft: 8,
              paddingRight: 8,
              flexShrink: 0,
            }}>
              {scope.detail}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

// Utility: Extract scopes from a simple code structure
export function extractScopes(lines: string[]): StickyScrollScope[] {
  const scopes: StickyScrollScope[] = [];
  const stack: Array<{ line: number; depth: number; text: string; kind: StickyScrollScope['kind'] }> = [];
  let id = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimStart();
    const indent = line.length - trimmed.length;
    const depth = Math.floor(indent / 2);

    // Detect scope openers
    let kind: StickyScrollScope['kind'] | null = null;
    if (trimmed.match(/^(export\s+)?(async\s+)?function\s/)) kind = 'function';
    else if (trimmed.match(/^(export\s+)?(abstract\s+)?class\s/)) kind = 'class';
    else if (trimmed.match(/^(export\s+)?interface\s/)) kind = 'interface';
    else if (trimmed.match(/^(export\s+)?enum\s/)) kind = 'enum';
    else if (trimmed.match(/^(export\s+)?namespace\s/)) kind = 'namespace';
    else if (trimmed.match(/^(export\s+)?module\s/)) kind = 'module';
    else if (trimmed.match(/^\w+\s*\([^)]*\)\s*(:\s*\w+)?\s*\{/)) kind = 'method';
    else if (trimmed.startsWith('if ') || trimmed.startsWith('if(')) kind = 'if';
    else if (trimmed.startsWith('for ') || trimmed.startsWith('for(')) kind = 'for';
    else if (trimmed.startsWith('while ') || trimmed.startsWith('while(')) kind = 'while';
    else if (trimmed.startsWith('switch ') || trimmed.startsWith('switch(')) kind = 'switch';
    else if (trimmed.startsWith('try ') || trimmed.startsWith('try{')) kind = 'try';

    if (kind && trimmed.includes('{')) {
      stack.push({ line: i + 1, depth, text: trimmed.replace(/\s*\{.*$/, ''), kind });
    }

    // Close scopes
    if (trimmed.includes('}') && stack.length > 0) {
      const scope = stack.pop();
      if (scope) {
        scopes.push({
          id: `scope-${id++}`,
          text: scope.text,
          line: scope.line,
          endLine: i + 1,
          depth: scope.depth,
          kind: scope.kind,
        });
      }
    }
  }

  return scopes;
}
