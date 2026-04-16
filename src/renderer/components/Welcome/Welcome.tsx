import React, { useState, useCallback } from 'react';

// ============================================================================
// Enhanced Welcome Page - onboarding, recent projects, tips, keyboard shortcuts
// ============================================================================

interface RecentProject {
  name: string;
  path: string;
  lastOpened: number;
  pinned?: boolean;
}

interface WelcomeProps {
  recentProjects?: RecentProject[];
  version?: string;
  onOpenFolder?: () => void;
  onNewFile?: () => void;
  onCloneRepo?: () => void;
  onOpenProject?: (path: string) => void;
  onPinProject?: (path: string) => void;
  onRemoveProject?: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenKeyboardShortcuts?: () => void;
}

const SHORTCUTS = [
  { keys: 'Ctrl+P', description: 'Quick Open File', category: 'general' },
  { keys: 'Ctrl+Shift+P', description: 'Command Palette', category: 'general' },
  { keys: 'Ctrl+K', description: 'AI Inline Edit', category: 'ai' },
  { keys: 'Ctrl+L', description: 'AI Chat', category: 'ai' },
  { keys: 'Ctrl+Shift+I', description: 'Toggle AI Panel', category: 'ai' },
  { keys: 'Ctrl+`', description: 'Toggle Terminal', category: 'general' },
  { keys: 'Ctrl+B', description: 'Toggle Sidebar', category: 'general' },
  { keys: 'Ctrl+Shift+E', description: 'Explorer', category: 'navigation' },
  { keys: 'Ctrl+Shift+F', description: 'Search Across Files', category: 'navigation' },
  { keys: 'Ctrl+Shift+G', description: 'Source Control', category: 'navigation' },
  { keys: 'Ctrl+\\', description: 'Split Editor', category: 'editor' },
  { keys: 'Ctrl+W', description: 'Close Editor', category: 'editor' },
  { keys: 'Ctrl+Tab', description: 'Switch Editor Tab', category: 'editor' },
  { keys: 'Ctrl+Shift+K', description: 'Delete Line', category: 'editor' },
  { keys: 'Alt+Up/Down', description: 'Move Line Up/Down', category: 'editor' },
  { keys: 'Ctrl+D', description: 'Select Next Occurrence', category: 'editor' },
  { keys: 'Ctrl+Shift+L', description: 'Select All Occurrences', category: 'editor' },
  { keys: 'F2', description: 'Rename Symbol', category: 'editor' },
];

const TIPS = [
  'Press Ctrl+K to use AI to edit code inline - select code first for context',
  'Use Ctrl+L to open the AI chat and ask questions about your codebase',
  'The command palette (Ctrl+Shift+P) gives you access to all editor commands',
  'Use Ctrl+P to quickly open any file by typing part of its name',
  'Split your editor with Ctrl+\\ to view files side by side',
  'Use Ctrl+Shift+F to search across all files in your workspace',
  'Press F12 to go to definition, or Alt+F12 to peek at it inline',
  'Use multiple cursors with Ctrl+D to edit similar text simultaneously',
];

const ActionButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  onClick?: () => void;
}> = ({ icon, label, sublabel, onClick }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        background: hovered ? 'var(--list-hover-background, #2a2d2e)' : 'transparent',
        border: '1px solid var(--panel-border, #333)',
        borderRadius: 6,
        cursor: 'pointer',
        color: 'var(--foreground, #ccc)',
        width: '100%',
        textAlign: 'left',
        transition: 'all 0.15s',
        transform: hovered ? 'translateY(-1px)' : 'none',
      }}
    >
      <span style={{ color: 'var(--accent, #007acc)', flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {sublabel && <div style={{ fontSize: 11, color: 'var(--foreground-muted, #888)', marginTop: 2 }}>{sublabel}</div>}
      </div>
    </button>
  );
};

const Kbd: React.FC<{ children: string }> = ({ children }) => (
  <kbd style={{
    display: 'inline-block',
    padding: '1px 6px',
    borderRadius: 3,
    background: 'var(--keybinding-background, #333)',
    border: '1px solid var(--keybinding-border, #444)',
    color: 'var(--keybinding-foreground, #ccc)',
    fontSize: 11,
    fontFamily: 'inherit',
    minWidth: 20,
    textAlign: 'center',
  }}>
    {children}
  </kbd>
);

export const Welcome: React.FC<WelcomeProps> = ({
  recentProjects = [],
  version = '1.0.0',
  onOpenFolder,
  onNewFile,
  onCloneRepo,
  onOpenProject,
  onPinProject,
  onRemoveProject,
  onOpenSettings,
  onOpenKeyboardShortcuts,
}) => {
  const [activeShortcutCategory, setActiveShortcutCategory] = useState<string>('all');
  const [tipIndex] = useState(() => Math.floor(Math.random() * TIPS.length));
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);

  const sortedProjects = [...recentProjects].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.lastOpened - a.lastOpened;
  });

  const filteredShortcuts = activeShortcutCategory === 'all'
    ? SHORTCUTS
    : SHORTCUTS.filter((s) => s.category === activeShortcutCategory);

  const formatTimeAgo = useCallback((timestamp: number): string => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      height: '100%',
      overflow: 'auto',
      background: 'var(--editor-background, #1e1e1e)',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: 800, width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="10" fill="var(--accent, #007acc)"/>
              <path d="M14 14L24 24L14 34" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M24 34H34" stroke="white" strokeWidth="3" strokeLinecap="round"/>
            </svg>
            <h1 style={{
              fontSize: 32,
              fontWeight: 300,
              color: 'var(--foreground, #ccc)',
              margin: 0,
              letterSpacing: -0.5,
            }}>
              Cursor IDE
            </h1>
          </div>
          <p style={{ fontSize: 14, color: 'var(--foreground-muted, #888)', margin: 0 }}>
            AI-powered code editor &middot; v{version}
          </p>
        </div>

        {/* Tip of the day */}
        <div style={{
          background: 'rgba(0, 122, 204, 0.1)',
          border: '1px solid rgba(0, 122, 204, 0.3)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent, #007acc)" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 16v-4M12 8h.01"/>
          </svg>
          <div style={{ fontSize: 13, color: 'var(--foreground, #ccc)' }}>
            <strong style={{ color: 'var(--accent, #007acc)' }}>Tip:</strong> {TIPS[tipIndex]}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
          {/* Left column - Actions & Recent */}
          <div>
            {/* Quick Actions */}
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground, #ccc)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Start
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 32 }}>
              <ActionButton
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>}
                label="Open Folder"
                sublabel="Browse for a project folder"
                onClick={onOpenFolder}
              />
              <ActionButton
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>}
                label="New File"
                sublabel="Create an untitled file"
                onClick={onNewFile}
              />
              <ActionButton
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M12 9v3M12 12l-6 3M12 12l6 3"/></svg>}
                label="Clone Repository"
                sublabel="Clone a Git repository"
                onClick={onCloneRepo}
              />
            </div>

            {/* Recent Projects */}
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground, #ccc)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Recent
            </h3>
            {sortedProjects.length === 0 ? (
              <div style={{ color: 'var(--foreground-muted, #888)', fontSize: 13, padding: '12px 0' }}>
                No recent projects. Open a folder to get started.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {sortedProjects.slice(0, 8).map((project) => (
                  <div
                    key={project.path}
                    onClick={() => onOpenProject?.(project.path)}
                    onMouseEnter={() => setHoveredProject(project.path)}
                    onMouseLeave={() => setHoveredProject(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 8px',
                      borderRadius: 4,
                      cursor: 'pointer',
                      background: hoveredProject === project.path ? 'var(--list-hover-background, #2a2d2e)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="var(--icon-folder, #dcb67a)">
                      <path d="M1.5 2A1.5 1.5 0 000 3.5v9A1.5 1.5 0 001.5 14h13a1.5 1.5 0 001.5-1.5V5.5A1.5 1.5 0 0014.5 4H8L6.354 2.354A.5.5 0 006 2H1.5z"/>
                    </svg>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, color: 'var(--foreground, #ccc)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {project.pinned && <span style={{ color: 'var(--accent, #007acc)', marginRight: 4 }}>*</span>}
                        {project.name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--foreground-muted, #888)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {project.path}
                      </div>
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--foreground-muted, #666)', flexShrink: 0 }}>
                      {formatTimeAgo(project.lastOpened)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right column - Shortcuts & Help */}
          <div>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground, #ccc)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Keyboard Shortcuts
            </h3>

            {/* Category filter */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              {['all', 'general', 'ai', 'editor', 'navigation'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveShortcutCategory(cat)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: 3,
                    border: 'none',
                    background: activeShortcutCategory === cat ? 'var(--button-background, #0e639c)' : 'transparent',
                    color: activeShortcutCategory === cat ? '#fff' : 'var(--foreground-muted, #888)',
                    cursor: 'pointer',
                    fontSize: 11,
                    textTransform: 'capitalize',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredShortcuts.map((shortcut) => (
                <div key={shortcut.keys} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 0',
                  fontSize: 12,
                }}>
                  <span style={{ color: 'var(--foreground, #ccc)' }}>{shortcut.description}</span>
                  <Kbd>{shortcut.keys}</Kbd>
                </div>
              ))}
            </div>

            {/* Help links */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground, #ccc)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                Help
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={onOpenSettings}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent, #007acc)',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Open Settings
                </button>
                <button
                  onClick={onOpenKeyboardShortcuts}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent, #007acc)',
                    cursor: 'pointer',
                    fontSize: 13,
                    textAlign: 'left',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  Keyboard Shortcut Reference
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: 48, paddingBottom: 20 }}>
          <p style={{ fontSize: 11, color: 'var(--foreground-muted, #666)' }}>
            Cursor IDE v{version} &middot; Built with Electron + React + Monaco
          </p>
        </div>
      </div>
    </div>
  );
};
