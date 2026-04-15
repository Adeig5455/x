import React from 'react';
import { useAppStore } from '../../store';

export const Breadcrumbs: React.FC = () => {
  const { breadcrumbs, settings } = useAppStore();

  if (!settings.breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <div className="breadcrumbs">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.path}>
          {index > 0 && <span className="breadcrumb-separator">{'>'}</span>}
          <button className="breadcrumb-item" title={item.path}>
            <span className="breadcrumb-icon">
              {item.type === 'folder' ? '📁' : item.type === 'symbol' ? '#' : '📄'}
            </span>
            <span className="breadcrumb-label">{item.label}</span>
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
