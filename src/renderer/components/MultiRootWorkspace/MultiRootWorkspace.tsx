import React, { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Multi-root Workspace - Manage multiple project folders in single window
// ============================================================================

export interface WorkspaceFolder {
  id: string;
  name: string;
  path: string;
  color?: string;
  isCollapsed: boolean;
  fileCount: number;
  gitBranch?: string;
  gitStatus?: 'clean' | 'modified' | 'untracked' | 'conflict';
  isReadOnly?: boolean;
  excludePatterns?: string[];
}

export interface WorkspaceConfig {
  name: string;
  folders: WorkspaceFolder[];
  settings: Record<string, unknown>;
  extensions: string[];
  tasks: Array<{ label: string; command: string; folder?: string }>;
}

interface MultiRootWorkspaceProps {
  config: WorkspaceConfig;
  onAddFolder: () => void;
  onRemoveFolder: (id: string) => void;
  onReorderFolder: (fromIdx: number, toIdx: number) => void;
  onToggleCollapse: (id: string) => void;
  onRenameFolder: (id: string, name: string) => void;
  onSetFolderColor: (id: string, color: string) => void;
  onOpenFolder: (id: string) => void;
  onSaveWorkspace: () => void;
  onOpenWorkspaceFile: () => void;
}

const FOLDER_COLORS = [
  '#4ec9b0', '#3794ff', '#c586c0', '#dcdcaa', '#ce9178',
  '#f44747', '#cca700', '#569cd6', '#d16969', '#b5cea8',
];

const GIT_STATUS_STYLES: Record<string, { color: string; label: string }> = {
  clean: { color: '#4ec9b0', label: 'Clean' },
  modified: { color: '#cca700', label: 'Modified' },
  untracked: { color: '#3794ff', label: 'Untracked' },
  conflict: { color: '#f44747', label: 'Conflict' },
};

export const MultiRootWorkspace: React.FC<MultiRootWorkspaceProps> = ({
  config,
  onAddFolder,
  onRemoveFolder,
  onToggleCollapse,
  onRenameFolder,
  onSetFolderColor,
  onOpenFolder,
  onSaveWorkspace,
  onOpenWorkspaceFile,
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const startRename = useCallback((folder: WorkspaceFolder) => {
    setEditingId(folder.id);
    setEditName(folder.name);
  }, []);

  const finishRename = useCallback((id: string) => {
    if (editName.trim()) onRenameFolder(id, editName.trim());
    setEditingId(null);
  }, [editName, onRenameFolder]);

  const totalFiles = useMemo(() =>
    config.folders.reduce((sum, f) => sum + f.fileCount, 0),
  [config.folders]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          Workspace
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {config.name}
        </span>
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
          {config.folders.length} folders · {totalFiles} files
        </span>
        <button onClick={onAddFolder} style={{
          background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: 14,
        }} title="Add Folder to Workspace">+</button>
        <button onClick={onSaveWorkspace} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11,
        }} title="Save Workspace">💾</button>
      </div>

      {/* Folder List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {config.folders.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', padding: 32,
          }}>
            <span style={{ fontSize: 36, marginBottom: 12 }}>📁</span>
            <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500, marginBottom: 4 }}>
              No folders in workspace
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 12 }}>
              Add folders to create a multi-root workspace
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onAddFolder} style={{
                padding: '6px 16px', borderRadius: 4, border: 'none',
                background: 'var(--accent-color)', color: '#fff', fontSize: 11, cursor: 'pointer',
              }}>Add Folder</button>
              <button onClick={onOpenWorkspaceFile} style={{
                padding: '6px 16px', borderRadius: 4, border: '1px solid var(--border-color)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
              }}>Open .code-workspace</button>
            </div>
          </div>
        ) : (
          config.folders.map((folder, idx) => {
            const folderColor = folder.color || FOLDER_COLORS[idx % FOLDER_COLORS.length];
            const gitStatus = folder.gitStatus ? GIT_STATUS_STYLES[folder.gitStatus] : null;
            const isDragOver = dragOverId === folder.id;

            return (
              <div
                key={folder.id}
                draggable
                onDragOver={(e) => { e.preventDefault(); setDragOverId(folder.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={() => setDragOverId(null)}
                style={{
                  borderBottom: '1px solid var(--border-color)',
                  borderLeft: `3px solid ${folderColor}`,
                  background: isDragOver ? 'rgba(55,148,255,0.1)' : 'transparent',
                  transition: 'background 0.15s',
                }}
              >
                {/* Folder header */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => { if (!isDragOver) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseOut={(e) => { if (!isDragOver) e.currentTarget.style.background = 'transparent'; }}
                >
                  {/* Collapse toggle */}
                  <span
                    onClick={() => onToggleCollapse(folder.id)}
                    style={{ fontSize: 8, color: 'var(--text-secondary)', cursor: 'pointer', width: 10 }}
                  >
                    {folder.isCollapsed ? '▶' : '▼'}
                  </span>

                  {/* Color dot */}
                  <span
                    onClick={() => setShowColorPicker(showColorPicker === folder.id ? null : folder.id)}
                    style={{
                      width: 10, height: 10, borderRadius: 5, background: folderColor,
                      cursor: 'pointer', flexShrink: 0,
                    }}
                    title="Change color"
                  />

                  {/* Folder name */}
                  {editingId === folder.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={() => finishRename(folder.id)}
                      onKeyDown={(e) => { if (e.key === 'Enter') finishRename(folder.id); }}
                      autoFocus
                      style={{
                        flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--accent-color)',
                        borderRadius: 2, color: 'var(--text-primary)', fontSize: 12, padding: '0 4px', outline: 'none',
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => onOpenFolder(folder.id)}
                      onDoubleClick={() => startRename(folder)}
                      style={{ flex: 1, fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}
                    >
                      {folder.name}
                      {folder.isReadOnly && (
                        <span style={{ fontSize: 9, color: '#cca700', marginLeft: 4 }}>READ-ONLY</span>
                      )}
                    </span>
                  )}

                  {/* Git info */}
                  {folder.gitBranch && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, flexShrink: 0 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>⎇</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{folder.gitBranch}</span>
                      {gitStatus && (
                        <span style={{
                          width: 6, height: 6, borderRadius: 3, background: gitStatus.color,
                        }} title={gitStatus.label} />
                      )}
                    </span>
                  )}

                  {/* File count */}
                  <span style={{ fontSize: 10, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {folder.fileCount}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <button onClick={(e) => { e.stopPropagation(); startRename(folder); }} style={{
                      background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 10, padding: 1,
                    }} title="Rename">✎</button>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveFolder(folder.id); }} style={{
                      background: 'none', border: 'none', color: '#f44747', cursor: 'pointer', fontSize: 11, padding: 1,
                    }} title="Remove from Workspace">×</button>
                  </div>
                </div>

                {/* Color picker */}
                {showColorPicker === folder.id && (
                  <div style={{
                    display: 'flex', gap: 4, padding: '4px 8px 8px 28px', flexWrap: 'wrap',
                  }}>
                    {FOLDER_COLORS.map((color) => (
                      <div
                        key={color}
                        onClick={() => { onSetFolderColor(folder.id, color); setShowColorPicker(null); }}
                        style={{
                          width: 16, height: 16, borderRadius: 3, background: color, cursor: 'pointer',
                          border: color === folderColor ? '2px solid #fff' : '1px solid var(--border-color)',
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Path info */}
                {!folder.isCollapsed && (
                  <div style={{
                    padding: '2px 8px 6px 28px', fontSize: 10, fontFamily: 'monospace',
                    color: 'var(--text-secondary)',
                  }}>
                    {folder.path}
                    {folder.excludePatterns && folder.excludePatterns.length > 0 && (
                      <div style={{ marginTop: 2 }}>
                        Excluded: {folder.excludePatterns.join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '4px 8px', borderTop: '1px solid var(--border-color)',
        fontSize: 10, color: 'var(--text-secondary)', display: 'flex', gap: 8,
      }}>
        <span>{config.folders.length} folders</span>
        <span>{config.extensions.length} extensions</span>
        <span>{config.tasks.length} tasks</span>
        <div style={{ flex: 1 }} />
        <button onClick={onOpenWorkspaceFile} style={{
          background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: 10,
        }}>Edit workspace file</button>
      </div>
    </div>
  );
};
