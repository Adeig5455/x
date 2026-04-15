import React from 'react';

export const Welcome: React.FC = () => {
  const handleOpenFolder = async () => {
    // TODO: Use IPC to open folder dialog
  };

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1 className="welcome-title">Cursor IDE</h1>
        <p className="welcome-subtitle">AI-powered code editor</p>

        <div className="welcome-actions">
          <button className="welcome-action-button" onClick={handleOpenFolder}>
            <span className="action-icon">📂</span>
            <span className="action-text">Open Folder</span>
          </button>
          <button className="welcome-action-button">
            <span className="action-icon">📄</span>
            <span className="action-text">New File</span>
          </button>
          <button className="welcome-action-button">
            <span className="action-icon">📋</span>
            <span className="action-text">Clone Repository</span>
          </button>
        </div>

        <div className="welcome-recent">
          <h3>Recent Projects</h3>
          <p className="welcome-empty">No recent projects</p>
        </div>

        <div className="welcome-shortcuts">
          <h3>Keyboard Shortcuts</h3>
          <div className="shortcut-grid">
            <div className="shortcut-item">
              <kbd>Ctrl+P</kbd> Quick Open File
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl+Shift+P</kbd> Command Palette
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl+K</kbd> AI Edit
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl+L</kbd> AI Chat
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl+`</kbd> Toggle Terminal
            </div>
            <div className="shortcut-item">
              <kbd>Ctrl+B</kbd> Toggle Sidebar
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
