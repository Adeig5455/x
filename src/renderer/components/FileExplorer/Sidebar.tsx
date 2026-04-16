import React from 'react';
import { useAppStore } from '../../store';
import { FileTree } from './FileTree';

export const Sidebar: React.FC = () => {
  const sidebarVisible = useAppStore((s) => s.ui.sidebarVisible);
  const sidebarWidth = useAppStore((s) => s.ui.sidebarWidth);
  const activePanel = useAppStore((s) => s.ui.activePanel);
  const fileTree = useAppStore((s) => s.fileSystem.fileTree);
  const expandedDirs = useAppStore((s) => s.fileSystem.expandedDirs);
  const selectedPath = useAppStore((s) => s.fileSystem.selectedPath);
  const toggleDirExpanded = useAppStore((s) => s.fileSystem.toggleDirExpanded);
  const setSelectedPath = useAppStore((s) => s.fileSystem.setSelectedPath);
  const openFile = useAppStore((s) => s.editor.openFile);

  if (!sidebarVisible) return null;

  const expandedDirsSet = new Set(expandedDirs);

  return (
    <div className="sidebar" style={{ width: sidebarWidth }}>
      <div className="sidebar-header">
        <span className="sidebar-title">{activePanel.toUpperCase()}</span>
      </div>
      <div className="sidebar-content">
        {activePanel === 'explorer' && (
          <FileTree
            fileTree={fileTree}
            expandedDirs={expandedDirsSet}
            selectedPath={selectedPath}
            onToggleDir={toggleDirExpanded}
            onSelectFile={setSelectedPath}
            onOpenFile={(path: string) => {
              const name = path.split('/').pop() || path;
              const ext = name.split('.').pop() || '';
              openFile(path, name, '', ext);
            }}
          />
        )}
      </div>
    </div>
  );
};
