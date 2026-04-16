export interface RegisteredCommand {
  id: string;
  label: string;
  category: string;
  description?: string;
  keybinding?: string;
  action: () => void;
}

export class CommandRegistry {
  private commands: Map<string, RegisteredCommand> = new Map();

  register(command: RegisteredCommand): void {
    this.commands.set(command.id, command);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  get(id: string): RegisteredCommand | undefined {
    return this.commands.get(id);
  }

  getAll(): RegisteredCommand[] {
    return Array.from(this.commands.values());
  }

  getByCategory(category: string): RegisteredCommand[] {
    return this.getAll().filter((cmd) => cmd.category === category);
  }

  getCategories(): string[] {
    const categories = new Set(this.getAll().map((cmd) => cmd.category));
    return Array.from(categories).sort();
  }

  execute(id: string): boolean {
    const command = this.commands.get(id);
    if (command) {
      command.action();
      return true;
    }
    return false;
  }

  search(query: string): RegisteredCommand[] {
    const lower = query.toLowerCase();
    return this.getAll().filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(lower) ||
        cmd.category.toLowerCase().includes(lower) ||
        (cmd.description && cmd.description.toLowerCase().includes(lower))
    );
  }

  clear(): void {
    this.commands.clear();
  }

  get size(): number {
    return this.commands.size;
  }
}

export const commandRegistry = new CommandRegistry();
