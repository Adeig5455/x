import type { KeyBinding } from '../../shared/types';

type CommandHandler = () => void;

export class KeybindingService {
  private bindings: Map<string, KeyBinding> = new Map();
  private handlers: Map<string, CommandHandler> = new Map();
  private isListening: boolean = false;

  constructor() {
    this.registerDefaults();
  }

  private registerDefaults(): void {
    const defaults: KeyBinding[] = [
      { id: 'open-file', key: 'ctrl+p', command: 'quickOpen' },
      { id: 'command-palette', key: 'ctrl+shift+p', command: 'commandPalette' },
      { id: 'ai-edit', key: 'ctrl+k', command: 'aiEdit' },
      { id: 'ai-chat', key: 'ctrl+l', command: 'aiChat' },
      { id: 'toggle-terminal', key: 'ctrl+`', command: 'toggleTerminal' },
      { id: 'toggle-sidebar', key: 'ctrl+b', command: 'toggleSidebar' },
      { id: 'save-file', key: 'ctrl+s', command: 'saveFile' },
      { id: 'save-all', key: 'ctrl+shift+s', command: 'saveAll' },
      { id: 'find', key: 'ctrl+f', command: 'find' },
      { id: 'find-replace', key: 'ctrl+h', command: 'findReplace' },
      { id: 'find-in-files', key: 'ctrl+shift+f', command: 'findInFiles' },
      { id: 'close-tab', key: 'ctrl+w', command: 'closeTab' },
      { id: 'new-file', key: 'ctrl+n', command: 'newFile' },
      { id: 'undo', key: 'ctrl+z', command: 'undo' },
      { id: 'redo', key: 'ctrl+shift+z', command: 'redo' },
      { id: 'settings', key: 'ctrl+,', command: 'openSettings' },
      { id: 'zoom-in', key: 'ctrl+=', command: 'zoomIn' },
      { id: 'zoom-out', key: 'ctrl+-', command: 'zoomOut' },
    ];

    for (const binding of defaults) {
      this.bindings.set(binding.id, binding);
    }
  }

  registerCommand(command: string, handler: CommandHandler): void {
    this.handlers.set(command, handler);
  }

  unregisterCommand(command: string): void {
    this.handlers.delete(command);
  }

  updateBinding(id: string, newKey: string): void {
    const binding = this.bindings.get(id);
    if (binding) {
      this.bindings.set(id, { ...binding, key: newKey });
    }
  }

  getBindings(): KeyBinding[] {
    return Array.from(this.bindings.values());
  }

  getBindingForCommand(command: string): KeyBinding | undefined {
    return Array.from(this.bindings.values()).find((b) => b.command === command);
  }

  startListening(): void {
    if (this.isListening) return;
    this.isListening = true;
    window.addEventListener('keydown', this.handleKeyDown);
  }

  stopListening(): void {
    this.isListening = false;
    window.removeEventListener('keydown', this.handleKeyDown);
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const key = this.normalizeKeyEvent(e);

    for (const binding of this.bindings.values()) {
      if (binding.key === key) {
        e.preventDefault();
        const handler = this.handlers.get(binding.command);
        if (handler) handler();
        break;
      }
    }
  };

  private normalizeKeyEvent(e: KeyboardEvent): string {
    const parts: string[] = [];
    if (e.ctrlKey || e.metaKey) parts.push('ctrl');
    if (e.shiftKey) parts.push('shift');
    if (e.altKey) parts.push('alt');
    parts.push(e.key.toLowerCase());
    return parts.join('+');
  }
}

export const keybindingService = new KeybindingService();
