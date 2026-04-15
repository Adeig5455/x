# Cursor IDE

An AI-powered code editor built with Electron, TypeScript, React, and Monaco Editor.

## Features

- **Monaco Editor** - Full-featured code editor with syntax highlighting, IntelliSense, and more
- **AI Chat** - Side panel for conversational AI assistance
- **AI Autocomplete** - Inline AI-powered code suggestions
- **AI Command (Ctrl+K)** - Quick AI edits inline
- **File Explorer** - Full file tree with create, rename, delete operations
- **Integrated Terminal** - Built-in terminal emulator
- **Git Integration** - Source control panel with staging, commits, branches
- **Search & Replace** - Project-wide search with regex support
- **Themes** - Dark and light theme support
- **Keyboard Shortcuts** - Fully customizable keybindings
- **Command Palette** - Quick access to all commands
- **Settings** - Comprehensive settings panel
- **Minimap & Breadcrumbs** - Navigation aids

## Tech Stack

- **Electron** - Desktop application framework
- **TypeScript** - Type-safe JavaScript
- **React 18** - UI framework
- **Monaco Editor** - Code editor component (from VS Code)
- **Zustand** - State management
- **xterm.js** - Terminal emulator
- **simple-git** - Git operations
- **Webpack** - Build tooling

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
npm start
```

### Testing

```bash
npm test
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Project Structure

```
src/
├── main/                    # Electron main process
│   ├── index.ts            # App entry point
│   ├── window.ts           # Window management
│   └── ipc.ts              # IPC handlers
├── renderer/               # React renderer process
│   ├── components/
│   │   ├── Editor/         # Monaco editor integration
│   │   ├── FileExplorer/   # File tree sidebar
│   │   ├── Tabs/           # Editor tab management
│   │   ├── AIChat/         # AI chat panel
│   │   ├── AIAutocomplete/ # Inline AI suggestions
│   │   ├── CommandPalette/ # Command palette (Ctrl+P)
│   │   ├── Terminal/       # Integrated terminal
│   │   ├── Search/         # Search & replace
│   │   ├── GitPanel/       # Git source control
│   │   ├── ActivityBar/    # Left sidebar icons
│   │   ├── StatusBar/      # Bottom status bar
│   │   ├── Settings/       # Settings panel
│   │   ├── Breadcrumbs/    # Path breadcrumbs
│   │   ├── Minimap/        # Editor minimap
│   │   └── Welcome/        # Welcome/onboarding page
│   ├── store/              # Zustand state management
│   ├── themes/             # Theme definitions
│   └── styles/             # Global CSS styles
├── services/
│   ├── ai/                 # AI API integration
│   ├── context/            # Code context engine
│   └── keybindings/        # Keyboard shortcut service
└── shared/
    ├── types/              # Shared TypeScript types
    └── utils/              # Shared utility functions
```

## License

MIT
