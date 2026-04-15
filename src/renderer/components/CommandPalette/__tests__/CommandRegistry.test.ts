import { CommandRegistry } from '../CommandRegistry';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  it('registers and retrieves commands', () => {
    const action = jest.fn();
    registry.register({
      id: 'test.command',
      label: 'Test Command',
      category: 'Test',
      action,
    });

    const cmd = registry.get('test.command');
    expect(cmd).toBeDefined();
    expect(cmd!.label).toBe('Test Command');
  });

  it('unregisters commands', () => {
    registry.register({
      id: 'test.command',
      label: 'Test',
      category: 'Test',
      action: jest.fn(),
    });

    registry.unregister('test.command');
    expect(registry.get('test.command')).toBeUndefined();
  });

  it('executes commands', () => {
    const action = jest.fn();
    registry.register({
      id: 'test.command',
      label: 'Test',
      category: 'Test',
      action,
    });

    const result = registry.execute('test.command');
    expect(result).toBe(true);
    expect(action).toHaveBeenCalled();
  });

  it('returns false for non-existent command execution', () => {
    const result = registry.execute('non.existent');
    expect(result).toBe(false);
  });

  it('lists all commands', () => {
    registry.register({ id: 'a', label: 'A', category: 'Cat1', action: jest.fn() });
    registry.register({ id: 'b', label: 'B', category: 'Cat2', action: jest.fn() });

    expect(registry.getAll()).toHaveLength(2);
  });

  it('filters by category', () => {
    registry.register({ id: 'a', label: 'A', category: 'Cat1', action: jest.fn() });
    registry.register({ id: 'b', label: 'B', category: 'Cat2', action: jest.fn() });
    registry.register({ id: 'c', label: 'C', category: 'Cat1', action: jest.fn() });

    expect(registry.getByCategory('Cat1')).toHaveLength(2);
    expect(registry.getByCategory('Cat2')).toHaveLength(1);
  });

  it('returns unique categories', () => {
    registry.register({ id: 'a', label: 'A', category: 'File', action: jest.fn() });
    registry.register({ id: 'b', label: 'B', category: 'Edit', action: jest.fn() });
    registry.register({ id: 'c', label: 'C', category: 'File', action: jest.fn() });

    const categories = registry.getCategories();
    expect(categories).toEqual(['Edit', 'File']);
  });

  it('searches commands by label', () => {
    registry.register({ id: 'a', label: 'Open File', category: 'File', action: jest.fn() });
    registry.register({ id: 'b', label: 'Close Tab', category: 'File', action: jest.fn() });

    const results = registry.search('open');
    expect(results).toHaveLength(1);
    expect(results[0].label).toBe('Open File');
  });

  it('searches commands by category', () => {
    registry.register({ id: 'a', label: 'Open', category: 'File', action: jest.fn() });
    registry.register({ id: 'b', label: 'Undo', category: 'Edit', action: jest.fn() });

    const results = registry.search('file');
    expect(results).toHaveLength(1);
  });

  it('clears all commands', () => {
    registry.register({ id: 'a', label: 'A', category: 'C', action: jest.fn() });
    registry.clear();
    expect(registry.size).toBe(0);
  });

  it('tracks size correctly', () => {
    expect(registry.size).toBe(0);
    registry.register({ id: 'a', label: 'A', category: 'C', action: jest.fn() });
    expect(registry.size).toBe(1);
  });
});
