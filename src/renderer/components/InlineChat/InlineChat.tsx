import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Inline Chat - AI edit directly in editor, diff preview, accept/reject
// ============================================================================

export type InlineChatMode = 'edit' | 'generate' | 'explain' | 'refactor' | 'fix';

export interface InlineChatDiff {
  type: 'add' | 'remove' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface InlineChatSuggestion {
  id: string;
  originalCode: string;
  suggestedCode: string;
  diff: InlineChatDiff[];
  explanation?: string;
  confidence: number;
}

interface InlineChatProps {
  position: { line: number; column: number };
  selectedCode?: string;
  onSubmit: (prompt: string, mode: InlineChatMode) => void;
  onAccept: (suggestion: InlineChatSuggestion) => void;
  onReject: () => void;
  onClose: () => void;
  suggestion?: InlineChatSuggestion | null;
  isLoading?: boolean;
  streamingText?: string;
}

const MODE_CONFIG: Record<InlineChatMode, { label: string; icon: string; placeholder: string; color: string }> = {
  edit: { label: 'Edit', icon: '✏️', placeholder: 'Describe the edit...', color: '#3794ff' },
  generate: { label: 'Generate', icon: '✨', placeholder: 'Describe what to generate...', color: '#4ec9b0' },
  explain: { label: 'Explain', icon: '💡', placeholder: 'What to explain...', color: '#cca700' },
  refactor: { label: 'Refactor', icon: '🔄', placeholder: 'Describe the refactor...', color: '#c586c0' },
  fix: { label: 'Fix', icon: '🔧', placeholder: 'Describe the fix...', color: '#f44747' },
};

const DiffView: React.FC<{ diff: InlineChatDiff[] }> = ({ diff }) => (
  <div style={{
    fontFamily: 'monospace', fontSize: 12, lineHeight: '20px',
    maxHeight: 300, overflow: 'auto', borderRadius: 4,
    border: '1px solid var(--border-color)',
  }}>
    {diff.map((line, i) => (
      <div
        key={i}
        style={{
          padding: '0 8px',
          background: line.type === 'add' ? 'rgba(78,201,176,0.1)' :
            line.type === 'remove' ? 'rgba(244,71,71,0.1)' : 'transparent',
          color: line.type === 'add' ? '#4ec9b0' :
            line.type === 'remove' ? '#f44747' : 'var(--text-primary)',
          textDecoration: line.type === 'remove' ? 'line-through' : 'none',
          opacity: line.type === 'remove' ? 0.7 : 1,
        }}
      >
        <span style={{ color: 'var(--text-secondary)', width: 20, display: 'inline-block', userSelect: 'none' }}>
          {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
        </span>
        {line.content}
      </div>
    ))}
  </div>
);

export const InlineChat: React.FC<InlineChatProps> = ({
  position,
  selectedCode,
  onSubmit,
  onAccept,
  onReject,
  onClose,
  suggestion,
  isLoading,
  streamingText,
}) => {
  const [prompt, setPrompt] = useState('');
  const [mode, setMode] = useState<InlineChatMode>('edit');
  const [showDiff, setShowDiff] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    if (!prompt.trim() && !selectedCode) return;
    onSubmit(prompt, mode);
  }, [prompt, mode, selectedCode, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSubmit, onClose]);

  return (
    <div style={{
      position: 'relative',
      background: 'var(--bg-secondary, #252526)',
      border: '1px solid var(--accent-color, #007acc)',
      borderRadius: 8,
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      width: '100%',
      maxWidth: 600,
      overflow: 'hidden',
    }}>
      {/* Header with mode selector */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
        background: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>AI</span>
        {(Object.entries(MODE_CONFIG) as Array<[InlineChatMode, typeof MODE_CONFIG[InlineChatMode]]>).map(([m, config]) => (
          <button
            key={m}
            onClick={() => setMode(m as InlineChatMode)}
            style={{
              padding: '2px 6px', borderRadius: 10, border: 'none', fontSize: 10, cursor: 'pointer',
              background: mode === m ? `${config.color}22` : 'transparent',
              color: mode === m ? config.color : 'var(--text-secondary)',
            }}
          >
            {config.icon} {config.label}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          L{position.line}:C{position.column}
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
        }}>×</button>
      </div>

      {/* Selected code preview */}
      {selectedCode && (
        <div style={{
          padding: '4px 8px', background: 'rgba(55,148,255,0.05)',
          borderBottom: '1px solid var(--border-color)',
          fontFamily: 'monospace', fontSize: 11, color: 'var(--text-secondary)',
          maxHeight: 60, overflow: 'hidden',
        }}>
          <div style={{ fontSize: 9, color: 'var(--text-secondary)', marginBottom: 2 }}>Selected code:</div>
          <div style={{ whiteSpace: 'pre', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedCode.slice(0, 200)}
            {selectedCode.length > 200 ? '...' : ''}
          </div>
        </div>
      )}

      {/* Input area */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px' }}>
        <span style={{ fontSize: 14 }}>{MODE_CONFIG[mode].icon}</span>
        <input
          ref={inputRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={MODE_CONFIG[mode].placeholder}
          disabled={isLoading}
          style={{
            flex: 1, padding: '4px 8px', background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)', borderRadius: 4,
            color: 'var(--text-primary)', fontSize: 12, outline: 'none',
          }}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!prompt.trim() && !selectedCode)}
          style={{
            padding: '4px 12px', borderRadius: 4, border: 'none',
            background: isLoading ? 'var(--bg-tertiary)' : MODE_CONFIG[mode].color,
            color: isLoading ? 'var(--text-secondary)' : '#fff',
            fontSize: 11, fontWeight: 600, cursor: isLoading ? 'wait' : 'pointer',
          }}
        >
          {isLoading ? '...' : 'Go'}
        </button>
      </div>

      {/* Loading / Streaming */}
      {isLoading && (
        <div style={{
          padding: '8px 12px', borderTop: '1px solid var(--border-color)',
          fontSize: 12,
        }}>
          {streamingText ? (
            <div style={{
              fontFamily: 'monospace', fontSize: 11, color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto',
              background: 'var(--bg-primary)', padding: 8, borderRadius: 4,
            }}>
              {streamingText}
              <span style={{ animation: 'blink 1s infinite', color: 'var(--accent-color)' }}>▊</span>
            </div>
          ) : (
            <div style={{ color: 'var(--accent-color)', fontSize: 11 }}>
              Thinking...
            </div>
          )}
        </div>
      )}

      {/* Suggestion / Diff */}
      {suggestion && !isLoading && (
        <div style={{ padding: '8px', borderTop: '1px solid var(--border-color)' }}>
          {suggestion.explanation && (
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, lineHeight: 1.5 }}>
              {suggestion.explanation}
            </div>
          )}

          {showDiff && suggestion.diff.length > 0 && (
            <DiffView diff={suggestion.diff} />
          )}

          {/* Confidence indicator */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginTop: 6,
          }}>
            <div style={{
              flex: 1, height: 3, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden',
            }}>
              <div style={{
                width: `${suggestion.confidence * 100}%`, height: '100%', borderRadius: 2,
                background: suggestion.confidence > 0.8 ? '#4ec9b0' :
                  suggestion.confidence > 0.5 ? '#cca700' : '#f44747',
              }} />
            </div>
            <span style={{ fontSize: 9, color: 'var(--text-secondary)' }}>
              {Math.round(suggestion.confidence * 100)}%
            </span>
          </div>

          {/* Accept / Reject buttons */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={() => onAccept(suggestion)}
              style={{
                flex: 1, padding: '6px', borderRadius: 4, border: 'none',
                background: '#4ec9b0', color: '#000', fontSize: 11, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Accept (Ctrl+Enter)
            </button>
            <button
              onClick={onReject}
              style={{
                flex: 1, padding: '6px', borderRadius: 4, border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Reject (Esc)
            </button>
            <button
              onClick={() => setShowDiff(!showDiff)}
              style={{
                padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {showDiff ? 'Hide' : 'Show'} Diff
            </button>
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div style={{
        padding: '2px 8px', background: 'var(--bg-tertiary)',
        borderTop: '1px solid var(--border-color)',
        fontSize: 9, color: 'var(--text-secondary)',
        display: 'flex', gap: 8,
      }}>
        <span>Enter to submit</span>
        <span>Esc to close</span>
        <span>Ctrl+Enter to accept</span>
        <span>Tab to cycle modes</span>
      </div>
    </div>
  );
};
