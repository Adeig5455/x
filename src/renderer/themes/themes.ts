export interface Theme {
  id: string;
  name: string;
  type: 'dark' | 'light';
  colors: Record<string, string>;
  editorColors: Record<string, string>;
}

export const darkTheme: Theme = {
  id: 'dark-default',
  name: 'Dark+ (Default)',
  type: 'dark',
  colors: {
    'bg-primary': '#1e1e1e',
    'bg-secondary': '#252526',
    'bg-tertiary': '#2d2d30',
    'bg-hover': '#2a2d2e',
    'bg-active': '#37373d',
    'text-primary': '#cccccc',
    'text-secondary': '#969696',
    'text-accent': '#569cd6',
    'border-color': '#3c3c3c',
    'accent-color': '#007acc',
    'accent-hover': '#1c8ad4',
    'error-color': '#f44747',
    'warning-color': '#cca700',
    'success-color': '#4ec9b0',
  },
  editorColors: {
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#2a2d2e',
    'editor.selectionBackground': '#264f78',
    'editorCursor.foreground': '#aeafad',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
  },
};

export const lightTheme: Theme = {
  id: 'light-default',
  name: 'Light+ (Default)',
  type: 'light',
  colors: {
    'bg-primary': '#ffffff',
    'bg-secondary': '#f3f3f3',
    'bg-tertiary': '#ececec',
    'bg-hover': '#e8e8e8',
    'bg-active': '#d4d4d4',
    'text-primary': '#333333',
    'text-secondary': '#666666',
    'text-accent': '#0066b8',
    'border-color': '#d4d4d4',
    'accent-color': '#007acc',
    'accent-hover': '#1c8ad4',
    'error-color': '#e51400',
    'warning-color': '#bf8803',
    'success-color': '#008000',
  },
  editorColors: {
    'editor.background': '#ffffff',
    'editor.foreground': '#333333',
    'editor.lineHighlightBackground': '#f0f0f0',
    'editor.selectionBackground': '#add6ff',
    'editorCursor.foreground': '#333333',
    'editorLineNumber.foreground': '#999999',
    'editorLineNumber.activeForeground': '#333333',
  },
};

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(theme.colors)) {
    root.style.setProperty(`--${key}`, value);
  }
  root.setAttribute('data-theme', theme.type);
}

export function getThemeById(id: string): Theme {
  switch (id) {
    case 'light-default':
      return lightTheme;
    case 'dark-default':
    default:
      return darkTheme;
  }
}

export const themes: Theme[] = [darkTheme, lightTheme];
