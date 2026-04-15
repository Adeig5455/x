import React, { useState, useCallback, useRef, useEffect } from 'react';

// ============================================================================
// Peek Definition - Inline definition viewer with navigation, multiple results
// ============================================================================

export interface PeekLocation {
  filePath: string;
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
  preview: string[];
  symbolName?: string;
}

interface PeekDefinitionProps {
  locations: PeekLocation[];
  activeIndex: number;
  title: string;
  onNavigate: (index: number) => void;
  onGoToDefinition: (location: PeekLocation) => void;
  onClose: () => void;
  position: { top: number; left: number };
}

export const PeekDefinition: React.FC<PeekDefinitionProps> = ({
  locations,
  activeIndex,
  title,
  onNavigate,
  onGoToDefinition,
  onClose,
  position,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const active = locations[activeIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown' && e.altKey) onNavigate(Math.min(activeIndex + 1, locations.length - 1));
      if (e.key === 'ArrowUp' && e.altKey) onNavigate(Math.max(activeIndex - 1, 0));
      if (e.key === 'Enter') onGoToDefinition(active);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate, onGoToDefinition, active, activeIndex, locations.length]);

  if (!active) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        width: 600,
        maxHeight: 350,
        background: 'var(--bg-secondary, #252526)',
        border: '2px solid var(--accent-color, #007acc)',
        borderRadius: 4,
        boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '4px 8px',
        background: 'var(--bg-tertiary, #2d2d30)',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>{title}</span>
        <div style={{ flex: 1 }} />
        {locations.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <button
              onClick={() => onNavigate(Math.max(0, activeIndex - 1))}
              disabled={activeIndex === 0}
              style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                cursor: activeIndex === 0 ? 'not-allowed' : 'pointer', fontSize: 12, padding: '0 4px',
                opacity: activeIndex === 0 ? 0.3 : 1,
              }}
            >
              ◀
            </button>
            <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {activeIndex + 1} of {locations.length}
            </span>
            <button
              onClick={() => onNavigate(Math.min(locations.length - 1, activeIndex + 1))}
              disabled={activeIndex === locations.length - 1}
              style={{
                background: 'none', border: 'none', color: 'var(--text-secondary)',
                cursor: activeIndex === locations.length - 1 ? 'not-allowed' : 'pointer', fontSize: 12, padding: '0 4px',
                opacity: activeIndex === locations.length - 1 ? 0.3 : 1,
              }}
            >
              ▶
            </button>
          </div>
        )}
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14 }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* File List (if multiple) */}
        {locations.length > 1 && (
          <div style={{
            width: 180,
            borderRight: '1px solid var(--border-color)',
            overflow: 'auto',
          }}>
            {locations.map((loc, i) => (
              <div
                key={i}
                onClick={() => onNavigate(i)}
                style={{
                  padding: '3px 8px',
                  cursor: 'pointer',
                  background: i === activeIndex ? 'var(--bg-active)' : 'transparent',
                  borderLeft: i === activeIndex ? '2px solid var(--accent-color)' : '2px solid transparent',
                  fontSize: 11,
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                <div style={{ fontFamily: 'monospace' }}>{loc.filePath.split('/').pop()}</div>
                <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>Line {loc.startLine}</div>
              </div>
            ))}
          </div>
        )}

        {/* Code Preview */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{
            padding: '4px 0',
            fontFamily: 'monospace',
            fontSize: 12,
            lineHeight: '20px',
          }}>
            {active.preview.map((line, i) => {
              const lineNum = active.startLine + i;
              const isHighlighted = lineNum >= active.startLine && lineNum <= active.endLine;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    background: isHighlighted ? 'rgba(55, 148, 255, 0.15)' : 'transparent',
                    borderLeft: isHighlighted ? '2px solid var(--accent-color)' : '2px solid transparent',
                  }}
                >
                  <span style={{
                    width: 40,
                    textAlign: 'right',
                    paddingRight: 8,
                    color: 'var(--text-secondary)',
                    fontSize: 11,
                    opacity: 0.5,
                    flexShrink: 0,
                    userSelect: 'none',
                  }}>
                    {lineNum}
                  </span>
                  <span style={{ whiteSpace: 'pre', color: 'var(--text-primary)' }}>{line}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '3px 8px',
        borderTop: '1px solid var(--border-color)',
        fontSize: 10,
        color: 'var(--text-secondary)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: 'monospace' }}>{active.filePath}</span>
        <span>Press Enter to go to definition, Escape to close</span>
      </div>
    </div>
  );
};
