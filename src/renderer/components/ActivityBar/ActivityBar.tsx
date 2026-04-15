import React from 'react';
import { useAppStore } from '../../store';
import type { SidebarPanel } from '../../../shared/types';

interface ActivityBarItem {
  id: SidebarPanel;
  icon: string;
  title: string;
}

const items: ActivityBarItem[] = [
  { id: 'explorer', icon: '📁', title: 'Explorer' },
  { id: 'search', icon: '🔍', title: 'Search' },
  { id: 'git', icon: '⎇', title: 'Source Control' },
  { id: 'extensions', icon: '🧩', title: 'Extensions' },
  { id: 'ai-chat', icon: '🤖', title: 'AI Chat' },
];

export const ActivityBar: React.FC = () => {
  const { activePanel, setActivePanel, toggleSidebar } = useAppStore();

  const handleClick = (id: SidebarPanel) => {
    if (activePanel === id) {
      toggleSidebar();
    } else {
      setActivePanel(id);
    }
  };

  return (
    <div className="activity-bar">
      {items.map((item) => (
        <button
          key={item.id}
          className={`activity-bar-item ${activePanel === item.id ? 'active' : ''}`}
          onClick={() => handleClick(item.id)}
          title={item.title}
        >
          <span className="activity-bar-icon">{item.icon}</span>
        </button>
      ))}
    </div>
  );
};
