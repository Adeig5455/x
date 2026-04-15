import React, { useState, useCallback } from 'react';

// ============================================================================
// Workspace Trust - Security model for untrusted workspaces
// ============================================================================

export type TrustLevel = 'trusted' | 'restricted' | 'untrusted';

export interface WorkspaceTrustConfig {
  trustLevel: TrustLevel;
  trustedFolders: string[];
  restrictedExtensions: string[];
  allowedTasks: string[];
  disabledFeatures: string[];
  lastTrustDecision?: number;
  parentFolderTrust?: boolean;
}

interface WorkspaceTrustProps {
  config: WorkspaceTrustConfig;
  workspacePath: string;
  onTrustWorkspace: () => void;
  onRestrictWorkspace: () => void;
  onManageTrustedFolders: () => void;
  onOpenSettings: () => void;
}

const TRUST_INFO: Record<TrustLevel, { color: string; icon: string; title: string; description: string }> = {
  trusted: {
    color: '#4ec9b0',
    icon: '🛡️',
    title: 'Trusted Workspace',
    description: 'All features are enabled. Extensions can run code and access the file system.',
  },
  restricted: {
    color: '#cca700',
    icon: '⚠️',
    title: 'Restricted Mode',
    description: 'Some features are disabled for safety. Only trusted extensions can run.',
  },
  untrusted: {
    color: '#f44747',
    icon: '🚫',
    title: 'Untrusted Workspace',
    description: 'This workspace has not been trusted. Many features are disabled.',
  },
};

const RESTRICTED_FEATURES = [
  { id: 'tasks', name: 'Task Execution', description: 'Running tasks and build scripts' },
  { id: 'debugging', name: 'Debugging', description: 'Launching debug sessions' },
  { id: 'extensions', name: 'Extension Host', description: 'Running workspace extensions' },
  { id: 'terminal-env', name: 'Terminal Environment', description: 'Custom environment variables in terminal' },
  { id: 'settings', name: 'Workspace Settings', description: 'Applying workspace-specific settings' },
  { id: 'git-hooks', name: 'Git Hooks', description: 'Running pre-commit and other git hooks' },
  { id: 'code-actions', name: 'Code Actions', description: 'Automatic code modifications' },
  { id: 'file-watchers', name: 'File Watchers', description: 'File system event handling' },
];

export const WorkspaceTrust: React.FC<WorkspaceTrustProps> = ({
  config,
  workspacePath,
  onTrustWorkspace,
  onRestrictWorkspace,
  onManageTrustedFolders,
  onOpenSettings,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const trustInfo = TRUST_INFO[config.trustLevel];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      background: 'var(--bg-primary)',
      padding: 32,
    }}>
      {/* Trust Shield */}
      <div style={{
        width: 80,
        height: 80,
        borderRadius: 40,
        background: `${trustInfo.color}15`,
        border: `3px solid ${trustInfo.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 36,
        marginBottom: 24,
      }}>
        {trustInfo.icon}
      </div>

      <h2 style={{ color: trustInfo.color, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
        {trustInfo.title}
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center', maxWidth: 500, marginBottom: 8 }}>
        {trustInfo.description}
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 11, fontFamily: 'monospace', marginBottom: 24 }}>
        {workspacePath}
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 32 }}>
        {config.trustLevel !== 'trusted' && (
          <button
            onClick={onTrustWorkspace}
            style={{
              padding: '8px 24px',
              borderRadius: 4,
              border: 'none',
              background: '#4ec9b0',
              color: '#000',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Trust This Workspace
          </button>
        )}
        {config.trustLevel === 'trusted' && (
          <button
            onClick={onRestrictWorkspace}
            style={{
              padding: '8px 24px',
              borderRadius: 4,
              border: '1px solid #cca700',
              background: 'transparent',
              color: '#cca700',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Restrict Workspace
          </button>
        )}
        <button
          onClick={onManageTrustedFolders}
          style={{
            padding: '8px 24px',
            borderRadius: 4,
            border: '1px solid var(--border-color)',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Manage Trusted Folders
        </button>
      </div>

      {/* Feature Status */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent-color)',
          cursor: 'pointer',
          fontSize: 12,
          marginBottom: 16,
        }}
      >
        {showDetails ? 'Hide' : 'Show'} Feature Details
      </button>

      {showDetails && (
        <div style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 12px',
            background: 'var(--bg-tertiary)',
            borderBottom: '1px solid var(--border-color)',
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            color: 'var(--text-secondary)',
          }}>
            Feature Status
          </div>
          {RESTRICTED_FEATURES.map((feature) => {
            const isDisabled = config.disabledFeatures.includes(feature.id);
            return (
              <div
                key={feature.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '8px 12px',
                  borderBottom: '1px solid rgba(60,60,60,0.3)',
                }}
              >
                <span style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  background: isDisabled ? '#f44747' : '#4ec9b0',
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{feature.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{feature.description}</div>
                </div>
                <span style={{
                  fontSize: 10,
                  padding: '2px 6px',
                  borderRadius: 3,
                  background: isDisabled ? 'rgba(244,71,71,0.15)' : 'rgba(78,201,176,0.15)',
                  color: isDisabled ? '#f44747' : '#4ec9b0',
                }}>
                  {isDisabled ? 'Disabled' : 'Enabled'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Trusted Folders */}
      {config.trustedFolders.length > 0 && (
        <div style={{ marginTop: 24, width: '100%', maxWidth: 600 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase' }}>
            Trusted Folders ({config.trustedFolders.length})
          </div>
          {config.trustedFolders.map((folder) => (
            <div key={folder} style={{
              padding: '4px 8px',
              fontSize: 11,
              fontFamily: 'monospace',
              color: 'var(--text-primary)',
              background: 'var(--bg-secondary)',
              borderRadius: 3,
              marginBottom: 4,
            }}>
              {folder}
            </div>
          ))}
        </div>
      )}

      {/* Settings Link */}
      <button
        onClick={onOpenSettings}
        style={{
          marginTop: 24,
          background: 'none',
          border: 'none',
          color: 'var(--accent-color)',
          cursor: 'pointer',
          fontSize: 11,
        }}
      >
        Open Workspace Trust Settings
      </button>
    </div>
  );
};
