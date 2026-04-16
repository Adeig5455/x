import type { KeyBinding } from '../../shared/types';

export interface ExtendedKeyBinding extends KeyBinding {
  category: string;
  description: string;
}

export const defaultBindings: ExtendedKeyBinding[] = [
  // File
  { id: 'file.newFile', key: 'ctrl+n', command: 'newFile', when: undefined, category: 'File', description: 'New File' },
  { id: 'file.open', key: 'ctrl+o', command: 'openFile', when: undefined, category: 'File', description: 'Open File' },
  { id: 'file.save', key: 'ctrl+s', command: 'saveFile', when: 'editorFocus', category: 'File', description: 'Save File' },
  { id: 'file.saveAll', key: 'ctrl+shift+s', command: 'saveAll', when: undefined, category: 'File', description: 'Save All' },
  { id: 'file.closeTab', key: 'ctrl+w', command: 'closeTab', when: 'editorFocus', category: 'File', description: 'Close Tab' },

  // Edit
  { id: 'edit.undo', key: 'ctrl+z', command: 'undo', when: 'editorFocus', category: 'Edit', description: 'Undo' },
  { id: 'edit.redo', key: 'ctrl+shift+z', command: 'redo', when: 'editorFocus', category: 'Edit', description: 'Redo' },
  { id: 'edit.cut', key: 'ctrl+x', command: 'cut', when: 'editorFocus', category: 'Edit', description: 'Cut' },
  { id: 'edit.copy', key: 'ctrl+c', command: 'copy', when: 'editorFocus', category: 'Edit', description: 'Copy' },
  { id: 'edit.paste', key: 'ctrl+v', command: 'paste', when: 'editorFocus', category: 'Edit', description: 'Paste' },
  { id: 'edit.selectAll', key: 'ctrl+a', command: 'selectAll', when: 'editorFocus', category: 'Edit', description: 'Select All' },
  { id: 'edit.find', key: 'ctrl+f', command: 'find', when: 'editorFocus', category: 'Edit', description: 'Find' },
  { id: 'edit.findReplace', key: 'ctrl+h', command: 'findReplace', when: 'editorFocus', category: 'Edit', description: 'Find and Replace' },

  // View
  { id: 'view.commandPalette', key: 'ctrl+shift+p', command: 'commandPalette', when: undefined, category: 'View', description: 'Command Palette' },
  { id: 'view.quickOpen', key: 'ctrl+p', command: 'quickOpen', when: undefined, category: 'View', description: 'Quick Open File' },
  { id: 'view.toggleSidebar', key: 'ctrl+b', command: 'toggleSidebar', when: undefined, category: 'View', description: 'Toggle Sidebar' },
  { id: 'view.toggleTerminal', key: 'ctrl+`', command: 'toggleTerminal', when: undefined, category: 'View', description: 'Toggle Terminal' },
  { id: 'view.zoomIn', key: 'ctrl+=', command: 'zoomIn', when: undefined, category: 'View', description: 'Zoom In' },
  { id: 'view.zoomOut', key: 'ctrl+-', command: 'zoomOut', when: undefined, category: 'View', description: 'Zoom Out' },
  { id: 'view.explorer', key: 'ctrl+shift+e', command: 'focusExplorer', when: undefined, category: 'View', description: 'Focus Explorer' },
  { id: 'view.search', key: 'ctrl+shift+f', command: 'focusSearch', when: undefined, category: 'View', description: 'Focus Search' },
  { id: 'view.git', key: 'ctrl+shift+g', command: 'focusGit', when: undefined, category: 'View', description: 'Focus Source Control' },

  // Go
  { id: 'go.goToLine', key: 'ctrl+g', command: 'goToLine', when: 'editorFocus', category: 'Go', description: 'Go to Line' },
  { id: 'go.goToDefinition', key: 'f12', command: 'goToDefinition', when: 'editorFocus', category: 'Go', description: 'Go to Definition' },
  { id: 'go.goBack', key: 'alt+arrowleft', command: 'goBack', when: undefined, category: 'Go', description: 'Go Back' },
  { id: 'go.goForward', key: 'alt+arrowright', command: 'goForward', when: undefined, category: 'Go', description: 'Go Forward' },

  // AI
  { id: 'ai.chat', key: 'ctrl+l', command: 'aiChat', when: undefined, category: 'AI', description: 'Open AI Chat' },
  { id: 'ai.edit', key: 'ctrl+k', command: 'aiEdit', when: 'editorFocus', category: 'AI', description: 'AI Edit' },
  { id: 'ai.acceptCompletion', key: 'tab', command: 'acceptCompletion', when: 'editorFocus && suggestWidgetVisible', category: 'AI', description: 'Accept AI Completion' },
  { id: 'ai.dismissCompletion', key: 'escape', command: 'dismissCompletion', when: 'editorFocus && suggestWidgetVisible', category: 'AI', description: 'Dismiss AI Completion' },

  // Editor
  { id: 'editor.indentLine', key: 'ctrl+]', command: 'indentLine', when: 'editorFocus', category: 'Editor', description: 'Indent Line' },
  { id: 'editor.outdentLine', key: 'ctrl+[', command: 'outdentLine', when: 'editorFocus', category: 'Editor', description: 'Outdent Line' },
  { id: 'editor.moveLine.up', key: 'alt+arrowup', command: 'moveLineUp', when: 'editorFocus', category: 'Editor', description: 'Move Line Up' },
  { id: 'editor.moveLine.down', key: 'alt+arrowdown', command: 'moveLineDown', when: 'editorFocus', category: 'Editor', description: 'Move Line Down' },
  { id: 'editor.copyLine.up', key: 'shift+alt+arrowup', command: 'copyLineUp', when: 'editorFocus', category: 'Editor', description: 'Copy Line Up' },
  { id: 'editor.copyLine.down', key: 'shift+alt+arrowdown', command: 'copyLineDown', when: 'editorFocus', category: 'Editor', description: 'Copy Line Down' },
  { id: 'editor.deleteLine', key: 'ctrl+shift+k', command: 'deleteLine', when: 'editorFocus', category: 'Editor', description: 'Delete Line' },
  { id: 'editor.toggleComment', key: 'ctrl+/', command: 'toggleComment', when: 'editorFocus', category: 'Editor', description: 'Toggle Line Comment' },
  { id: 'editor.formatDocument', key: 'shift+alt+f', command: 'formatDocument', when: 'editorFocus', category: 'Editor', description: 'Format Document' },

  // Terminal
  { id: 'terminal.new', key: 'ctrl+shift+`', command: 'newTerminal', when: undefined, category: 'Terminal', description: 'New Terminal' },
  { id: 'terminal.split', key: 'ctrl+shift+5', command: 'splitTerminal', when: 'terminalFocus', category: 'Terminal', description: 'Split Terminal' },

  // Settings
  { id: 'settings.open', key: 'ctrl+,', command: 'openSettings', when: undefined, category: 'Settings', description: 'Open Settings' },
  { id: 'settings.keybindings', key: 'ctrl+k ctrl+s', command: 'openKeybindings', when: undefined, category: 'Settings', description: 'Open Keybindings' },
];
