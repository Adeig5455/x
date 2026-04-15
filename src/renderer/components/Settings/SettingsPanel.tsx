import React from 'react';
import { useAppStore } from '../../store';
import type { AppSettings } from '../../../shared/types';

interface SettingItemProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({ label, description, children }) => (
  <div className="setting-item">
    <div className="setting-info">
      <span className="setting-label">{label}</span>
      <span className="setting-description">{description}</span>
    </div>
    <div className="setting-control">{children}</div>
  </div>
);

export const SettingsPanel: React.FC = () => {
  const settings = useAppStore((s) => s.settings.settings);
  const setSetting = useAppStore((s) => s.settings.setSetting);

  const handleChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSetting(key, value);
  };

  return (
    <div className="settings-panel">
      <div className="settings-header">
        <h2>Settings</h2>
      </div>
      <div className="settings-content">
        <div className="settings-section">
          <h3>Editor</h3>
          <SettingItem label="Font Size" description="Controls the font size in pixels">
            <input
              type="number"
              value={settings.fontSize}
              onChange={(e) => handleChange('fontSize', Number(e.target.value))}
              min={8}
              max={32}
            />
          </SettingItem>
          <SettingItem label="Tab Size" description="Number of spaces per tab">
            <select
              value={settings.tabSize}
              onChange={(e) => handleChange('tabSize', Number(e.target.value))}
            >
              <option value={2}>2</option>
              <option value={4}>4</option>
              <option value={8}>8</option>
            </select>
          </SettingItem>
          <SettingItem label="Word Wrap" description="Controls how lines should wrap">
            <input
              type="checkbox"
              checked={settings.wordWrap}
              onChange={(e) => handleChange('wordWrap', e.target.checked)}
            />
          </SettingItem>
          <SettingItem label="Minimap" description="Show minimap in editor">
            <input
              type="checkbox"
              checked={settings.minimap}
              onChange={(e) => handleChange('minimap', e.target.checked)}
            />
          </SettingItem>
        </div>

        <div className="settings-section">
          <h3>Appearance</h3>
          <SettingItem label="Theme" description="Select color theme">
            <select
              value={settings.theme}
              onChange={(e) => handleChange('theme', e.target.value as 'dark' | 'light')}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </SettingItem>
        </div>

        <div className="settings-section">
          <h3>AI</h3>
          <SettingItem label="AI Model" description="Model to use for AI features">
            <select
              value={settings.aiModel}
              onChange={(e) => handleChange('aiModel', e.target.value)}
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3">Claude 3</option>
            </select>
          </SettingItem>
          <SettingItem label="Auto Complete" description="Enable AI-powered autocomplete">
            <input
              type="checkbox"
              checked={settings.autoComplete}
              onChange={(e) => handleChange('autoComplete', e.target.checked)}
            />
          </SettingItem>
        </div>
      </div>
    </div>
  );
};
