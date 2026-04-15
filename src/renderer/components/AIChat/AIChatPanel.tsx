import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// Markdown Parser (lightweight, zero-dependency)
// ============================================================================

interface ParsedBlock {
  type: 'text' | 'code' | 'heading' | 'list' | 'blockquote' | 'hr' | 'table';
  content: string;
  language?: string;
  level?: number;
  items?: string[];
  rows?: string[][];
}

function parseMarkdown(text: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const lines = text.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', content: codeLines.join('\n'), language: language || 'text' });
      i++;
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      blocks.push({ type: 'heading', content: headingMatch[2], level: headingMatch[1].length });
      i++;
      continue;
    }

    if (/^(-{3,}|_{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push({ type: 'hr', content: '' });
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        quoteLines.push(lines[i].slice(2));
        i++;
      }
      blocks.push({ type: 'blockquote', content: quoteLines.join('\n') });
      continue;
    }

    if (/^[\s]*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*[-*+]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*[-*+]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', content: '', items });
      continue;
    }

    if (/^[\s]*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\s]*\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[\s]*\d+\.\s+/, ''));
        i++;
      }
      blocks.push({ type: 'list', content: '', items });
      continue;
    }

    if (line.includes('|') && i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1])) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|')) {
        const cells = lines[i].split('|').map((c) => c.trim()).filter(Boolean);
        if (!/^[\s:-]+$/.test(lines[i])) {
          rows.push(cells);
        }
        i++;
      }
      blocks.push({ type: 'table', content: '', rows });
      continue;
    }

    if (line.trim()) {
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() && !lines[i].startsWith('```') && !lines[i].startsWith('#') && !lines[i].startsWith('> ')) {
        textLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'text', content: textLines.join('\n') });
      continue;
    }
    i++;
  }
  return blocks;
}

function renderInlineMarkdown(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '<code class="chat-inline-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

// ============================================================================
// Code Block Component
// ============================================================================

const CodeBlock: React.FC<{
  code: string;
  language: string;
  onCopy: (code: string) => void;
  onInsert: (code: string) => void;
}> = ({ code, language, onCopy, onInsert }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopy(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ background: 'var(--editor-background, #1e1e1e)', borderRadius: 6, overflow: 'hidden', margin: '8px 0', border: '1px solid var(--panel-border, #333)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 12px', background: 'var(--titlebar-background, #2d2d2d)', fontSize: 11, color: 'var(--foreground-muted, #888)' }}>
        <span>{language}</span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => onInsert(code)} style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted, #888)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 3 }} title="Insert at cursor">Insert</button>
          <button onClick={handleCopy} style={{ background: 'transparent', border: 'none', color: copied ? 'var(--success, #4caf50)' : 'var(--foreground-muted, #888)', cursor: 'pointer', fontSize: 11, padding: '2px 6px', borderRadius: 3 }} title="Copy">{copied ? 'Copied!' : 'Copy'}</button>
        </div>
      </div>
      <pre style={{ margin: 0, padding: 12, overflow: 'auto', fontSize: 13, fontFamily: "'Fira Code', Consolas, monospace", lineHeight: 1.5, color: 'var(--editor-foreground, #d4d4d4)', maxHeight: 400 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};

// ============================================================================
// Message Component
// ============================================================================

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
  tokenCount?: number;
  model?: string;
}

const MessageComponent: React.FC<{
  message: ChatMessage;
  onCopyCode: (code: string) => void;
  onInsertCode: (code: string) => void;
}> = ({ message, onCopyCode, onInsertCode }) => {
  const blocks = useMemo(() => parseMarkdown(message.content), [message.content]);
  const isUser = message.role === 'user';

  return (
    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--panel-border, #2d2d2d)', background: isUser ? 'transparent' : 'var(--editor-background, #1e1e1e)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 'bold', background: isUser ? 'var(--accent, #007acc)' : 'var(--success, #6a9955)', color: '#fff' }}>
          {isUser ? 'U' : 'AI'}
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground, #ccc)' }}>
          {isUser ? 'You' : message.model || 'Assistant'}
        </span>
        <span style={{ fontSize: 11, color: 'var(--foreground-muted, #666)', marginLeft: 'auto' }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
        {message.tokenCount != null && (
          <span style={{ fontSize: 10, color: 'var(--foreground-muted, #555)' }}>{message.tokenCount} tokens</span>
        )}
      </div>
      <div style={{ paddingLeft: 32 }}>
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'code':
              return <CodeBlock key={idx} code={block.content} language={block.language || 'text'} onCopy={onCopyCode} onInsert={onInsertCode} />;
            case 'heading':
              return <div key={idx} style={{ fontSize: 18 - (block.level || 1) * 1.5, fontWeight: 'bold', margin: '12px 0 6px', color: 'var(--foreground, #ccc)' }}>{block.content}</div>;
            case 'blockquote':
              return <div key={idx} style={{ borderLeft: '3px solid var(--accent, #007acc)', paddingLeft: 12, margin: '8px 0', color: 'var(--foreground-muted, #999)', fontStyle: 'italic' }} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }} />;
            case 'list':
              return (
                <ul key={idx} style={{ margin: '8px 0', paddingLeft: 20 }}>
                  {block.items?.map((item, j) => (
                    <li key={j} style={{ margin: '4px 0', color: 'var(--foreground, #ccc)', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
                  ))}
                </ul>
              );
            case 'table':
              return (
                <table key={idx} style={{ borderCollapse: 'collapse', margin: '8px 0', fontSize: 13, width: '100%' }}>
                  <tbody>
                    {block.rows?.map((row, ri) => (
                      <tr key={ri}>{row.map((cell, ci) => (<td key={ci} style={{ border: '1px solid var(--panel-border, #444)', padding: '4px 8px', color: 'var(--foreground, #ccc)', fontWeight: ri === 0 ? 'bold' : 'normal' }} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(cell) }} />))}</tr>
                    ))}
                  </tbody>
                </table>
              );
            case 'hr':
              return <hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--panel-border, #444)', margin: '12px 0' }} />;
            default:
              return <p key={idx} style={{ margin: '6px 0', lineHeight: 1.6, color: 'var(--foreground, #ccc)', fontSize: 13 }} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }} />;
          }
        })}
        {message.isStreaming && <span className="ai-cursor-blink" />}
      </div>
    </div>
  );
};

// ============================================================================
// Model Selector Data
// ============================================================================

const AVAILABLE_MODELS = [
  { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'OpenAI' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', provider: 'OpenAI' },
  { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', provider: 'Anthropic' },
  { id: 'claude-3-haiku', name: 'Claude 3 Haiku', provider: 'Anthropic' },
];

// ============================================================================
// AI Chat Panel - Full-featured chat with markdown, code blocks, streaming
// ============================================================================

interface AIChatPanelProps {
  messages?: ChatMessage[];
  isLoading?: boolean;
  streamingMessageId?: string | null;
  model?: string;
  onSendMessage?: (content: string) => void;
  onStopGeneration?: () => void;
  onClearMessages?: () => void;
  onInsertCode?: (code: string) => void;
  onCopyCode?: (code: string) => void;
  onModelChange?: (model: string) => void;
}

export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  messages = [],
  isLoading = false,
  streamingMessageId = null,
  model = 'gpt-4',
  onSendMessage,
  onStopGeneration,
  onClearMessages,
  onInsertCode,
  onCopyCode,
  onModelChange,
}) => {
  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessageId]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return;
    onSendMessage?.(input.trim());
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
  }, [input, isLoading, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleCopyCode = useCallback((code: string) => {
    if (onCopyCode) { onCopyCode(code); return; }
    navigator.clipboard?.writeText(code);
  }, [onCopyCode]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--sidebar-background, #252526)', color: 'var(--foreground, #ccc)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid var(--panel-border, #333)', gap: 8, minHeight: 36 }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>AI Chat</span>
        <div style={{ flex: 1 }} />
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowModelPicker(!showModelPicker)} style={{ background: 'var(--button-background, #333)', border: '1px solid var(--panel-border, #444)', color: 'var(--foreground, #ccc)', cursor: 'pointer', fontSize: 11, padding: '3px 8px', borderRadius: 3 }}>
            {AVAILABLE_MODELS.find((m) => m.id === model)?.name || model}
          </button>
          {showModelPicker && (
            <div style={{ position: 'absolute', top: '100%', right: 0, background: 'var(--dropdown-background, #2d2d2d)', border: '1px solid var(--panel-border, #444)', borderRadius: 4, zIndex: 100, minWidth: 200, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
              {AVAILABLE_MODELS.map((m) => (
                <div key={m.id} onClick={() => { onModelChange?.(m.id); setShowModelPicker(false); }} style={{ padding: '6px 12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontSize: 12, background: m.id === model ? 'var(--list-active-background, #094771)' : 'transparent', color: 'var(--foreground, #ccc)' }}>
                  <span>{m.name}</span>
                  <span style={{ color: 'var(--foreground-muted, #888)', fontSize: 10 }}>{m.provider}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClearMessages} style={{ background: 'transparent', border: 'none', color: 'var(--foreground-muted, #888)', cursor: 'pointer', fontSize: 12, padding: '4px 8px', borderRadius: 3 }} title="Clear messages">Clear</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, color: 'var(--foreground-muted, #666)' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>AI</div>
            <div style={{ fontSize: 14, marginBottom: 8 }}>Ask anything about your code</div>
            <div style={{ fontSize: 12, textAlign: 'center', lineHeight: 1.8 }}>
              Use <code style={{ background: 'var(--editor-background, #1e1e1e)', padding: '2px 4px', borderRadius: 3 }}>@file</code> to reference files
              <br />
              Use <code style={{ background: 'var(--editor-background, #1e1e1e)', padding: '2px 4px', borderRadius: 3 }}>Ctrl+L</code> to add selection as context
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageComponent key={msg.id} message={msg} onCopyCode={handleCopyCode} onInsertCode={(code) => onInsertCode?.(code)} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={{ borderTop: '1px solid var(--panel-border, #333)', padding: '8px 12px' }}>
        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0 8px' }}>
            <button onClick={onStopGeneration} style={{ background: 'var(--error-background, #5a1d1d)', border: '1px solid var(--error, #f44)', color: 'var(--error, #f44)', cursor: 'pointer', fontSize: 12, padding: '4px 12px', borderRadius: 3 }}>Stop generating</button>
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea ref={inputRef} value={input} onChange={handleInputChange} onKeyDown={handleKeyDown} placeholder="Ask about your code... (Shift+Enter for new line)" rows={1} style={{ flex: 1, background: 'var(--input-background, #3c3c3c)', border: '1px solid var(--input-border, #555)', borderRadius: 6, color: 'var(--foreground, #ccc)', fontSize: 13, fontFamily: 'inherit', padding: '8px 12px', resize: 'none', outline: 'none', maxHeight: 200, lineHeight: 1.4 }} />
          <button onClick={handleSend} disabled={!input.trim() || isLoading} style={{ background: input.trim() && !isLoading ? 'var(--accent, #007acc)' : 'var(--button-background, #333)', border: 'none', color: '#fff', cursor: input.trim() && !isLoading ? 'pointer' : 'default', fontSize: 13, padding: '8px 16px', borderRadius: 6, opacity: input.trim() && !isLoading ? 1 : 0.5, minHeight: 36 }}>Send</button>
        </div>
      </div>
    </div>
  );
};
