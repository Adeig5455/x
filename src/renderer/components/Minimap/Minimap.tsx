import React, { useRef, useEffect } from 'react';
import { useAppStore } from '../../store';

interface MinimapProps {
  content: string;
  visibleRange: { startLine: number; endLine: number };
  totalLines: number;
  onScrollTo: (line: number) => void;
}

export const Minimap: React.FC<MinimapProps> = ({
  content,
  visibleRange,
  totalLines,
  onScrollTo,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { settings } = useAppStore();

  if (!settings.minimap) return null;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lines = content.split('\n');
    const lineHeight = 2;
    canvas.height = lines.length * lineHeight;
    canvas.width = 80;

    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    lines.forEach((line, index) => {
      const trimmed = line.trimStart();
      const indent = line.length - trimmed.length;
      ctx.fillStyle = '#666666';
      ctx.fillRect(indent * 0.5, index * lineHeight, Math.min(trimmed.length * 0.5, 60), 1);
    });

    // Draw visible range indicator
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(0, visibleRange.startLine * lineHeight, canvas.width,
      (visibleRange.endLine - visibleRange.startLine) * lineHeight);
  }, [content, visibleRange]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const lineHeight = 2;
    const line = Math.floor(y / lineHeight);
    onScrollTo(Math.min(line, totalLines));
  };

  return (
    <div className="minimap">
      <canvas ref={canvasRef} onClick={handleClick} className="minimap-canvas" />
    </div>
  );
};
