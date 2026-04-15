import { BrowserWindow, BrowserWindowConstructorOptions } from 'electron';

export class WindowManager {
  private windows: Map<number, BrowserWindow> = new Map();

  createWindow(options: BrowserWindowConstructorOptions): BrowserWindow {
    const window = new BrowserWindow(options);
    this.windows.set(window.id, window);

    window.on('closed', () => {
      this.windows.delete(window.id);
    });

    return window;
  }

  getWindow(id: number): BrowserWindow | undefined {
    return this.windows.get(id);
  }

  getAllWindows(): BrowserWindow[] {
    return Array.from(this.windows.values());
  }

  closeAll(): void {
    for (const window of this.windows.values()) {
      window.close();
    }
  }
}
