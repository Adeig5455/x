import React, { useState, useMemo, useCallback } from 'react';

// ============================================================================
// Custom Editor - Image preview, Markdown preview, hex editor, JSON tree
// ============================================================================

export type CustomEditorType = 'image' | 'markdown' | 'hex' | 'json' | 'svg' | 'audio' | 'video' | 'pdf';

export interface CustomEditorFile {
  path: string;
  name: string;
  type: CustomEditorType;
  content: string;
  size: number;
  mimeType?: string;
  encoding?: string;
}

interface CustomEditorProps {
  file: CustomEditorFile;
  onClose: () => void;
  onOpenInTextEditor: () => void;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

const ImagePreview: React.FC<{ file: CustomEditorFile; zoom: number; onZoomChange: (z: number) => void }> = ({ file, zoom, onZoomChange }) => {
  const [fitMode, setFitMode] = useState<'fit' | 'actual' | 'fill'>('fit');
  const [showGrid, setShowGrid] = useState(false);
  const [imageInfo, setImageInfo] = useState<{ width: number; height: number } | null>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px',
        background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
      }}>
        {(['fit', 'actual', 'fill'] as const).map((mode) => (
          <button key={mode} onClick={() => setFitMode(mode)} style={{
            padding: '2px 8px', borderRadius: 3, border: 'none', fontSize: 11, cursor: 'pointer',
            background: fitMode === mode ? 'var(--accent-color)' : 'transparent',
            color: fitMode === mode ? '#fff' : 'var(--text-secondary)',
          }}>{mode}</button>
        ))}
        <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>|</span>
        <button onClick={() => onZoomChange(Math.max(10, zoom - 25))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>−</button>
        <span style={{ fontSize: 11, color: 'var(--text-primary)', minWidth: 40, textAlign: 'center' }}>{zoom}%</span>
        <button onClick={() => onZoomChange(Math.min(500, zoom + 25))} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}>+</button>
        <button onClick={() => setShowGrid(!showGrid)} style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 11,
          color: showGrid ? 'var(--accent-color)' : 'var(--text-secondary)',
        }}>Grid</button>
        <div style={{ flex: 1 }} />
        {imageInfo && (
          <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
            {imageInfo.width} × {imageInfo.height}px · {(file.size / 1024).toFixed(1)}KB
          </span>
        )}
      </div>
      <div style={{
        flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: showGrid ? 'repeating-conic-gradient(#333 0% 25%, #2a2a2a 0% 50%) 0 0 / 16px 16px' : 'var(--bg-primary)',
      }}>
        <img
          src={`data:${file.mimeType || 'image/png'};base64,${file.content}`}
          alt={file.name}
          style={{
            maxWidth: fitMode === 'fit' ? '100%' : fitMode === 'fill' ? '100%' : 'none',
            maxHeight: fitMode === 'fit' ? '100%' : fitMode === 'fill' ? '100%' : 'none',
            objectFit: fitMode === 'fill' ? 'cover' : 'contain',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'center',
            imageRendering: zoom > 200 ? 'pixelated' : 'auto',
          }}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setImageInfo({ width: img.naturalWidth, height: img.naturalHeight });
          }}
        />
      </div>
    </div>
  );
};

const MarkdownPreview: React.FC<{ content: string }> = ({ content }) => {
  const html = useMemo(() => {
    // Simple markdown to HTML converter
    let result = content
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code style="background:var(--bg-tertiary);padding:1px 4px;border-radius:3px;font-size:12px">$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:var(--accent-color)">$1</a>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^> (.*$)/gm, '<blockquote style="border-left:3px solid var(--accent-color);padding-left:12px;color:var(--text-secondary);margin:8px 0">$1</blockquote>')
      .replace(/^---$/gm, '<hr style="border:none;border-top:1px solid var(--border-color);margin:16px 0"/>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');
    return `<p>${result}</p>`;
  }, [content]);

  return (
    <div style={{
      padding: '24px 48px', maxWidth: 800, margin: '0 auto', fontFamily: 'system-ui', fontSize: 14,
      color: 'var(--text-primary)', lineHeight: 1.7, overflow: 'auto', height: '100%',
    }} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

const JsonTreeView: React.FC<{ content: string }> = ({ content }) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  
  const parsed = useMemo(() => {
    try { return JSON.parse(content); } catch { return null; }
  }, [content]);

  const togglePath = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const renderValue = (value: unknown, path: string, depth: number): React.ReactNode => {
    if (value === null) return <span style={{ color: '#569cd6' }}>null</span>;
    if (typeof value === 'boolean') return <span style={{ color: '#569cd6' }}>{value.toString()}</span>;
    if (typeof value === 'number') return <span style={{ color: '#b5cea8' }}>{value}</span>;
    if (typeof value === 'string') return <span style={{ color: '#ce9178' }}>"{value}"</span>;
    
    if (Array.isArray(value)) {
      const isExpanded = expandedPaths.has(path);
      return (
        <span>
          <span onClick={() => togglePath(path)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {isExpanded ? '▼' : '▶'} [{value.length}]
          </span>
          {isExpanded && (
            <div style={{ paddingLeft: 16 }}>
              {value.map((item, i) => (
                <div key={i} style={{ lineHeight: '22px' }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{i}: </span>
                  {renderValue(item, `${path}[${i}]`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </span>
      );
    }

    if (typeof value === 'object') {
      const keys = Object.keys(value as Record<string, unknown>);
      const isExpanded = expandedPaths.has(path);
      return (
        <span>
          <span onClick={() => togglePath(path)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
            {isExpanded ? '▼' : '▶'} {'{'}
            {keys.length}
            {'}'}
          </span>
          {isExpanded && (
            <div style={{ paddingLeft: 16 }}>
              {keys.map((key) => (
                <div key={key} style={{ lineHeight: '22px' }}>
                  <span style={{ color: '#9cdcfe' }}>"{key}"</span>
                  <span style={{ color: 'var(--text-secondary)' }}>: </span>
                  {renderValue((value as Record<string, unknown>)[key], `${path}.${key}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </span>
      );
    }

    return <span>{String(value)}</span>;
  };

  if (!parsed) return <div style={{ padding: 16, color: '#f44747' }}>Invalid JSON</div>;

  return (
    <div style={{ padding: 12, fontFamily: 'monospace', fontSize: 12, overflow: 'auto', height: '100%' }}>
      {renderValue(parsed, 'root', 0)}
    </div>
  );
};

const HexEditor: React.FC<{ content: string; size: number }> = ({ content, size }) => {
  const [offset, setOffset] = useState(0);
  const bytesPerRow = 16;
  const visibleRows = 32;

  const bytes = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < content.length && i < 1024; i++) {
      arr.push(content.charCodeAt(i));
    }
    return arr;
  }, [content]);

  const rows = useMemo(() => {
    const result: Array<{ offset: number; hex: string[]; ascii: string }> = [];
    for (let i = offset; i < Math.min(bytes.length, offset + visibleRows * bytesPerRow); i += bytesPerRow) {
      const rowBytes = bytes.slice(i, i + bytesPerRow);
      result.push({
        offset: i,
        hex: rowBytes.map((b) => b.toString(16).padStart(2, '0')),
        ascii: rowBytes.map((b) => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.').join(''),
      });
    }
    return result;
  }, [bytes, offset]);

  return (
    <div style={{ fontFamily: 'monospace', fontSize: 12, padding: 8, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 8, color: 'var(--text-secondary)', fontSize: 10 }}>
        {size} bytes · Showing offset {offset.toString(16).toUpperCase()} - {Math.min(bytes.length, offset + visibleRows * bytesPerRow).toString(16).toUpperCase()}
      </div>
      {rows.map((row) => (
        <div key={row.offset} style={{ display: 'flex', gap: 16, lineHeight: '20px' }}>
          <span style={{ color: '#569cd6', width: 60 }}>{row.offset.toString(16).padStart(8, '0')}</span>
          <span style={{ color: 'var(--text-primary)', letterSpacing: 2, width: 380 }}>{row.hex.join(' ')}</span>
          <span style={{ color: '#4ec9b0' }}>{row.ascii}</span>
        </div>
      ))}
    </div>
  );
};

export const CustomEditor: React.FC<CustomEditorProps> = ({
  file,
  onClose,
  onOpenInTextEditor,
  zoom = 100,
  onZoomChange,
}) => {
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const handleZoomChange = onZoomChange || setCurrentZoom;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {file.type === 'image' && <ImagePreview file={file} zoom={currentZoom} onZoomChange={handleZoomChange} />}
      {file.type === 'markdown' && <MarkdownPreview content={file.content} />}
      {file.type === 'json' && <JsonTreeView content={file.content} />}
      {file.type === 'hex' && <HexEditor content={file.content} size={file.size} />}
      {file.type === 'svg' && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto' }}>
          <div dangerouslySetInnerHTML={{ __html: file.content }} style={{ transform: `scale(${currentZoom / 100})` }} />
        </div>
      )}
      {(file.type === 'audio' || file.type === 'video' || file.type === 'pdf') && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          Preview not available for {file.type} files
          <button onClick={onOpenInTextEditor} style={{
            marginLeft: 12, padding: '4px 12px', borderRadius: 3, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 12,
          }}>Open as Text</button>
        </div>
      )}
    </div>
  );
};
