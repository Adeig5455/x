import React, { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Snippet System - User snippets, language-scoped, tab stops, variables
// ============================================================================

export interface SnippetVariable {
  name: string;
  defaultValue?: string;
  transform?: string;
}

export interface Snippet {
  id: string;
  name: string;
  prefix: string;
  body: string[];
  description?: string;
  scope?: string[];
  isBuiltin: boolean;
  source: 'user' | 'extension' | 'builtin';
  extensionId?: string;
  tabStops?: number;
  variables?: SnippetVariable[];
}

interface SnippetSystemProps {
  snippets: Snippet[];
  activeLanguage?: string;
  onInsertSnippet: (snippet: Snippet) => void;
  onCreateSnippet: (snippet: Omit<Snippet, 'id' | 'isBuiltin' | 'source'>) => void;
  onEditSnippet: (id: string, updates: Partial<Snippet>) => void;
  onDeleteSnippet: (id: string) => void;
  onDuplicateSnippet: (id: string) => void;
}

const SCOPE_COLORS: Record<string, string> = {
  javascript: '#f0db4f',
  typescript: '#3178c6',
  python: '#3776ab',
  rust: '#dea584',
  go: '#00add8',
  html: '#e34c26',
  css: '#264de4',
  json: '#292929',
  markdown: '#083fa1',
  global: '#4ec9b0',
};

const SnippetPreview: React.FC<{ body: string[] }> = ({ body }) => (
  <div style={{
    padding: 8,
    background: '#1a1a1a',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: '18px',
    maxHeight: 200,
    overflow: 'auto',
    border: '1px solid var(--border-color)',
  }}>
    {body.map((line, i) => (
      <div key={i} style={{ whiteSpace: 'pre' }}>
        {line.split(/(\$\{\d+:?[^}]*\}|\$\d+)/g).map((part, j) => {
          if (part.match(/^\$\{\d+:?[^}]*\}$/) || part.match(/^\$\d+$/)) {
            return <span key={j} style={{ color: '#cca700', background: 'rgba(204,167,0,0.15)', borderRadius: 2, padding: '0 2px' }}>{part}</span>;
          }
          if (part.match(/^\$[A-Z_]+$/)) {
            return <span key={j} style={{ color: '#c586c0' }}>{part}</span>;
          }
          return <span key={j} style={{ color: 'var(--text-primary)' }}>{part}</span>;
        })}
      </div>
    ))}
  </div>
);

const CreateSnippetForm: React.FC<{
  onSubmit: (snippet: Omit<Snippet, 'id' | 'isBuiltin' | 'source'>) => void;
  onCancel: () => void;
  activeLanguage?: string;
}> = ({ onSubmit, onCancel, activeLanguage }) => {
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [body, setBody] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState(activeLanguage || '');

  const handleSubmit = () => {
    if (!name || !prefix || !body) return;
    onSubmit({
      name,
      prefix,
      body: body.split('\n'),
      description: description || undefined,
      scope: scope ? scope.split(',').map((s) => s.trim()) : undefined,
    });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 8px', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 3, color: 'var(--text-primary)',
    fontSize: 12, outline: 'none',
  };

  return (
    <div style={{ padding: 12, borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>New Snippet</div>
      <div style={{ display: 'grid', gap: 6 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Snippet" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Prefix (trigger)</label>
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="mysnip" style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Body (use $1, $2 for tab stops, $0 for final cursor)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={'function ${1:name}(${2:params}) {\n  ${0}\n}'}
            rows={5}
            style={{ ...inputStyle, fontFamily: 'monospace', resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Scope (comma-separated languages)</label>
            <input value={scope} onChange={(e) => setScope(e.target.value)} placeholder="javascript,typescript" style={inputStyle} />
          </div>
        </div>
        {body && (
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, display: 'block' }}>Preview</label>
            <SnippetPreview body={body.split('\n')} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '4px 12px', borderRadius: 3, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSubmit} disabled={!name || !prefix || !body} style={{
            padding: '4px 12px', borderRadius: 3, border: 'none',
            background: name && prefix && body ? 'var(--accent-color)' : 'var(--bg-tertiary)',
            color: name && prefix && body ? '#fff' : 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
          }}>Create Snippet</button>
        </div>
      </div>
    </div>
  );
};

export const SnippetSystem: React.FC<SnippetSystemProps> = ({
  snippets,
  activeLanguage,
  onInsertSnippet,
  onCreateSnippet,
  onEditSnippet,
  onDeleteSnippet,
  onDuplicateSnippet,
}) => {
  const [filter, setFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'user' | 'extension' | 'builtin'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = snippets;
    if (sourceFilter !== 'all') result = result.filter((s) => s.source === sourceFilter);
    if (activeLanguage) {
      result = result.filter((s) => !s.scope || s.scope.length === 0 || s.scope.includes(activeLanguage));
    }
    if (filter) {
      const q = filter.toLowerCase();
      result = result.filter((s) =>
        s.name.toLowerCase().includes(q) ||
        s.prefix.toLowerCase().includes(q) ||
        (s.description || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [snippets, sourceFilter, activeLanguage, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>Snippets</span>
          {activeLanguage && (
            <span style={{
              fontSize: 9, padding: '1px 5px', borderRadius: 3,
              background: `${SCOPE_COLORS[activeLanguage] || '#569cd6'}22`,
              color: SCOPE_COLORS[activeLanguage] || '#569cd6',
            }}>{activeLanguage}</span>
          )}
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowCreate(true)} style={{
            background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: 14,
          }} title="Create Snippet">+</button>
        </div>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search snippets..."
          style={{
            width: '100%', padding: '3px 8px', background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)', borderRadius: 3, color: 'var(--text-primary)',
            fontSize: 11, outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
          {(['all', 'user', 'extension', 'builtin'] as const).map((src) => (
            <button key={src} onClick={() => setSourceFilter(src)} style={{
              padding: '1px 6px', borderRadius: 10, border: sourceFilter === src ? 'none' : '1px solid var(--border-color)',
              background: sourceFilter === src ? 'var(--accent-color)' : 'transparent',
              color: sourceFilter === src ? '#fff' : 'var(--text-secondary)', fontSize: 10, cursor: 'pointer', textTransform: 'capitalize',
            }}>{src}</button>
          ))}
        </div>
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateSnippetForm
          onSubmit={(s) => { onCreateSnippet(s); setShowCreate(false); }}
          onCancel={() => setShowCreate(false)}
          activeLanguage={activeLanguage}
        />
      )}

      {/* Snippet List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 12 }}>
            No snippets found
          </div>
        ) : (
          filtered.map((snippet) => (
            <div key={snippet.id}>
              <div
                onClick={() => setExpandedId(expandedId === snippet.id ? null : snippet.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderBottom: '1px solid rgba(60,60,60,0.2)', cursor: 'pointer',
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseOut={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>
                  {expandedId === snippet.id ? '▼' : '▶'}
                </span>
                <span style={{
                  padding: '1px 6px', borderRadius: 3, background: 'var(--bg-tertiary)',
                  fontFamily: 'monospace', fontSize: 11, color: '#dcdcaa',
                }}>{snippet.prefix}</span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)' }}>{snippet.name}</span>
                {snippet.scope && snippet.scope.length > 0 && (
                  <div style={{ display: 'flex', gap: 2 }}>
                    {snippet.scope.slice(0, 3).map((s) => (
                      <span key={s} style={{
                        fontSize: 9, padding: '0 4px', borderRadius: 2,
                        background: `${SCOPE_COLORS[s] || '#569cd6'}22`,
                        color: SCOPE_COLORS[s] || '#569cd6',
                      }}>{s}</span>
                    ))}
                  </div>
                )}
                <span style={{
                  fontSize: 9, padding: '0 4px', borderRadius: 2,
                  background: snippet.source === 'user' ? 'rgba(78,201,176,0.15)' : 'rgba(150,150,150,0.15)',
                  color: snippet.source === 'user' ? '#4ec9b0' : '#969696',
                }}>{snippet.source}</span>
              </div>
              {expandedId === snippet.id && (
                <div style={{ padding: '8px 8px 8px 28px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
                  {snippet.description && (
                    <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{snippet.description}</p>
                  )}
                  <SnippetPreview body={snippet.body} />
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    <button onClick={() => onInsertSnippet(snippet)} style={{
                      padding: '3px 10px', borderRadius: 3, border: 'none',
                      background: 'var(--accent-color)', color: '#fff', fontSize: 10, cursor: 'pointer',
                    }}>Insert</button>
                    <button onClick={() => onDuplicateSnippet(snippet.id)} style={{
                      padding: '3px 10px', borderRadius: 3, border: '1px solid var(--border-color)',
                      background: 'transparent', color: 'var(--text-secondary)', fontSize: 10, cursor: 'pointer',
                    }}>Duplicate</button>
                    {snippet.source === 'user' && (
                      <button onClick={() => onDeleteSnippet(snippet.id)} style={{
                        padding: '3px 10px', borderRadius: 3, border: '1px solid rgba(244,71,71,0.3)',
                        background: 'transparent', color: '#f44747', fontSize: 10, cursor: 'pointer',
                      }}>Delete</button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '3px 8px', borderTop: '1px solid var(--border-color)', fontSize: 10, color: 'var(--text-secondary)' }}>
        {filtered.length} snippets
      </div>
    </div>
  );
};
