import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store';

interface Command {
  id: string;
  label: string;
  category: string;
  action: () => void;
}

export const CommandPaletteOverlay: React.FC = () => {
  const commandPaletteOpen = useAppStore((s) => s.ui.commandPaletteOpen);
  const openCommandPalette = useAppStore((s) => s.ui.openCommandPalette);
  const [query, setQuery] = useState('');
  const [commands] = useState<Command[]>([]);

  const filteredCommands = commands.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(query.toLowerCase()) ||
      cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        openCommandPalette();
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        openCommandPalette();
      }
    },
    [commandPaletteOpen, openCommandPalette]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={() => openCommandPalette()}>
      <div className="command-palette" onClick={(e) => e.stopPropagation()}>
        <input
          className="command-palette-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          autoFocus
        />
        <div className="command-palette-results">
          {filteredCommands.map((cmd) => (
            <div
              key={cmd.id}
              className="command-palette-item"
              onClick={() => {
                cmd.action();
                openCommandPalette();
              }}
            >
              <span className="command-category">{cmd.category}</span>
              <span className="command-label">{cmd.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
