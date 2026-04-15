import React, { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../../store';

interface Command {
  id: string;
  label: string;
  category: string;
  action: () => void;
}

export const CommandPaletteOverlay: React.FC = () => {
  const { commandPaletteOpen, toggleCommandPalette } = useAppStore();
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
        toggleCommandPalette();
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        toggleCommandPalette();
      }
    },
    [commandPaletteOpen, toggleCommandPalette]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="command-palette-overlay" onClick={toggleCommandPalette}>
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
                toggleCommandPalette();
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
