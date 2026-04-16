// SVG path data for file type icons
// Based on vscode-icons and material-icon-theme

export interface FileIconConfig {
  color: string;
  path: string;
}

const FILE_ICONS: Record<string, FileIconConfig> = {
  // Languages
  typescript: {
    color: '#3178c6',
    path: 'M0 12v12h24V12H0zm19.3 9.8c.4.8.8 1.3 1.5 1.7.7.3 1.5.5 2.4.5 1 0 1.8-.2 2.4-.7.6-.5.9-1.1.9-1.9 0-.6-.1-1-.4-1.4-.3-.4-.7-.7-1.2-.9-.5-.2-1.2-.4-2-.6-.6-.1-1-.3-1.2-.4-.2-.1-.3-.3-.3-.6 0-.3.1-.5.3-.6.2-.2.5-.2.9-.2.4 0 .8.1 1 .3.2.2.4.5.5.9l1.7-.4c-.2-.7-.5-1.3-1.1-1.7-.6-.4-1.3-.6-2.1-.6-1 0-1.7.2-2.3.7-.6.5-.9 1.1-.9 1.8 0 .5.1.9.3 1.3.2.4.6.7 1 .9.5.2 1.1.4 1.9.6.6.1 1.1.3 1.3.4.2.2.3.4.3.7 0 .3-.1.5-.4.7-.3.2-.6.3-1 .3-.5 0-.9-.1-1.2-.4-.3-.3-.5-.6-.6-1.1l-1.7.4z',
  },
  javascript: {
    color: '#f1e05a',
    path: 'M0 0h24v24H0V0zm3 21l1.5-1.8c.5.7 1 1.2 2 1.2.8 0 1.3-.3 1.3-1.5V12h2.4v7c0 2.2-1.3 3.2-3.3 3.2-1.8 0-2.8-.9-3.4-2l-.5.8zM13 20.5c.7.9 1.5 1.5 3 1.5 1.3 0 2.1-.6 2.1-1.5 0-1-.8-1.4-2.2-2l-.8-.3c-2.2-.9-3.6-2.1-3.6-4.5 0-2.2 1.7-3.9 4.4-3.9 1.9 0 3.3.7 4.2 2.4l-2.3 1.5c-.5-.9-1-1.3-1.9-1.3-.9 0-1.4.5-1.4 1.2 0 .8.5 1.2 1.7 1.7l.8.3c2.5 1.1 3.9 2.2 3.9 4.6 0 2.7-2.1 4.1-4.9 4.1-2.7 0-4.5-1.3-5.4-3l2.4-1.2z',
  },
  python: {
    color: '#3572A5',
    path: 'M12 2C6.5 2 7 4.2 7 4.2l.01 2.3H12v.7H4.5S2 6.8 2 12.3c0 5.5 2.2 5.3 2.2 5.3h1.3v-2.5s-.1-2.2 2.2-2.2h3.8s2.1 0 2.1-2v-3.5S14 2 12 2zM9.1 3.8c.4 0 .7.3.7.7s-.3.7-.7.7-.7-.3-.7-.7.3-.7.7-.7z',
  },
  rust: {
    color: '#dea584',
    path: 'M12 2L3 7v10l9 5 9-5V7l-9-5zm-1 14H8v-2h3v-2H8V8h3v2h2V8h3v4h-3v2h3v2h-3v-2h-2v2z',
  },
  go: {
    color: '#00ADD8',
    path: 'M1.8 8.7c-.1-.2 0-.3.1-.3.1 0 .2 0 .3.1.2.2.5.3.8.3.3 0 .6-.1.8-.4.2-.3.3-.6.3-1 0-.4-.1-.7-.3-1-.2-.3-.5-.4-.8-.4-.3 0-.5.1-.7.3-.1.1-.2.1-.3 0-.1-.1-.1-.2 0-.3.2-.3.5-.5.9-.5.5 0 .9.2 1.2.6.3.4.4.8.4 1.3s-.1.9-.4 1.3c-.3.4-.7.6-1.2.6-.4 0-.7-.2-.9-.5-.1-.1 0-.2 0-.1zM6 8c0 .6-.2 1.1-.5 1.5-.3.4-.8.6-1.3.6s-1-.2-1.3-.6C2.5 9.1 2.4 8.6 2.4 8s.2-1.1.5-1.5C3.2 6.2 3.7 6 4.2 6s1 .2 1.3.5c.3.4.5.9.5 1.5z',
  },
  html: {
    color: '#e34c26',
    path: 'M1.5 0h21l-1.9 21.6L12 24l-8.6-2.4L1.5 0zm7.7 9.7l-.2-2.3h8l.2-2.3H5.2l.6 6.9h7.4l-.3 3.2-1.9.5-1.9-.5-.1-1.5H6.7l.3 3.2 5 1.4 5-1.4.6-7.2H9.2z',
  },
  css: {
    color: '#563d7c',
    path: 'M1.5 0h21l-1.9 21.6L12 24l-8.6-2.4L1.5 0zM17 4.7H7l.2 2.3h7.5l-.3 3.2H9.5l.2 2.3h4.8L14 16.3l-2 .5-2-.5-.1-1.5H7.5l.3 3.2 4.2 1.2 4.2-1.2.8-9.8H7.2l-.2-2.3H17V4.7z',
  },
  json: {
    color: '#292929',
    path: 'M5 3h2v2H5v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5h2v2H5c-1.1 0-2-.9-2-2v-4c0-.6-.4-1-1-1H1v-2h1c.6 0 1-.4 1-1V5c0-1.1.9-2 2-2zm14 0c1.1 0 2 .9 2 2v4c0 .6.4 1 1 1h1v2h-1c-.6 0-1 .4-1 1v4c0 1.1-.9 2-2 2h-2v-2h2v-5a2 2 0 0 1 2-2 2 2 0 0 1-2-2V5h-2V3h2z',
  },
  markdown: {
    color: '#083fa1',
    path: 'M2 4h20v16H2V4zm2 2v12h16V6H4zm2 2h2l2 2.5L12 8h2v8h-2v-4.5l-2 2.5-2-2.5V16H6V8zm10 0h2l2.5 3L22 8h2v8h-2v-4.5l-2.5 3-2.5-3V16h-2V8z',
  },
  yaml: {
    color: '#cb171e',
    path: 'M2 2h20v20H2V2zm4 4v5l3-3 3 3V6h2v7l-5-5-5 5V6h2zm0 12h12v-2H6v2z',
  },
  docker: {
    color: '#384d54',
    path: 'M13.98 11.08h2.12a.19.19 0 0 0 .19-.19V9.01a.19.19 0 0 0-.19-.19h-2.12a.19.19 0 0 0-.18.19v1.88c0 .1.08.19.18.19m-2.95-5.43h2.12a.19.19 0 0 0 .18-.19V3.58a.19.19 0 0 0-.18-.19h-2.12a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19m0 2.71h2.12a.19.19 0 0 0 .18-.19V6.29a.19.19 0 0 0-.18-.19h-2.12a.19.19 0 0 0-.19.19v1.88c0 .1.09.19.19.19m-2.93 0h2.12a.19.19 0 0 0 .18-.19V6.29a.19.19 0 0 0-.18-.19H8.1a.19.19 0 0 0-.18.19v1.88c0 .1.08.19.18.19m-2.96 0h2.12a.19.19 0 0 0 .19-.19V6.29a.19.19 0 0 0-.19-.19H5.14a.19.19 0 0 0-.18.19v1.88c0 .1.08.19.18.19',
  },
  gitignore: {
    color: '#f05032',
    path: 'M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.08 1.85 1.24 1.85 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3',
  },
};

const FOLDER_ICONS: Record<string, FileIconConfig> = {
  src: { color: '#42a5f5', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  node_modules: { color: '#8bc34a', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  components: { color: '#7c4dff', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  hooks: { color: '#00bcd4', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  services: { color: '#ff7043', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  store: { color: '#ab47bc', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  tests: { color: '#66bb6a', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  __tests__: { color: '#66bb6a', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  dist: { color: '#ffa726', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  build: { color: '#ffa726', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  config: { color: '#78909c', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  public: { color: '#42a5f5', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  assets: { color: '#ef5350', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  styles: { color: '#ce93d8', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  themes: { color: '#ce93d8', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  utils: { color: '#78909c', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
  default: { color: '#90a4ae', path: 'M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z' },
};

const DEFAULT_FILE_ICON: FileIconConfig = {
  color: '#90a4ae',
  path: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z',
};

const EXTENSION_MAP: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.py': 'python',
  '.rs': 'rust',
  '.go': 'go',
  '.html': 'html',
  '.htm': 'html',
  '.css': 'css',
  '.scss': 'css',
  '.less': 'css',
  '.json': 'json',
  '.md': 'markdown',
  '.mdx': 'markdown',
  '.yml': 'yaml',
  '.yaml': 'yaml',
  '.dockerfile': 'docker',
  '.gitignore': 'gitignore',
};

const FILENAME_MAP: Record<string, string> = {
  'Dockerfile': 'docker',
  'docker-compose.yml': 'docker',
  'docker-compose.yaml': 'docker',
  '.gitignore': 'gitignore',
  '.gitattributes': 'gitignore',
  'tsconfig.json': 'typescript',
  'package.json': 'json',
  'package-lock.json': 'json',
  'README.md': 'markdown',
  'Cargo.toml': 'rust',
  'go.mod': 'go',
  'go.sum': 'go',
};

export function getFileIcon(fileName: string): FileIconConfig {
  // Check filename map first
  if (FILENAME_MAP[fileName]) {
    const iconName = FILENAME_MAP[fileName];
    return FILE_ICONS[iconName] || DEFAULT_FILE_ICON;
  }

  // Check extension
  const lastDot = fileName.lastIndexOf('.');
  if (lastDot !== -1) {
    const ext = fileName.slice(lastDot).toLowerCase();
    if (EXTENSION_MAP[ext]) {
      return FILE_ICONS[EXTENSION_MAP[ext]] || DEFAULT_FILE_ICON;
    }
  }

  return DEFAULT_FILE_ICON;
}

export function getFolderIcon(folderName: string): FileIconConfig {
  return FOLDER_ICONS[folderName.toLowerCase()] || FOLDER_ICONS.default;
}
