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

export const App: React.FC = () => {
  const { hasOpenProject, activePanel } = useAppStore();

  return (
    <div className="app-container">
      <div className="app-main">
        <ActivityBar />
        <Sidebar />
        <div className="editor-area-wrapper">
          {hasOpenProject ? <EditorArea /> : <Welcome />}
          <BottomPanel />
        </div>
        {activePanel === 'ai-chat' && <AIChatPanel />}
      </div>
      <StatusBar />
      <CommandPaletteOverlay />
    </div>
  );
};
