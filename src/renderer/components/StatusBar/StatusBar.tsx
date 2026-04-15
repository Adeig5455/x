import React from 'react';
import { useAppStore } from '../../store';

export const StatusBar: React.FC = () => {
  const { currentBranch, tabs, activeTabId, settings, notifications } = useAppStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="status-bar">
      <div className="status-bar-left">
        <span className="status-bar-item status-bar-branch">
          <span className="branch-icon">⎇</span> {currentBranch}
        </span>
        {notifications.length > 0 && (
          <span className="status-bar-item status-bar-errors">
            {notifications.filter((n) => n.type === 'error').length} errors
          </span>
        )}
      </div>
      <div className="status-bar-right">
        {activeTab && (
          <>
            <span className="status-bar-item">{activeTab.language}</span>
            <span className="status-bar-item">Spaces: {settings.tabSize}</span>
            <span className="status-bar-item">UTF-8</span>
          </>
        )}
        <span className="status-bar-item">{settings.theme === 'dark' ? '🌙' : '☀️'}</span>
      </div>
    </div>
  );
};
