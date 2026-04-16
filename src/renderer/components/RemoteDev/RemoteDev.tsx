import React, { useState, useCallback } from 'react';

// ============================================================================
// Remote Development - SSH, Container, WSL connection UI
// ============================================================================

export type RemoteConnectionType = 'ssh' | 'container' | 'wsl' | 'tunnel' | 'codespace';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error' | 'reconnecting';

export interface RemoteConnection {
  id: string;
  type: RemoteConnectionType;
  name: string;
  host?: string;
  port?: number;
  user?: string;
  status: ConnectionStatus;
  lastConnected?: number;
  os?: string;
  arch?: string;
  latency?: number;
  containerId?: string;
  distro?: string;
  error?: string;
}

export interface RemoteConnectionConfig {
  type: RemoteConnectionType;
  host: string;
  port: number;
  user: string;
  authMethod: 'password' | 'key' | 'agent';
  keyPath?: string;
  forwardPorts?: number[];
  remoteWorkspacePath?: string;
}

interface RemoteDevProps {
  connections: RemoteConnection[];
  activeConnectionId?: string;
  onConnect: (id: string) => void;
  onDisconnect: (id: string) => void;
  onAddConnection: (config: RemoteConnectionConfig) => void;
  onRemoveConnection: (id: string) => void;
  onEditConnection: (id: string) => void;
  onRefresh: () => void;
}

const TYPE_INFO: Record<RemoteConnectionType, { icon: string; label: string; color: string }> = {
  ssh: { icon: '🔒', label: 'SSH', color: '#4ec9b0' },
  container: { icon: '📦', label: 'Container', color: '#3794ff' },
  wsl: { icon: '🐧', label: 'WSL', color: '#e8ab53' },
  tunnel: { icon: '🔗', label: 'Tunnel', color: '#c586c0' },
  codespace: { icon: '☁️', label: 'Codespace', color: '#569cd6' },
};

const STATUS_STYLES: Record<ConnectionStatus, { color: string; label: string; animate?: boolean }> = {
  disconnected: { color: '#969696', label: 'Disconnected' },
  connecting: { color: '#cca700', label: 'Connecting...', animate: true },
  connected: { color: '#4ec9b0', label: 'Connected' },
  error: { color: '#f44747', label: 'Error' },
  reconnecting: { color: '#cca700', label: 'Reconnecting...', animate: true },
};

const AddConnectionForm: React.FC<{
  onSubmit: (config: RemoteConnectionConfig) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [type, setType] = useState<RemoteConnectionType>('ssh');
  const [host, setHost] = useState('');
  const [port, setPort] = useState(22);
  const [user, setUser] = useState('');
  const [authMethod, setAuthMethod] = useState<'password' | 'key' | 'agent'>('key');
  const [keyPath, setKeyPath] = useState('~/.ssh/id_rsa');

  const handleSubmit = () => {
    if (!host) return;
    onSubmit({ type, host, port, user, authMethod, keyPath: authMethod === 'key' ? keyPath : undefined });
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '4px 8px', background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-color)', borderRadius: 3, color: 'var(--text-primary)',
    fontSize: 12, outline: 'none',
  };

  return (
    <div style={{ padding: 16, borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>New Connection</div>
      <div style={{ display: 'grid', gap: 8 }}>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Type</label>
          <div style={{ display: 'flex', gap: 4 }}>
            {(Object.keys(TYPE_INFO) as RemoteConnectionType[]).map((t) => (
              <button key={t} onClick={() => setType(t)} style={{
                padding: '3px 8px', borderRadius: 3, border: 'none', fontSize: 10, cursor: 'pointer',
                background: type === t ? TYPE_INFO[t].color : 'var(--bg-tertiary)',
                color: type === t ? '#000' : 'var(--text-secondary)',
              }}>{TYPE_INFO[t].icon} {TYPE_INFO[t].label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 8 }}>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Host</label>
            <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="hostname or IP" style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Port</label>
            <input type="number" value={port} onChange={(e) => setPort(Number(e.target.value))} style={inputStyle} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>User</label>
          <input value={user} onChange={(e) => setUser(e.target.value)} placeholder="username" style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Auth</label>
          <select value={authMethod} onChange={(e) => setAuthMethod(e.target.value as typeof authMethod)} style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="key">SSH Key</option>
            <option value="password">Password</option>
            <option value="agent">SSH Agent</option>
          </select>
        </div>
        {authMethod === 'key' && (
          <div>
            <label style={{ fontSize: 10, color: 'var(--text-secondary)', display: 'block', marginBottom: 2 }}>Key Path</label>
            <input value={keyPath} onChange={(e) => setKeyPath(e.target.value)} style={inputStyle} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '4px 12px', borderRadius: 3, border: '1px solid var(--border-color)',
            background: 'transparent', color: 'var(--text-secondary)', fontSize: 11, cursor: 'pointer',
          }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            padding: '4px 12px', borderRadius: 3, border: 'none',
            background: 'var(--accent-color)', color: '#fff', fontSize: 11, cursor: 'pointer',
          }}>Connect</button>
        </div>
      </div>
    </div>
  );
};

export const RemoteDev: React.FC<RemoteDevProps> = ({
  connections,
  activeConnectionId,
  onConnect,
  onDisconnect,
  onAddConnection,
  onRemoveConnection,
  onEditConnection,
  onRefresh,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterType, setFilterType] = useState<RemoteConnectionType | 'all'>('all');

  const filtered = filterType === 'all' ? connections : connections.filter((c) => c.type === filterType);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-primary)' }}>
          Remote Explorer
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => setShowAddForm(true)} style={{
          background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: 14,
        }} title="Add Connection">+</button>
        <button onClick={onRefresh} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
        }} title="Refresh">⟳</button>
      </div>

      {/* Type filter */}
      <div style={{ display: 'flex', gap: 4, padding: '4px 8px', borderBottom: '1px solid var(--border-color)' }}>
        <button onClick={() => setFilterType('all')} style={{
          padding: '1px 6px', borderRadius: 3, border: 'none', fontSize: 10, cursor: 'pointer',
          background: filterType === 'all' ? 'var(--bg-active)' : 'transparent',
          color: filterType === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
        }}>All</button>
        {(Object.keys(TYPE_INFO) as RemoteConnectionType[]).map((t) => (
          <button key={t} onClick={() => setFilterType(t)} style={{
            padding: '1px 6px', borderRadius: 3, border: 'none', fontSize: 10, cursor: 'pointer',
            background: filterType === t ? `${TYPE_INFO[t].color}22` : 'transparent',
            color: filterType === t ? TYPE_INFO[t].color : 'var(--text-secondary)',
          }}>{TYPE_INFO[t].icon}</button>
        ))}
      </div>

      {/* Add form */}
      {showAddForm && (
        <AddConnectionForm
          onSubmit={(config) => { onAddConnection(config); setShowAddForm(false); }}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {/* Connection List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)', fontSize: 12 }}>
            No remote connections configured
          </div>
        ) : (
          filtered.map((conn) => {
            const typeInfo = TYPE_INFO[conn.type];
            const statusStyle = STATUS_STYLES[conn.status];
            const isActive = conn.id === activeConnectionId;
            return (
              <div key={conn.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
                borderBottom: '1px solid rgba(60,60,60,0.3)', cursor: 'pointer',
                background: isActive ? 'rgba(55,148,255,0.1)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--accent-color)' : '3px solid transparent',
              }}
              onMouseOver={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--bg-hover)'; }}
              onMouseOut={(e) => { if (!isActive) e.currentTarget.style.background = isActive ? 'rgba(55,148,255,0.1)' : 'transparent'; }}
              >
                <span style={{ fontSize: 18 }}>{typeInfo.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>{conn.name}</span>
                    <span style={{
                      width: 8, height: 8, borderRadius: 4, background: statusStyle.color, flexShrink: 0,
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                    {conn.user && `${conn.user}@`}{conn.host}{conn.port && conn.port !== 22 ? `:${conn.port}` : ''}
                  </div>
                  {conn.error && <div style={{ fontSize: 10, color: '#f44747' }}>{conn.error}</div>}
                  <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                    <span style={{ color: statusStyle.color }}>{statusStyle.label}</span>
                    {conn.os && <span>{conn.os} {conn.arch}</span>}
                    {conn.latency != null && <span>{conn.latency}ms</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  {conn.status === 'connected' ? (
                    <button onClick={() => onDisconnect(conn.id)} style={{
                      padding: '3px 8px', borderRadius: 3, border: '1px solid rgba(244,71,71,0.3)',
                      background: 'transparent', color: '#f44747', fontSize: 10, cursor: 'pointer',
                    }}>Disconnect</button>
                  ) : conn.status === 'disconnected' || conn.status === 'error' ? (
                    <button onClick={() => onConnect(conn.id)} style={{
                      padding: '3px 8px', borderRadius: 3, border: 'none',
                      background: 'var(--accent-color)', color: '#fff', fontSize: 10, cursor: 'pointer',
                    }}>Connect</button>
                  ) : null}
                  <button onClick={() => onEditConnection(conn.id)} style={{
                    background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11,
                  }}>⚙</button>
                  <button onClick={() => onRemoveConnection(conn.id)} style={{
                    background: 'none', border: 'none', color: '#f44747', cursor: 'pointer', fontSize: 11,
                  }}>×</button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Status */}
      <div style={{
        padding: '3px 8px', borderTop: '1px solid var(--border-color)',
        fontSize: 10, color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{connections.filter((c) => c.status === 'connected').length} connected</span>
        <span>{connections.length} total</span>
      </div>
    </div>
  );
};
