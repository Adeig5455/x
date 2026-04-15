import React, { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Extension Marketplace - Search, install, ratings, categories, featured
// ============================================================================

export interface Extension {
  id: string;
  name: string;
  displayName: string;
  publisher: string;
  description: string;
  version: string;
  icon?: string;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  categories: string[];
  tags: string[];
  isInstalled: boolean;
  isEnabled: boolean;
  isBuiltin: boolean;
  lastUpdated: number;
  repository?: string;
  license?: string;
  size?: number;
  changelog?: string;
}

export type ExtensionSortBy = 'relevance' | 'installs' | 'rating' | 'name' | 'updated';
export type ExtensionFilter = 'all' | 'installed' | 'enabled' | 'disabled' | 'outdated' | 'builtin';

interface ExtensionMarketplaceProps {
  extensions: Extension[];
  installedExtensions: Extension[];
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  onSearch: (query: string) => void;
  onViewDetails: (id: string) => void;
  isLoading?: boolean;
}

const StarRating: React.FC<{ rating: number; count: number }> = ({ rating, count }) => {
  const stars = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const filled = rating - i;
      if (filled >= 1) return 'full';
      if (filled >= 0.5) return 'half';
      return 'empty';
    });
  }, [rating]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {stars.map((type, i) => (
        <span key={i} style={{ color: type === 'empty' ? '#555' : '#cca700', fontSize: 11 }}>
          {type === 'full' ? '★' : type === 'half' ? '★' : '☆'}
        </span>
      ))}
      <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 4 }}>
        ({count.toLocaleString()})
      </span>
    </div>
  );
};

const formatDownloads = (n: number): string => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const ExtensionCard: React.FC<{
  extension: Extension;
  onInstall: (id: string) => void;
  onUninstall: (id: string) => void;
  onEnable: (id: string) => void;
  onDisable: (id: string) => void;
  onViewDetails: (id: string) => void;
}> = ({ extension, onInstall, onUninstall, onEnable, onDisable, onViewDetails }) => (
  <div
    onClick={() => onViewDetails(extension.id)}
    style={{
      display: 'flex',
      gap: 12,
      padding: '10px 12px',
      borderBottom: '1px solid var(--border-color, #3c3c3c)',
      cursor: 'pointer',
      transition: 'background 0.15s',
    }}
    onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #2a2d2e)')}
    onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
  >
    {/* Icon */}
    <div style={{
      width: 42,
      height: 42,
      borderRadius: 6,
      background: extension.icon ? 'transparent' : 'var(--bg-tertiary, #2d2d30)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      fontSize: 20,
      color: 'var(--accent-color)',
      border: '1px solid var(--border-color, #3c3c3c)',
    }}>
      {extension.icon ? (
        <img src={extension.icon} alt="" style={{ width: 42, height: 42, borderRadius: 6 }} />
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="8" height="8" rx="1" />
          <rect x="13" y="3" width="8" height="8" rx="1" />
          <rect x="3" y="13" width="8" height="8" rx="1" />
          <rect x="13" y="13" width="8" height="8" rx="1" />
        </svg>
      )}
    </div>

    {/* Info */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>
          {extension.displayName}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>v{extension.version}</span>
        {extension.isBuiltin && (
          <span style={{
            fontSize: 9,
            padding: '1px 4px',
            borderRadius: 2,
            background: 'rgba(55, 148, 255, 0.2)',
            color: '#3794ff',
          }}>
            Built-in
          </span>
        )}
      </div>
      <div style={{
        fontSize: 11,
        color: 'var(--text-secondary)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        marginTop: 2,
      }}>
        {extension.description}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{extension.publisher}</span>
        <StarRating rating={extension.rating} count={extension.ratingCount} />
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {formatDownloads(extension.downloadCount)} installs
        </span>
      </div>
    </div>

    {/* Actions */}
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}
      onClick={(e) => e.stopPropagation()}
    >
      {extension.isInstalled ? (
        <>
          <button
            onClick={() => extension.isEnabled ? onDisable(extension.id) : onEnable(extension.id)}
            style={{
              padding: '3px 8px',
              borderRadius: 3,
              border: '1px solid var(--border-color)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {extension.isEnabled ? 'Disable' : 'Enable'}
          </button>
          {!extension.isBuiltin && (
            <button
              onClick={() => onUninstall(extension.id)}
              style={{
                padding: '3px 8px',
                borderRadius: 3,
                border: '1px solid rgba(244,71,71,0.3)',
                background: 'transparent',
                color: '#f44747',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Uninstall
            </button>
          )}
        </>
      ) : (
        <button
          onClick={() => onInstall(extension.id)}
          style={{
            padding: '3px 12px',
            borderRadius: 3,
            border: 'none',
            background: 'var(--accent-color, #007acc)',
            color: '#fff',
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 500,
          }}
        >
          Install
        </button>
      )}
    </div>
  </div>
);

const CATEGORIES = ['All', 'Languages', 'Themes', 'Formatters', 'Linters', 'Debuggers', 'Testing', 'AI', 'Git', 'Other'];

export const ExtensionMarketplace: React.FC<ExtensionMarketplaceProps> = ({
  extensions,
  installedExtensions,
  onInstall,
  onUninstall,
  onEnable,
  onDisable,
  onSearch,
  onViewDetails,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ExtensionFilter>('all');
  const [sortBy, setSortBy] = useState<ExtensionSortBy>('relevance');
  const [category, setCategory] = useState('All');

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  }, [onSearch]);

  const filteredExtensions = useMemo(() => {
    let list = filter === 'installed' ? installedExtensions :
      filter === 'enabled' ? installedExtensions.filter((e) => e.isEnabled) :
      filter === 'disabled' ? installedExtensions.filter((e) => !e.isEnabled) :
      filter === 'builtin' ? installedExtensions.filter((e) => e.isBuiltin) :
      extensions;

    if (category !== 'All') {
      list = list.filter((e) => e.categories.includes(category));
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter((e) =>
        e.displayName.toLowerCase().includes(q) ||
        e.publisher.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    switch (sortBy) {
      case 'installs': return [...list].sort((a, b) => b.downloadCount - a.downloadCount);
      case 'rating': return [...list].sort((a, b) => b.rating - a.rating);
      case 'name': return [...list].sort((a, b) => a.displayName.localeCompare(b.displayName));
      case 'updated': return [...list].sort((a, b) => b.lastUpdated - a.lastUpdated);
      default: return list;
    }
  }, [extensions, installedExtensions, filter, sortBy, category, query]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Search */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-color)' }}>
        <input
          value={query}
          onChange={handleSearchChange}
          placeholder="Search extensions in marketplace..."
          style={{
            width: '100%',
            padding: '6px 10px',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            fontSize: 12,
            outline: 'none',
          }}
        />
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '6px 12px',
        borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap',
      }}>
        {(['all', 'installed', 'enabled', 'disabled', 'builtin'] as ExtensionFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '2px 8px',
              borderRadius: 10,
              border: filter === f ? 'none' : '1px solid var(--border-color)',
              background: filter === f ? 'var(--accent-color)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              fontSize: 11,
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as ExtensionSortBy)}
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)',
            borderRadius: 3,
            padding: '2px 6px',
            fontSize: 11,
            outline: 'none',
          }}
        >
          <option value="relevance">Relevance</option>
          <option value="installs">Installs</option>
          <option value="rating">Rating</option>
          <option value="name">Name</option>
          <option value="updated">Updated</option>
        </select>
      </div>

      {/* Categories */}
      <div style={{
        display: 'flex',
        gap: 4,
        padding: '4px 12px',
        borderBottom: '1px solid var(--border-color)',
        overflowX: 'auto',
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: '2px 8px',
              borderRadius: 3,
              border: 'none',
              background: category === cat ? 'var(--bg-active)' : 'transparent',
              color: category === cat ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: 11,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Extension List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>⟳</div>
            Loading extensions...
          </div>
        ) : filteredExtensions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)', fontSize: 12 }}>
            No extensions found
          </div>
        ) : (
          filteredExtensions.map((ext) => (
            <ExtensionCard
              key={ext.id}
              extension={ext}
              onInstall={onInstall}
              onUninstall={onUninstall}
              onEnable={onEnable}
              onDisable={onDisable}
              onViewDetails={onViewDetails}
            />
          ))
        )}
      </div>

      {/* Status Bar */}
      <div style={{
        padding: '4px 12px',
        borderTop: '1px solid var(--border-color)',
        fontSize: 11,
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>{filteredExtensions.length} extensions</span>
        <span>{installedExtensions.length} installed</span>
      </div>
    </div>
  );
};
