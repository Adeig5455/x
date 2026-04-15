import React from 'react';
import { useAppStore } from '../../store';

export const TabBar: React.FC = () => {
  const { tabs, setActiveTab, closeTab } = useAppStore();

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`tab ${tab.isActive ? 'tab-active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-name">{tab.fileName}</span>
          {tab.isDirty && <span className="tab-dirty">●</span>}
          <button
            className="tab-close"
            onClick={(e) => {
              e.stopPropagation();
              closeTab(tab.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
