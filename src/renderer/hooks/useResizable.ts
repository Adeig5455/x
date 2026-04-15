import { useState, useRef, useCallback, useEffect } from 'react';

interface UseResizableOptions {
  direction: 'horizontal' | 'vertical';
  initialSize: number;
  minSize: number;
  maxSize: number;
  onResize?: (size: number) => void;
}

export function useResizable({
  direction,
  initialSize,
  minSize,
  maxSize,
  onResize,
}: UseResizableOptions) {
  const [size, setSize] = useState(initialSize);
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef(0);
  const startSize = useRef(0);
  const resizerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startPos.current = direction === 'horizontal' ? e.clientX : e.clientY;
      startSize.current = size;
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    },
    [direction, size]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const currentPos = direction === 'horizontal' ? e.clientX : e.clientY;
      const delta = currentPos - startPos.current;
      const newSize = Math.max(minSize, Math.min(maxSize, startSize.current + delta));

      setSize(newSize);
      onResize?.(newSize);
    },
    [isResizing, direction, minSize, maxSize, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const resizerStyle: React.CSSProperties = {
    position: 'absolute',
    zIndex: 10,
    ...(direction === 'horizontal'
      ? {
          top: 0,
          right: -3,
          width: 6,
          height: '100%',
          cursor: 'col-resize',
        }
      : {
          left: 0,
          top: -3,
          width: '100%',
          height: 6,
          cursor: 'row-resize',
        }),
    ...(isResizing && {
      backgroundColor: 'var(--accent, #007acc)',
      opacity: 0.5,
    }),
  };

  return {
    size,
    setSize,
    isResizing,
    resizerRef,
    handleMouseDown,
    resizerStyle,
  };
}
