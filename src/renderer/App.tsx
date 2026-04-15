import React from 'react';
import { ActivityBar } from './components/ActivityBar/ActivityBar';
import { Sidebar } from './components/FileExplorer/Sidebar';
import { EditorArea } from './components/Editor/EditorArea';
import { StatusBar } from './components/StatusBar/StatusBar';
import { BottomPanel } from './components/Terminal/BottomPanel';
import { AIChatPanel } from './components/AIChat/AIChatPanel';
import { CommandPaletteOverlay } from './components/CommandPalette/CommandPaletteOverlay';
import { Welcome } from './components/Welcome/Welcome';
import { useAppStore } from './store';
import type { SidebarPanel } from '../shared/types';

export const App: React.FC = () => {
  const hasOpenProject = useAppStore((s) => s.fileSystem.projectPath !== null);
  const activePanel = useAppStore((s) => s.ui.activePanel);
  const sidebarVisible = useAppStore((s) => s.ui.sidebarVisible);
  const setActivePanel = useAppStore((s) => s.ui.setActivePanel);
  const toggleSidebar = useAppStore((s) => s.ui.toggleSidebar);
  const terminalVisible = useAppStore((s) => s.ui.terminalVisible);
  const terminalHeight = useAppStore((s) => s.ui.terminalHeight);
  const setTerminalHeight = useAppStore((s) => s.ui.setTerminalHeight);
  const toggleTerminal = useAppStore((s) => s.ui.toggleTerminal);
  const currentBranch = useAppStore((s) => s.git.currentBranch);

  return (
    <div className="app-container">
      <div className="app-main">
        <ActivityBar
          activePanel={activePanel as SidebarPanel}
          sidebarVisible={sidebarVisible}
          onPanelClick={(id: SidebarPanel) => setActivePanel(id)}
          onToggleSidebar={toggleSidebar}
        />
        <Sidebar />
        <div className="editor-area-wrapper">
          {hasOpenProject ? <EditorArea /> : <Welcome />}
          <BottomPanel
            visible={terminalVisible}
            height={terminalHeight}
            onResize={setTerminalHeight}
            onClose={toggleTerminal}
          />
        </div>
        {activePanel === 'ai-chat' && <AIChatPanel />}
      </div>
      <StatusBar currentBranch={currentBranch} />
      <CommandPaletteOverlay />
    </div>
  );
};
