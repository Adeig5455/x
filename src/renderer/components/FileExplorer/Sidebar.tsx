import React from 'react';
import { useAppStore } from '../../store';
import { FileTree } from './FileTree';

export const Sidebar: React.FC = () => {
  const { sidebarVisible, sidebarWidth, activePanel } = useAppStore();

  if (!sidebarVisible) return null;

  return (
    <div className="sidebar" style={{ width: sidebarWidth }}>
      <div className="sidebar-header">
        <span className="sidebar-title">{activePanel.toUpperCase()}</span>
      </div>
      <div className="sidebar-content">
        {activePanel === 'explorer' && <FileTree />}
      </div>
    </div>
  );
};
