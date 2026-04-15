import React, { useRef, useEffect, useState, useCallback } from 'react';

// ============================================================================
// Enhanced Minimap - canvas renderer, hover preview, drag scroll, syntax colors
// ============================================================================

interface MinimapProps {
  content: string;
  visibleRange: { startLine: number; endLine: number };
  totalLines: number;
  visible: boolean;
  onScrollTo: (line: number) => void;
  width?: number;
  scale?: number;
}

// Simple keyword detection for syntax-aware coloring
const KEYWORDS = new Set([
  'import', 'export', 'from', 'const', 'let', 'var', 'function', 'class',
  'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'break',
  'interface', 'type', 'enum', 'extends', 'implements', 'async', 'await',
  'try', 'catch', 'throw', 'new', 'this', 'super', 'default', 'void',
]);

const getLineColor = (line: string): string => {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
    return '#608b4e'; // comment green
  }
  if (trimmed.startsWith('import ') || trimmed.startsWith('export ')) {
    return '#c586c0'; // keyword purple
  }
  if (/^\s*(const|let|var|function|class|interface|type|enum)\s/.test(line)) {
    return '#569cd6'; // declaration blue
  }
  if (/^\s*(return|if|else|for|while|switch|try|catch|throw)\s/.test(line)) {
    return '#c586c0'; // control flow purple
  }
  if (/['"`]/.test(trimmed)) {
    return '#ce9178'; // string orange
  }
  return '#d4d4d4'; // default
};

export const Minimap: React.FC<MinimapProps> = ({
  content,
  visibleRange,
  totalLines,
  visible,
  onScrollTo,
  width = 80,
  scale = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverLine, setHoverLine] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const lineHeight = 2 * scale;
  const charWidth = 0.5 * scale;

  if (!visible) return null;

  // Render minimap canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = content.split('\n');
    const dpr = window.devicePixelRatio || 1;
    const canvasWidth = width;
    const canvasHeight = Math.max(lines.length * lineHeight, 100);

    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = 'var(--minimap-background, #1e1e1e)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Render each line
    lines.forEach((line, index) => {
      if (!line.trim()) return;

      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;
      const color = getLineColor(line);
      const alpha = 0.7;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;

      // Render characters as small rectangles
      const xStart = indent * charWidth;
      const lineWidth = Math.min(trimmed.length * charWidth, canvasWidth - xStart - 4);
      const y = index * lineHeight;

      if (lineWidth > 0) {
        ctx.fillRect(xStart + 2, y, lineWidth, Math.max(lineHeight - 0.5, 1));
      }
    });

    ctx.globalAlpha = 1;

    // Visible range slider
    const sliderY = visibleRange.startLine * lineHeight;
    const sliderHeight = (visibleRange.endLine - visibleRange.startLine) * lineHeight;

    ctx.fillStyle = isHovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, sliderY, canvasWidth, sliderHeight);

    // Slider border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 0.5;
    ctx.strokeRect(0.5, sliderY + 0.5, canvasWidth - 1, sliderHeight - 1);

    // Hover line indicator
    if (hoverLine !== null) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      const hoverY = hoverLine * lineHeight;
      const viewportHeight = (visibleRange.endLine - visibleRange.startLine) * lineHeight;
      ctx.fillRect(0, hoverY - viewportHeight / 2, canvasWidth, viewportHeight);
    }
  }, [content, visibleRange, lineHeight, charWidth, width, isHovered, hoverLine, scale]);

  const getLineFromY = useCallback((clientY: number): number => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const y = clientY - rect.top;
    return Math.max(0, Math.min(Math.floor(y / lineHeight), totalLines));
  }, [lineHeight, totalLines]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const line = getLineFromY(e.clientY);
    onScrollTo(line);
  }, [getLineFromY, onScrollTo]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    const line = getLineFromY(e.clientY);
    onScrollTo(line);

    const handleMouseMove = (ev: MouseEvent) => {
      const moveLine = getLineFromY(ev.clientY);
      onScrollTo(moveLine);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [getLineFromY, onScrollTo]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) {
      setHoverLine(getLineFromY(e.clientY));
    }
  }, [isDragging, getLineFromY]);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setHoverLine(null); }}
      onMouseMove={handleMouseMove}
      style={{
        width,
        height: '100%',
        overflow: 'hidden',
        cursor: isDragging ? 'grabbing' : 'pointer',
        flexShrink: 0,
        position: 'relative',
        background: 'var(--minimap-background, transparent)',
        opacity: isHovered ? 1 : 0.8,
        transition: 'opacity 0.15s',
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{
          display: 'block',
          imageRendering: 'pixelated',
        }}
      />
    </div>
  );
};
