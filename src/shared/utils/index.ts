import path from 'path';

export function getLanguageFromFilePath(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.md': 'markdown',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.sql': 'sql',
    '.sh': 'shell',
    '.bash': 'shell',
    '.xml': 'xml',
    '.toml': 'toml',
    '.ini': 'ini',
    '.env': 'dotenv',
  };
  return languageMap[ext] || 'plaintext';
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle<T extends (...args: unknown[]) => void>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

export function truncatePath(filePath: string, maxLength: number = 50): string {
  if (filePath.length <= maxLength) return filePath;
  const parts = filePath.split(path.sep);
  if (parts.length <= 2) return filePath;
  return `...${path.sep}${parts.slice(-2).join(path.sep)}`;
}

export function getFileIcon(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const iconMap: Record<string, string> = {
    '.ts': '📘', '.tsx': '⚛️', '.js': '📒', '.jsx': '⚛️',
    '.py': '🐍', '.java': '☕', '.go': '🔵', '.rs': '🦀',
    '.html': '🌐', '.css': '🎨', '.json': '📋', '.md': '📝',
    '.yaml': '⚙️', '.yml': '⚙️', '.sql': '🗃️', '.sh': '🖥️',
  };
  return iconMap[ext] || '📄';
}
