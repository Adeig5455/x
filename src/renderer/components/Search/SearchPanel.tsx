import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Enhanced Search Panel - regex, replace, file filters, preview, match highlighting
// ============================================================================

interface SearchResult {
  filePath: string;
  lineNumber: number;
  columnNumber: number;
  lineContent: string;
  matchLength: number;
}

interface SearchPanelProps {
  searchResults?: SearchResult[];
  onSearch?: (query: string, options: SearchOptions) => void;
  onReplace?: (query: string, replacement: string, options: SearchOptions) => void;
  onReplaceAll?: (query: string, replacement: string, options: SearchOptions) => void;
  onResultClick?: (filePath: string, line: number, column: number) => void;
}

interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  useRegex: boolean;
  includePattern: string;
  excludePattern: string;
}

const ToggleButton: React.FC<{
  active: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ active, onClick, title, children }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 28,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: active ? '1px solid var(--accent, #007acc)' : '1px solid transparent',
        borderRadius: 3,
        background: active ? 'rgba(0, 122, 204, 0.2)' : hovered ? 'rgba(255,255,255,0.08)' : 'transparent',
        color: active ? 'var(--accent, #007acc)' : 'var(--foreground-muted, #888)',
        cursor: 'pointer',
        fontSize: 11,
        fontWeight: active ? 700 : 400,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
};

export const SearchPanel: React.FC<SearchPanelProps> = ({
  searchResults = [],
  onSearch,
  onReplace,
  onReplaceAll,
  onResultClick,
}) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [includePattern, setIncludePattern] = useState('');
  const [excludePattern, setExcludePattern] = useState('');
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  const [selectedResult, setSelectedResult] = useState<number>(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const allFiles = new Set(searchResults.map((r) => r.filePath));
    setExpandedFiles(allFiles);
  }, [searchResults]);

  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    onSearch?.(query, { caseSensitive, wholeWord, useRegex, includePattern, excludePattern });
  }, [query, caseSensitive, wholeWord, useRegex, includePattern, excludePattern, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  const handleReplace = useCallback(() => {
    onReplace?.(query, replacement, { caseSensitive, wholeWord, useRegex, includePattern, excludePattern });
  }, [query, replacement, caseSensitive, wholeWord, useRegex, includePattern, excludePattern, onReplace]);

  const handleReplaceAll = useCallback(() => {
    onReplaceAll?.(query, replacement, { caseSensitive, wholeWord, useRegex, includePattern, excludePattern });
  }, [query, replacement, caseSensitive, wholeWord, useRegex, includePattern, excludePattern, onReplaceAll]);

  const toggleFile = useCallback((filePath: string) => {
    setExpandedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(filePath)) next.delete(filePath);
      else next.add(filePath);
      return next;
    });
  }, []);

  const groupedResults = searchResults.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.filePath]) acc[r.filePath] = [];
    acc[r.filePath].push(r);
    return acc;
  }, {});

  const totalFiles = Object.keys(groupedResults).length;
  const totalMatches = searchResults.length;

  const highlightMatch = (text: string, matchCol: number, matchLen: number): React.ReactNode => {
    if (matchCol < 0 || matchLen <= 0) return text;
    const before = text.substring(0, matchCol);
    const match = text.substring(matchCol, matchCol + matchLen);
    const after = text.substring(matchCol + matchLen);
    return (
      <>
        <span>{before}</span>
        <span style={{ background: 'var(--search-match-background, rgba(234, 92, 0, 0.33))', borderRadius: 2, padding: '0 1px' }}>{match}</span>
        <span>{after}</span>
      </>
    );
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'var(--input-background, #3c3c3c)',
    border: '1px solid var(--input-border, #3c3c3c)',
    borderRadius: 3,
    color: 'var(--input-foreground, #ccc)',
    padding: '4px 8px',
    fontSize: 13,
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Search header */}
      <div style={{ padding: '8px 12px', flexShrink: 0 }}>
        {/* Toggle replace */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4 }}>
          <button
            onClick={() => setShowReplace(!showReplace)}
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted, #888)', cursor: 'pointer', fontSize: 12, padding: '4px 2px', flexShrink: 0 }}
          >
            {showReplace ? '\u25BC' : '\u25B6'}
          </button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Search input row */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search"
                  style={inputStyle}
                  spellCheck={false}
                />
              </div>
              <ToggleButton active={caseSensitive} onClick={() => setCaseSensitive(!caseSensitive)} title="Match Case (Alt+C)">Aa</ToggleButton>
              <ToggleButton active={wholeWord} onClick={() => setWholeWord(!wholeWord)} title="Match Whole Word (Alt+W)">ab</ToggleButton>
              <ToggleButton active={useRegex} onClick={() => setUseRegex(!useRegex)} title="Use Regular Expression (Alt+R)">.*</ToggleButton>
            </div>

            {/* Replace input row */}
            {showReplace && (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <input
                    value={replacement}
                    onChange={(e) => setReplacement(e.target.value)}
                    placeholder="Replace"
                    style={inputStyle}
                    spellCheck={false}
                  />
                </div>
                <button onClick={handleReplace} style={{ background: 'transparent', border: '1px solid var(--input-border, #3c3c3c)', borderRadius: 3, color: 'var(--foreground-muted, #888)', cursor: 'pointer', padding: '2px 6px', fontSize: 11 }} title="Replace">R</button>
                <button onClick={handleReplaceAll} style={{ background: 'transparent', border: '1px solid var(--input-border, #3c3c3c)', borderRadius: 3, color: 'var(--foreground-muted, #888)', cursor: 'pointer', padding: '2px 6px', fontSize: 11 }} title="Replace All">RA</button>
              </div>
            )}
          </div>
        </div>

        {/* File filter toggle */}
        <div style={{ marginTop: 6 }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted, #888)', cursor: 'pointer', fontSize: 11, padding: '2px 0' }}
          >
            {showFilters ? '\u25BC' : '\u25B6'} files to include/exclude
          </button>
          {showFilters && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
              <input
                value={includePattern}
                onChange={(e) => setIncludePattern(e.target.value)}
                placeholder="files to include (e.g. *.ts, src/**)"
                style={{ ...inputStyle, fontSize: 11 }}
                spellCheck={false}
              />
              <input
                value={excludePattern}
                onChange={(e) => setExcludePattern(e.target.value)}
                placeholder="files to exclude (e.g. node_modules)"
                style={{ ...inputStyle, fontSize: 11 }}
                spellCheck={false}
              />
            </div>
          )}
        </div>

        {/* Results summary */}
        {searchResults.length > 0 && (
          <div style={{ fontSize: 11, color: 'var(--foreground-muted, #888)', marginTop: 6 }}>
            {totalMatches} results in {totalFiles} files
          </div>
        )}
      </div>

      {/* Results list */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {searchResults.length === 0 && query.trim() && (
          <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--foreground-muted, #888)', fontSize: 12 }}>
            No results found
          </div>
        )}

        {Object.entries(groupedResults).map(([filePath, results]) => {
          const fileName = filePath.split('/').pop() || filePath;
          const dirPath = filePath.substring(0, filePath.length - fileName.length);
          const isExpanded = expandedFiles.has(filePath);

          return (
            <div key={filePath}>
              {/* File header */}
              <div
                onClick={() => toggleFile(filePath)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 12px',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: 'var(--foreground, #ccc)',
                }}
              >
                <span style={{ fontSize: 10, width: 12, flexShrink: 0 }}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
                <span style={{ fontWeight: 600 }}>{fileName}</span>
                <span style={{ color: 'var(--foreground-muted, #888)', fontSize: 11 }}>{dirPath}</span>
                <span style={{ marginLeft: 'auto', background: 'var(--badge-background, #4d4d4d)', borderRadius: 8, padding: '0 6px', fontSize: 10, color: 'var(--badge-foreground, #ccc)' }}>
                  {results.length}
                </span>
              </div>

              {/* Results for this file */}
              {isExpanded && results.map((result, idx) => (
                <div
                  key={idx}
                  onClick={() => onResultClick?.(result.filePath, result.lineNumber, result.columnNumber)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '2px 12px 2px 32px',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontFamily: "'Fira Code', Consolas, monospace",
                    lineHeight: 1.5,
                    color: 'var(--foreground, #ccc)',
                  }}
                >
                  <span style={{ color: 'var(--foreground-muted, #888)', fontSize: 11, width: 36, textAlign: 'right', flexShrink: 0 }}>
                    {result.lineNumber}
                  </span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {highlightMatch(result.lineContent, result.columnNumber, result.matchLength)}
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
