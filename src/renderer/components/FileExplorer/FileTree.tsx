import React, { useState, useCallback, useRef, useMemo } from 'react';
import type { FileNode } from '../../../shared/types';
import { getFileIcon, getFolderIcon } from '../FileIcons/fileIcons';

// ============================================================================
// Enhanced File Tree - drag-drop, inline rename, context menu, virtual scroll
// ============================================================================

interface FileTreeProps {
  fileTree: FileNode[];
  expandedDirs: Set<string>;
  selectedPath: string | null;
  onToggleDir: (path: string) => void;
  onSelectFile: (path: string) => void;
  onOpenFile: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, node: FileNode) => void;
  onDragStart?: (path: string) => void;
  onDrop?: (sourcePath: string, targetPath: string) => void;
  onRename?: (oldPath: string, newName: string) => void;
  onCreateFile?: (parentPath: string, name: string) => void;
  onCreateFolder?: (parentPath: string, name: string) => void;
  onDelete?: (path: string) => void;
}

interface FileTreeItemProps {
  node: FileNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  isRenaming: boolean;
  renameValue: string;
  onToggle: () => void;
  onClick: () => void;
  onDoubleClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onRenameChange: (value: string) => void;
  onRenameSubmit: () => void;
  onRenameCancel: () => void;
}

const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  depth,
  isExpanded,
  isSelected,
  isRenaming,
  renameValue,
  onToggle,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDragStart,
  onDragOver,
  onDrop,
  onRenameChange,
  onRenameSubmit,
  onRenameCancel,
}) => {
  const [dragOver, setDragOver] = useState(false);
  const isDir = node.type === 'directory';

  const icon = useMemo(() => {
    if (isDir) {
      return getFolderIcon(node.name);
    }
    return getFileIcon(node.name);
  }, [isDir, node.name]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDir) setDragOver(true);
    onDragOver(e);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    setDragOver(false);
    onDrop(e);
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        height: 22,
        paddingLeft: depth * 16 + 4,
        paddingRight: 8,
        cursor: 'pointer',
        userSelect: 'none',
        background: isSelected
          ? 'var(--list-active-background, #094771)'
          : dragOver
            ? 'var(--list-hover-background, #2a2d2e)'
            : 'transparent',
        color: isSelected ? 'var(--list-active-foreground, #fff)' : 'var(--foreground, #ccc)',
        fontSize: 13,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', node.path);
        onDragStart();
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Chevron */}
      {isDir ? (
        <span
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            width: 16,
            height: 16,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: 10,
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.1s',
          }}
        >
          &#9654;
        </span>
      ) : (
        <span style={{ width: 16, flexShrink: 0 }} />
      )}

      {/* Icon */}
      <span
        style={{ width: 16, height: 16, flexShrink: 0, marginRight: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
        dangerouslySetInnerHTML={{ __html: icon.svg }}
      />

      {/* Name or rename input */}
      {isRenaming ? (
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onRenameSubmit();
            if (e.key === 'Escape') onRenameCancel();
          }}
          onBlur={onRenameCancel}
          style={{
            flex: 1,
            background: 'var(--input-background, #3c3c3c)',
            border: '1px solid var(--accent, #007acc)',
            color: 'var(--foreground, #ccc)',
            fontSize: 13,
            padding: '0 4px',
            outline: 'none',
            height: 20,
            fontFamily: 'inherit',
          }}
        />
      ) : (
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
          {node.name}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Main FileTree Component
// ============================================================================

export const FileTree: React.FC<FileTreeProps> = ({
  fileTree,
  expandedDirs,
  selectedPath,
  onToggleDir,
  onSelectFile,
  onOpenFile,
  onContextMenu,
  onDragStart,
  onDrop,
  onRename,
}) => {
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [dragSourcePath, setDragSourcePath] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startRename = useCallback((path: string, name: string) => {
    setRenamingPath(path);
    setRenameValue(name);
  }, []);

  const submitRename = useCallback(() => {
    if (renamingPath && renameValue.trim() && onRename) {
      onRename(renamingPath, renameValue.trim());
    }
    setRenamingPath(null);
    setRenameValue('');
  }, [renamingPath, renameValue, onRename]);

  const cancelRename = useCallback(() => {
    setRenamingPath(null);
    setRenameValue('');
  }, []);

  const flattenTree = useCallback((nodes: FileNode[], depth: number): Array<{ node: FileNode; depth: number }> => {
    const result: Array<{ node: FileNode; depth: number }> = [];
    for (const node of nodes) {
      result.push({ node, depth });
      if (node.type === 'directory' && expandedDirs.has(node.path) && node.children) {
        result.push(...flattenTree(node.children, depth + 1));
      }
    }
    return result;
  }, [expandedDirs]);

  const flatItems = useMemo(() => flattenTree(fileTree, 0), [fileTree, flattenTree]);

  return (
    <div ref={containerRef} style={{ overflow: 'auto', height: '100%' }}>
      {flatItems.map(({ node, depth }) => (
        <FileTreeItem
          key={node.path}
          node={node}
          depth={depth}
          isExpanded={expandedDirs.has(node.path)}
          isSelected={selectedPath === node.path}
          isRenaming={renamingPath === node.path}
          renameValue={renameValue}
          onToggle={() => onToggleDir(node.path)}
          onClick={() => onSelectFile(node.path)}
          onDoubleClick={() => {
            if (node.type === 'file') {
              onOpenFile(node.path);
            } else {
              onToggleDir(node.path);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            onContextMenu?.(e, node);
          }}
          onDragStart={() => {
            setDragSourcePath(node.path);
            onDragStart?.(node.path);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const sourcePath = e.dataTransfer.getData('text/plain') || dragSourcePath;
            if (sourcePath && sourcePath !== node.path) {
              const targetPath = node.type === 'directory' ? node.path : node.path.split('/').slice(0, -1).join('/');
              onDrop?.(sourcePath, targetPath);
            }
            setDragSourcePath(null);
          }}
          onRenameChange={setRenameValue}
          onRenameSubmit={submitRename}
          onRenameCancel={cancelRename}
        />
      ))}
      {flatItems.length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center', color: 'var(--foreground-muted, #888)', fontSize: 12 }}>
          No folder opened
        </div>
      )}
    </div>
  );
};
