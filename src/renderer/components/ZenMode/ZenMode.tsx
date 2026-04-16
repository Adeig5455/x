import React, { useState, useCallback, useEffect } from 'react';

// ============================================================================
// Zen Mode / Focus Mode - Distraction-free editing with smooth transitions
// ============================================================================

export interface ZenModeConfig {
  hideActivityBar: boolean;
  hideSidebar: boolean;
  hideStatusBar: boolean;
  hideTabs: boolean;
  hideLineNumbers: boolean;
  hideMinimap: boolean;
  fullScreen: boolean;
  centerLayout: boolean;
  centerWidth: number; // percentage 40-100
  fontSize: number;
  lineHeight: number;
  padding: number;
  dimUnfocused: boolean;
  showBreadcrumbs: boolean;
  typewriterMode: boolean; // Keep cursor vertically centered
  ambientSound?: 'none' | 'rain' | 'coffee' | 'forest' | 'ocean';
}

interface ZenModeProps {
  isActive: boolean;
  config: ZenModeConfig;
  onToggle: () => void;
  onConfigChange: (config: Partial<ZenModeConfig>) => void;
  children: React.ReactNode;
}

const DEFAULT_CONFIG: ZenModeConfig = {
  hideActivityBar: true,
  hideSidebar: true,
  hideStatusBar: true,
  hideTabs: true,
  hideLineNumbers: false,
  hideMinimap: true,
  fullScreen: true,
  centerLayout: true,
  centerWidth: 70,
  fontSize: 16,
  lineHeight: 1.8,
  padding: 48,
  dimUnfocused: true,
  showBreadcrumbs: false,
  typewriterMode: false,
  ambientSound: 'none',
};

const ZenModeSettings: React.FC<{
  config: ZenModeConfig;
  onChange: (config: Partial<ZenModeConfig>) => void;
  onClose: () => void;
}> = ({ config, onChange, onClose }) => {
  const toggles: Array<{ key: keyof ZenModeConfig; label: string }> = [
    { key: 'hideActivityBar', label: 'Hide Activity Bar' },
    { key: 'hideSidebar', label: 'Hide Sidebar' },
    { key: 'hideStatusBar', label: 'Hide Status Bar' },
    { key: 'hideTabs', label: 'Hide Tabs' },
    { key: 'hideLineNumbers', label: 'Hide Line Numbers' },
    { key: 'hideMinimap', label: 'Hide Minimap' },
    { key: 'fullScreen', label: 'Full Screen' },
    { key: 'centerLayout', label: 'Center Layout' },
    { key: 'dimUnfocused', label: 'Dim Unfocused' },
    { key: 'showBreadcrumbs', label: 'Show Breadcrumbs' },
    { key: 'typewriterMode', label: 'Typewriter Mode' },
  ];

  return (
    <div style={{
      position: 'absolute', top: 16, right: 16, width: 280,
      background: 'rgba(30,30,30,0.95)', border: '1px solid rgba(80,80,80,0.5)',
      borderRadius: 8, padding: 16, zIndex: 10001,
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#e0e0e0', flex: 1 }}>Zen Mode Settings</span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14,
        }}>×</button>
      </div>

      {toggles.map(({ key, label }) => (
        <div key={key} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '4px 0',
        }}>
          <span style={{ fontSize: 11, color: '#ccc' }}>{label}</span>
          <button
            onClick={() => onChange({ [key]: !config[key] })}
            style={{
              width: 32, height: 16, borderRadius: 8, border: 'none', cursor: 'pointer',
              background: config[key] ? '#4ec9b0' : '#555',
              position: 'relative', transition: 'background 0.2s',
            }}
          >
            <span style={{
              position: 'absolute', top: 2, width: 12, height: 12, borderRadius: 6,
              background: '#fff', transition: 'left 0.2s',
              left: config[key] ? 18 : 2,
            }} />
          </button>
        </div>
      ))}

      {/* Center Width */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: '#999' }}>Center Width</span>
          <span style={{ fontSize: 10, color: '#ccc' }}>{config.centerWidth}%</span>
        </div>
        <input
          type="range" min={40} max={100} value={config.centerWidth}
          onChange={(e) => onChange({ centerWidth: Number(e.target.value) })}
          style={{ width: '100%', height: 4 }}
        />
      </div>

      {/* Font Size */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: '#999' }}>Font Size</span>
          <span style={{ fontSize: 10, color: '#ccc' }}>{config.fontSize}px</span>
        </div>
        <input
          type="range" min={12} max={28} value={config.fontSize}
          onChange={(e) => onChange({ fontSize: Number(e.target.value) })}
          style={{ width: '100%', height: 4 }}
        />
      </div>

      {/* Line Height */}
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ fontSize: 10, color: '#999' }}>Line Height</span>
          <span style={{ fontSize: 10, color: '#ccc' }}>{config.lineHeight}</span>
        </div>
        <input
          type="range" min={12} max={30} value={config.lineHeight * 10}
          onChange={(e) => onChange({ lineHeight: Number(e.target.value) / 10 })}
          style={{ width: '100%', height: 4 }}
        />
      </div>

      {/* Ambient Sound */}
      <div style={{ marginTop: 8 }}>
        <span style={{ fontSize: 10, color: '#999', display: 'block', marginBottom: 4 }}>Ambient Sound</span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {(['none', 'rain', 'coffee', 'forest', 'ocean'] as const).map((sound) => (
            <button
              key={sound}
              onClick={() => onChange({ ambientSound: sound })}
              style={{
                padding: '2px 8px', borderRadius: 10, border: 'none', fontSize: 10, cursor: 'pointer',
                textTransform: 'capitalize',
                background: config.ambientSound === sound ? '#4ec9b0' : '#444',
                color: config.ambientSound === sound ? '#000' : '#ccc',
              }}
            >{sound === 'none' ? 'Off' : sound}</button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ZenMode: React.FC<ZenModeProps> = ({
  isActive,
  config,
  onToggle,
  onConfigChange,
  children,
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [opacity, setOpacity] = useState(isActive ? 1 : 0);

  useEffect(() => {
    if (isActive) {
      requestAnimationFrame(() => setOpacity(1));
    } else {
      setOpacity(0);
    }
  }, [isActive]);

  // Handle escape to exit zen mode
  useEffect(() => {
    if (!isActive) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !showSettings) {
        onToggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isActive, showSettings, onToggle]);

  if (!isActive) return <>{children}</>;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 10000,
      background: '#111',
      display: 'flex',
      justifyContent: 'center',
      opacity,
      transition: 'opacity 0.4s ease-in-out',
    }}>
      {/* Editor container */}
      <div style={{
        width: config.centerLayout ? `${config.centerWidth}%` : '100%',
        maxWidth: config.centerLayout ? 1200 : 'none',
        height: '100%',
        padding: `${config.padding}px 0`,
        fontSize: config.fontSize,
        lineHeight: config.lineHeight,
        transition: 'width 0.3s ease, padding 0.3s ease',
      }}>
        {children}
      </div>

      {/* Floating controls (top right, appear on hover) */}
      <div
        style={{
          position: 'absolute', top: 0, right: 0, padding: 8,
          display: 'flex', gap: 4, opacity: 0, transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
      >
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            background: 'rgba(60,60,60,0.5)', border: 'none', borderRadius: 4,
            color: '#aaa', cursor: 'pointer', fontSize: 14, padding: '4px 8px',
          }}
          title="Zen Mode Settings"
        >⚙</button>
        <button
          onClick={onToggle}
          style={{
            background: 'rgba(60,60,60,0.5)', border: 'none', borderRadius: 4,
            color: '#aaa', cursor: 'pointer', fontSize: 14, padding: '4px 8px',
          }}
          title="Exit Zen Mode (Esc)"
        >✕</button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <ZenModeSettings
          config={config}
          onChange={onConfigChange}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Bottom hint */}
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        fontSize: 10, color: '#555', opacity: 0, transition: 'opacity 0.2s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
      >
        Press Esc to exit Zen Mode
      </div>
    </div>
  );
};
