import React, { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Document Outline - Symbol tree view with filtering, breadcrumb navigation
// ============================================================================

export type SymbolKind = 'file' | 'module' | 'namespace' | 'package' | 'class' | 'method' |
  'property' | 'field' | 'constructor' | 'enum' | 'interface' | 'function' |
  'variable' | 'constant' | 'string' | 'number' | 'boolean' | 'array' |
  'object' | 'key' | 'null' | 'enumMember' | 'struct' | 'event' |
  'operator' | 'typeParameter';

export interface DocumentSymbol {
  name: string;
  detail?: string;
  kind: SymbolKind;
  range: { startLine: number; endLine: number };
  selectionRange: { startLine: number; endLine: number };
  children: DocumentSymbol[];
  isDeprecated?: boolean;
}

interface DocumentOutlineProps {
  symbols: DocumentSymbol[];
  activeSymbolRange?: { startLine: number; endLine: number };
  onSymbolClick: (symbol: DocumentSymbol) => void;
  filePath?: string;
}

const SYMBOL_ICONS: Partial<Record<SymbolKind, { icon: string; color: string }>> = {
  class: { icon: 'C', color: '#e8ab53' },
  interface: { icon: 'I', color: '#75beff' },
  function: { icon: 'f', color: '#dcdcaa' },
  method: { icon: 'm', color: '#dcdcaa' },
  constructor: { icon: 'C', color: '#dcdcaa' },
  property: { icon: 'P', color: '#9cdcfe' },
  field: { icon: 'F', color: '#9cdcfe' },
  variable: { icon: 'V', color: '#9cdcfe' },
  constant: { icon: 'K', color: '#4fc1ff' },
  enum: { icon: 'E', color: '#e8ab53' },
  enumMember: { icon: 'e', color: '#4fc1ff' },
  struct: { icon: 'S', color: '#e8ab53' },
  namespace: { icon: 'N', color: '#569cd6' },
  module: { icon: 'M', color: '#569cd6' },
  typeParameter: { icon: 'T', color: '#4ec9b0' },
  event: { icon: '⚡', color: '#cca700' },
  operator: { icon: 'O', color: '#d4d4d4' },
};

const SymbolNode: React.FC<{
  symbol: DocumentSymbol;
  depth: number;
  activeRange?: { startLine: number; endLine: number };
  onSymbolClick: (symbol: DocumentSymbol) => void;
  expandedPaths: Set<string>;
  onToggle: (path: string) => void;
  parentPath: string;
  filter: string;
}> = ({ symbol, depth, activeRange, onSymbolClick, expandedPaths, onToggle, parentPath, filter }) => {
  const path = `${parentPath}/${symbol.name}`;
  const hasChildren = symbol.children.length > 0;
  const isExpanded = expandedPaths.has(path);
  const isActive = activeRange &&
    symbol.range.startLine <= activeRange.startLine &&
    symbol.range.endLine >= activeRange.endLine;

  const iconInfo = SYMBOL_ICONS[symbol.kind] || { icon: '?', color: '#969696' };

  const matchesFilter = !filter || symbol.name.toLowerCase().includes(filter.toLowerCase());
  const childrenMatchFilter = symbol.children.some((c) =>
    c.name.toLowerCase().includes(filter.toLowerCase()) ||
    c.children.some((cc) => cc.name.toLowerCase().includes(filter.toLowerCase()))
  );

  if (!matchesFilter && !childrenMatchFilter) return null;

  return (
    <div>
      <div
        onClick={() => {
          onSymbolClick(symbol);
          if (hasChildren) onToggle(path);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: `1px 8px 1px ${depth * 16 + 8}px`,
          cursor: 'pointer',
          background: isActive ? 'rgba(55, 148, 255, 0.1)' : 'transparent',
          borderLeft: isActive ? '2px solid var(--accent-color)' : '2px solid transparent',
          lineHeight: '22px',
          fontSize: 12,
        }}
        onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
        onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        {hasChildren && (
          <span style={{ fontSize: 8, width: 10, flexShrink: 0, color: 'var(--text-secondary)' }}>
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && <span style={{ width: 10, flexShrink: 0 }} />}
        <span style={{
          width: 16,
          height: 16,
          borderRadius: 3,
          background: `${iconInfo.color}22`,
          color: iconInfo.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 600,
          flexShrink: 0,
        }}>
          {iconInfo.icon}
        </span>
        <span style={{
          color: symbol.isDeprecated ? 'var(--text-secondary)' : 'var(--text-primary)',
          textDecoration: symbol.isDeprecated ? 'line-through' : 'none',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {symbol.name}
        </span>
        {symbol.detail && (
          <span style={{ color: 'var(--text-secondary)', fontSize: 10, flexShrink: 0 }}>
            {symbol.detail}
          </span>
        )}
        <span style={{ color: 'var(--text-secondary)', fontSize: 9, opacity: 0.5, flexShrink: 0 }}>
          :{symbol.range.startLine}
        </span>
      </div>
      {hasChildren && isExpanded && symbol.children.map((child, i) => (
        <SymbolNode
          key={`${child.name}-${i}`}
          symbol={child}
          depth={depth + 1}
          activeRange={activeRange}
          onSymbolClick={onSymbolClick}
          expandedPaths={expandedPaths}
          onToggle={onToggle}
          parentPath={path}
          filter={filter}
        />
      ))}
    </div>
  );
};

export const DocumentOutline: React.FC<DocumentOutlineProps> = ({
  symbols,
  activeSymbolRange,
  onSymbolClick,
  filePath,
}) => {
  const [filter, setFilter] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'position' | 'name' | 'kind'>('position');

  const toggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const paths = new Set<string>();
    const walk = (syms: DocumentSymbol[], prefix: string) => {
      for (const s of syms) {
        const path = `${prefix}/${s.name}`;
        if (s.children.length > 0) {
          paths.add(path);
          walk(s.children, path);
        }
      }
    };
    walk(symbols, '');
    setExpandedPaths(paths);
  }, [symbols]);

  const collapseAll = useCallback(() => setExpandedPaths(new Set()), []);

  const sortedSymbols = useMemo(() => {
    const sorted = [...symbols];
    if (sortBy === 'name') sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === 'kind') sorted.sort((a, b) => a.kind.localeCompare(b.kind));
    return sorted;
  }, [symbols, sortBy]);

  const symbolCount = useMemo(() => {
    let count = 0;
    const walk = (syms: DocumentSymbol[]) => {
      for (const s of syms) {
        count++;
        walk(s.children);
      }
    };
    walk(symbols);
    return count;
  }, [symbols]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter symbols..."
          style={{
            flex: 1,
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-primary)',
            padding: '3px 6px',
            borderRadius: 3,
            fontSize: 11,
            outline: 'none',
          }}
        />
        <button onClick={expandAll} title="Expand All" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11 }}>⊞</button>
        <button onClick={collapseAll} title="Collapse All" style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11 }}>⊟</button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'position' | 'name' | 'kind')}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: 3,
            padding: '1px 4px',
            fontSize: 10,
            outline: 'none',
          }}
        >
          <option value="position">By Position</option>
          <option value="name">By Name</option>
          <option value="kind">By Kind</option>
        </select>
      </div>

      {/* Symbol Tree */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {symbols.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 12 }}>
            No symbols found in document
          </div>
        ) : (
          sortedSymbols.map((symbol, i) => (
            <SymbolNode
              key={`${symbol.name}-${i}`}
              symbol={symbol}
              depth={0}
              activeRange={activeSymbolRange}
              onSymbolClick={onSymbolClick}
              expandedPaths={expandedPaths}
              onToggle={toggleExpand}
              parentPath=""
              filter={filter}
            />
          ))
        )}
      </div>

      {/* Status */}
      <div style={{
        padding: '2px 8px',
        borderTop: '1px solid var(--border-color)',
        fontSize: 10,
        color: 'var(--text-secondary)',
      }}>
        {symbolCount} symbols{filePath ? ` in ${filePath.split('/').pop()}` : ''}
      </div>
    </div>
  );
};
