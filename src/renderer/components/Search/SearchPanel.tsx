import React, { useState } from 'react';
import { useAppStore } from '../../store';
import type { SearchResult } from '../../../shared/types';

export const SearchPanel: React.FC = () => {
  const [query, setQuery] = useState('');
  const [useRegex, setUseRegex] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const { searchResults, setSearchResults, setSearchQuery } = useAppStore();

  const handleSearch = () => {
    setSearchQuery(query);
    // TODO: Implement actual file search via IPC
    setSearchResults([]);
  };

  const groupedResults = searchResults.reduce<Record<string, SearchResult[]>>((acc, result) => {
    if (!acc[result.filePath]) acc[result.filePath] = [];
    acc[result.filePath].push(result);
    return acc;
  }, {});

  return (
    <div className="search-panel">
      <div className="search-input-group">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search files..."
        />
        <div className="search-options">
          <button
            className={caseSensitive ? 'active' : ''}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Match Case"
          >
            Aa
          </button>
          <button
            className={useRegex ? 'active' : ''}
            onClick={() => setUseRegex(!useRegex)}
            title="Use Regex"
          >
            .*
          </button>
        </div>
      </div>
      <div className="search-results">
        {Object.entries(groupedResults).map(([filePath, results]) => (
          <div key={filePath} className="search-file-group">
            <div className="search-file-path">{filePath}</div>
            {results.map((result, idx) => (
              <div key={idx} className="search-result-line">
                <span className="line-number">{result.lineNumber}</span>
                <span className="line-content">{result.lineContent}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
