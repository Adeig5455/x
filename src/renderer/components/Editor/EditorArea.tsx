import React from 'react';
import { useAppStore } from '../../store';
import { TabBar } from '../Tabs/TabBar';

export const EditorArea: React.FC = () => {
  const groups = useAppStore((s) => s.editor.groups);
  const activeGroupId = useAppStore((s) => s.editor.activeGroupId);
  const setActiveTab = useAppStore((s) => s.editor.setActiveTab);
  const closeTab = useAppStore((s) => s.editor.closeTab);
  const closeOtherTabs = useAppStore((s) => s.editor.closeOtherTabs);
  const closeTabsToRight = useAppStore((s) => s.editor.closeTabsToRight);
  const closeAllTabs = useAppStore((s) => s.editor.closeAllTabs);
  const reorderTab = useAppStore((s) => s.editor.reorderTab);

  const activeGroup = groups.find((g) => g.id === activeGroupId);
  const activeTab = activeGroup?.tabs.find((t) => t.id === activeGroup.activeTabId) ?? null;
  const tabs = activeGroup?.tabs ?? [];

  return (
    <div className="editor-area">
      <TabBar
        tabs={tabs}
        activeTabId={activeGroup?.activeTabId ?? null}
        onSelectTab={setActiveTab}
        onCloseTab={closeTab}
        onCloseOtherTabs={closeOtherTabs}
        onCloseTabsToRight={closeTabsToRight}
        onCloseAllTabs={closeAllTabs}
        onReorderTab={(from: number, to: number) => reorderTab(activeGroupId, from, to)}
      />
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
