const STORAGE_KEY = 'cursor-ide-recent-projects';
const MAX_PROJECTS = 20;

export interface RecentProject {
  path: string;
  name: string;
  lastOpened: number;
  pinned: boolean;
}

export class RecentProjectsService {
  private projects: RecentProject[];

  constructor() {
    this.projects = this.load();
  }

  private load(): RecentProject[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fall through
    }
    return [];
  }

  private save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.projects));
    } catch {
      // Storage may be unavailable
    }
  }

  getAll(): RecentProject[] {
    return [...this.projects].sort((a, b) => {
      // Pinned first, then by last opened
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.lastOpened - a.lastOpened;
    });
  }

  add(path: string, name?: string): void {
    const existing = this.projects.findIndex((p) => p.path === path);
    if (existing !== -1) {
      this.projects[existing].lastOpened = Date.now();
      if (name) this.projects[existing].name = name;
    } else {
      const projectName = name || path.split('/').pop() || path;
      this.projects.push({
        path,
        name: projectName,
        lastOpened: Date.now(),
        pinned: false,
      });
    }

    // Trim to max (keep pinned)
    const pinned = this.projects.filter((p) => p.pinned);
    const unpinned = this.projects
      .filter((p) => !p.pinned)
      .sort((a, b) => b.lastOpened - a.lastOpened)
      .slice(0, MAX_PROJECTS - pinned.length);
    this.projects = [...pinned, ...unpinned];

    this.save();
  }

  remove(path: string): void {
    this.projects = this.projects.filter((p) => p.path !== path);
    this.save();
  }

  togglePin(path: string): void {
    const project = this.projects.find((p) => p.path === path);
    if (project) {
      project.pinned = !project.pinned;
      this.save();
    }
  }

  clear(): void {
    this.projects = this.projects.filter((p) => p.pinned);
    this.save();
  }

  clearAll(): void {
    this.projects = [];
    this.save();
  }

  getCount(): number {
    return this.projects.length;
  }
}

export const recentProjectsService = new RecentProjectsService();
