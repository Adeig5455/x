import React from 'react';
import { useAppStore } from '../../store';

export const BottomPanel: React.FC = () => {
  const { terminalVisible, terminalHeight } = useAppStore();

  if (!terminalVisible) return null;

  return (
    <div className="bottom-panel" style={{ height: terminalHeight }}>
      <div className="bottom-panel-header">
        <span className="bottom-panel-tab active">Terminal</span>
        <span className="bottom-panel-tab">Output</span>
        <span className="bottom-panel-tab">Problems</span>
      </div>
      <div className="bottom-panel-content">
        <div id="terminal-container" style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};
