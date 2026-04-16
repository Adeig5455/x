import { RecentProjectsService } from '../recentProjectsService';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('RecentProjectsService', () => {
  let service: RecentProjectsService;

  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    service = new RecentProjectsService();
  });

  it('starts with empty list', () => {
    expect(service.getAll()).toEqual([]);
    expect(service.getCount()).toBe(0);
  });

  it('adds a project', () => {
    service.add('/path/to/project', 'My Project');
    const projects = service.getAll();
    expect(projects).toHaveLength(1);
    expect(projects[0].path).toBe('/path/to/project');
    expect(projects[0].name).toBe('My Project');
  });

  it('uses folder name when no name provided', () => {
    service.add('/path/to/myproject');
    expect(service.getAll()[0].name).toBe('myproject');
  });

  it('updates lastOpened for existing project', () => {
    service.add('/path/to/project');
    const first = service.getAll()[0].lastOpened;

    // Wait a bit to ensure different timestamp
    jest.advanceTimersByTime?.(100);
    service.add('/path/to/project');
    const second = service.getAll()[0].lastOpened;
    expect(second).toBeGreaterThanOrEqual(first);
  });

  it('removes a project', () => {
    service.add('/path/a');
    service.add('/path/b');
    service.remove('/path/a');
    expect(service.getAll()).toHaveLength(1);
    expect(service.getAll()[0].path).toBe('/path/b');
  });

  it('toggles pin', () => {
    service.add('/path/to/project');
    expect(service.getAll()[0].pinned).toBe(false);

    service.togglePin('/path/to/project');
    expect(service.getAll()[0].pinned).toBe(true);

    service.togglePin('/path/to/project');
    expect(service.getAll()[0].pinned).toBe(false);
  });

  it('sorts pinned projects first', () => {
    service.add('/path/a');
    service.add('/path/b');
    service.togglePin('/path/a');

    const projects = service.getAll();
    expect(projects[0].path).toBe('/path/a');
    expect(projects[0].pinned).toBe(true);
  });

  it('clears unpinned projects', () => {
    service.add('/path/a');
    service.add('/path/b');
    service.togglePin('/path/a');
    service.clear();

    expect(service.getAll()).toHaveLength(1);
    expect(service.getAll()[0].path).toBe('/path/a');
  });

  it('clears all projects including pinned', () => {
    service.add('/path/a');
    service.togglePin('/path/a');
    service.clearAll();
    expect(service.getAll()).toHaveLength(0);
  });

  it('saves to localStorage', () => {
    service.add('/path/to/project');
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });
});
