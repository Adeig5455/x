import React from 'react';
import { useAppStore } from '../../store';
import { TabBar } from '../Tabs/TabBar';

export const EditorArea: React.FC = () => {
  const { tabs, activeTabId } = useAppStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="editor-area">
      <TabBar />
      <div className="editor-content">
        {activeTab ? (
          <div id="monaco-editor-container" style={{ width: '100%', height: '100%' }} />
        ) : (
          <div className="editor-empty">
            <p>Open a file to start editing</p>
          </div>
        )}
      </div>
    </div>
  );
};
