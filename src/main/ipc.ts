import { ipcMain, BrowserWindow, dialog } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { IPC_CHANNELS } from '../shared/types';

export function registerIpcHandlers(_mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.FILE_READ, async (_event, filePath: string) => {
    return fs.readFile(filePath, 'utf-8');
  });

  ipcMain.handle(IPC_CHANNELS.FILE_WRITE, async (_event, filePath: string, content: string) => {
    await fs.writeFile(filePath, content, 'utf-8');
  });

  ipcMain.handle(IPC_CHANNELS.FILE_LIST, async (_event, dirPath: string) => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries.map((entry) => ({
      name: entry.name,
      path: path.join(dirPath, entry.name),
      type: entry.isDirectory() ? 'directory' : 'file',
    }));
  });

  ipcMain.handle(IPC_CHANNELS.FILE_DELETE, async (_event, filePath: string) => {
    await fs.rm(filePath, { recursive: true });
  });

  ipcMain.handle(IPC_CHANNELS.FILE_RENAME, async (_event, oldPath: string, newPath: string) => {
    await fs.rename(oldPath, newPath);
  });

  ipcMain.handle(IPC_CHANNELS.FILE_CREATE, async (_event, filePath: string, isDirectory: boolean) => {
    if (isDirectory) {
      await fs.mkdir(filePath, { recursive: true });
    } else {
      await fs.writeFile(filePath, '', 'utf-8');
    }
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FOLDER, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
    });
    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_event, defaultPath: string) => {
    const result = await dialog.showSaveDialog({ defaultPath });
    return result.canceled ? null : result.filePath;
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (_event) => {
    _mainWindow.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_MAXIMIZE, (_event) => {
    if (_mainWindow.isMaximized()) {
      _mainWindow.unmaximize();
    } else {
      _mainWindow.maximize();
    }
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (_event) => {
    _mainWindow.close();
  });
}
