import React from 'react';
import { useAppStore } from '../../store';

export const GitPanel: React.FC = () => {
  const { gitFiles, currentBranch, gitBranches } = useAppStore();

  const stagedFiles = gitFiles.filter((f) => f.staged);
  const unstagedFiles = gitFiles.filter((f) => !f.staged);

  return (
    <div className="git-panel">
      <div className="git-branch-info">
        <span className="git-branch-icon">⎇</span>
        <span className="git-branch-name">{currentBranch}</span>
        <select className="git-branch-select">
          {gitBranches.map((branch) => (
            <option key={branch.name} value={branch.name}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      <div className="git-section">
        <div className="git-section-header">
          <span>Staged Changes ({stagedFiles.length})</span>
        </div>
        {stagedFiles.map((file) => (
          <div key={file.path} className="git-file-item">
            <span className={`git-status-badge git-status-${file.status}`}>
              {file.status[0].toUpperCase()}
            </span>
            <span className="git-file-path">{file.path}</span>
          </div>
        ))}
      </div>

      <div className="git-section">
        <div className="git-section-header">
          <span>Changes ({unstagedFiles.length})</span>
        </div>
        {unstagedFiles.map((file) => (
          <div key={file.path} className="git-file-item">
            <span className={`git-status-badge git-status-${file.status}`}>
              {file.status[0].toUpperCase()}
            </span>
            <span className="git-file-path">{file.path}</span>
          </div>
        ))}
      </div>

      <div className="git-commit-area">
        <textarea className="git-commit-message" placeholder="Commit message..." />
        <button className="git-commit-button">Commit</button>
      </div>
    </div>
  );
};
