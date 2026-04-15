export const darkPlusTheme = {
  name: 'Dark+',
  type: 'dark' as const,
  colors: {
    // Editor
    'editor.background': '#1e1e1e',
    'editor.foreground': '#d4d4d4',
    'editor.lineHighlightBackground': '#2a2d2e',
    'editor.selectionBackground': '#264f78',
    'editor.inactiveSelectionBackground': '#3a3d41',
    'editor.findMatchBackground': '#515c6a',
    'editor.findMatchHighlightBackground': '#ea5c0055',
    'editor.wordHighlightBackground': '#575757b8',
    'editor.wordHighlightStrongBackground': '#004972b8',
    'editorCursor.foreground': '#aeafad',
    'editorWhitespace.foreground': '#e3e4e229',
    'editorIndentGuide.background': '#404040',
    'editorIndentGuide.activeBackground': '#707070',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
    'editorBracketMatch.background': '#0064001a',
    'editorBracketMatch.border': '#888888',
    'editorGutter.addedBackground': '#587c0c',
    'editorGutter.modifiedBackground': '#0c7d9d',
    'editorGutter.deletedBackground': '#94151b',

    // Sidebar
    'sideBar.background': '#252526',
    'sideBar.foreground': '#cccccc',
    'sideBar.border': '#00000000',
    'sideBarTitle.foreground': '#bbbbbb',
    'sideBarSectionHeader.background': '#80808033',
    'sideBarSectionHeader.foreground': '#bbbbbb',

    // Activity Bar
    'activityBar.background': '#333333',
    'activityBar.foreground': '#ffffff',
    'activityBar.inactiveForeground': '#ffffff66',
    'activityBar.border': '#00000000',
    'activityBarBadge.background': '#007acc',
    'activityBarBadge.foreground': '#ffffff',

    // Title Bar
    'titleBar.activeBackground': '#3c3c3c',
    'titleBar.activeForeground': '#cccccc',
    'titleBar.inactiveBackground': '#3c3c3c99',
    'titleBar.inactiveForeground': '#cccccc99',
    'titleBar.border': '#00000000',

    // Tabs
    'tab.activeBackground': '#1e1e1e',
    'tab.activeForeground': '#ffffff',
    'tab.inactiveBackground': '#2d2d2d',
    'tab.inactiveForeground': '#ffffff80',
    'tab.border': '#252526',
    'tab.activeBorderTop': '#007acc',
    'tab.unfocusedActiveBorderTop': '#007acc70',
    'editorGroupHeader.tabsBackground': '#252526',
    'editorGroupHeader.tabsBorder': '#00000000',

    // Status Bar
    'statusBar.background': '#007acc',
    'statusBar.foreground': '#ffffff',
    'statusBar.border': '#00000000',
    'statusBar.noFolderBackground': '#68217a',
    'statusBar.debuggingBackground': '#cc6633',
    'statusBar.debuggingForeground': '#ffffff',
    'statusBarItem.hoverBackground': '#ffffff1f',
    'statusBarItem.prominentBackground': '#00000080',

    // Input
    'input.background': '#3c3c3c',
    'input.foreground': '#cccccc',
    'input.border': '#00000000',
    'input.placeholderForeground': '#a6a6a6',
    'inputOption.activeBorder': '#007acc',
    'inputOption.activeBackground': '#007acc40',

    // Dropdown
    'dropdown.background': '#3c3c3c',
    'dropdown.foreground': '#f0f0f0',
    'dropdown.border': '#3c3c3c',

    // List
    'list.activeSelectionBackground': '#04395e',
    'list.activeSelectionForeground': '#ffffff',
    'list.inactiveSelectionBackground': '#37373d',
    'list.inactiveSelectionForeground': '#ffffff',
    'list.hoverBackground': '#2a2d2e',
    'list.hoverForeground': '#ffffff',
    'list.focusBackground': '#04395e',
    'list.highlightForeground': '#18a3ff',

    // Scrollbar
    'scrollbar.shadow': '#000000',
    'scrollbarSlider.background': '#79797966',
    'scrollbarSlider.hoverBackground': '#646464b3',
    'scrollbarSlider.activeBackground': '#bfbfbf66',

    // Panel
    'panel.background': '#1e1e1e',
    'panel.border': '#80808059',
    'panelTitle.activeBorder': '#e7e7e7',
    'panelTitle.activeForeground': '#e7e7e7',
    'panelTitle.inactiveForeground': '#e7e7e799',

    // Terminal
    'terminal.background': '#1e1e1e',
    'terminal.foreground': '#cccccc',
    'terminal.ansiBlack': '#000000',
    'terminal.ansiRed': '#cd3131',
    'terminal.ansiGreen': '#0dbc79',
    'terminal.ansiYellow': '#e5e510',
    'terminal.ansiBlue': '#2472c8',
    'terminal.ansiMagenta': '#bc3fbc',
    'terminal.ansiCyan': '#11a8cd',
    'terminal.ansiWhite': '#e5e5e5',
    'terminal.ansiBrightBlack': '#666666',
    'terminal.ansiBrightRed': '#f14c4c',
    'terminal.ansiBrightGreen': '#23d18b',
    'terminal.ansiBrightYellow': '#f5f543',
    'terminal.ansiBrightBlue': '#3b8eea',
    'terminal.ansiBrightMagenta': '#d670d6',
    'terminal.ansiBrightCyan': '#29b8db',
    'terminal.ansiBrightWhite': '#e5e5e5',

    // Badge
    'badge.background': '#4d4d4d',
    'badge.foreground': '#ffffff',

    // Button
    'button.background': '#0e639c',
    'button.foreground': '#ffffff',
    'button.hoverBackground': '#1177bb',
    'button.secondaryBackground': '#3a3d41',
    'button.secondaryForeground': '#ffffff',
    'button.secondaryHoverBackground': '#45494e',

    // Notification
    'notifications.background': '#252526',
    'notifications.foreground': '#cccccc',
    'notifications.border': '#303031',

    // Minimap
    'minimap.findMatchHighlight': '#d18616ee',
    'minimap.selectionHighlight': '#264f7899',
    'minimapGutter.addedBackground': '#587c0c',
    'minimapGutter.modifiedBackground': '#0c7d9d',
    'minimapGutter.deletedBackground': '#94151b',

    // Breadcrumb
    'breadcrumb.foreground': '#cccccccc',
    'breadcrumb.focusForeground': '#e0e0e0',
    'breadcrumb.activeSelectionForeground': '#e0e0e0',
    'breadcrumbPicker.background': '#252526',

    // Git decoration
    'gitDecoration.addedResourceForeground': '#81b88b',
    'gitDecoration.modifiedResourceForeground': '#e2c08d',
    'gitDecoration.deletedResourceForeground': '#c74e39',
    'gitDecoration.untrackedResourceForeground': '#73c991',
    'gitDecoration.ignoredResourceForeground': '#8c8c8c',
    'gitDecoration.conflictingResourceForeground': '#e4676b',

    // Diff editor
    'diffEditor.insertedTextBackground': '#9bb95533',
    'diffEditor.removedTextBackground': '#ff000033',

    // General
    'focusBorder': '#007fd4',
    'foreground': '#cccccc',
    'widget.shadow': '#0000005c',
    'selection.background': '#264f78',
    'errorForeground': '#f48771',
    'icon.foreground': '#c5c5c5',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#6A9955' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#CE9178' } },
    { scope: ['constant.numeric'], settings: { foreground: '#B5CEA8' } },
    { scope: ['constant.language'], settings: { foreground: '#569CD6' } },
    { scope: ['constant.character', 'constant.other'], settings: { foreground: '#569CD6' } },
    { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: '#569CD6' } },
    { scope: ['keyword.control'], settings: { foreground: '#C586C0' } },
    { scope: ['keyword.operator'], settings: { foreground: '#D4D4D4' } },
    { scope: ['keyword.operator.new', 'keyword.operator.expression', 'keyword.operator.typeof'], settings: { foreground: '#569CD6' } },
    { scope: ['entity.name.type', 'entity.name.class'], settings: { foreground: '#4EC9B0' } },
    { scope: ['entity.name.function'], settings: { foreground: '#DCDCAA' } },
    { scope: ['entity.name.tag'], settings: { foreground: '#569CD6' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#9CDCFE' } },
    { scope: ['variable', 'variable.other'], settings: { foreground: '#9CDCFE' } },
    { scope: ['variable.language'], settings: { foreground: '#569CD6' } },
    { scope: ['variable.parameter'], settings: { foreground: '#9CDCFE' } },
    { scope: ['support.function'], settings: { foreground: '#DCDCAA' } },
    { scope: ['support.type', 'support.class'], settings: { foreground: '#4EC9B0' } },
    { scope: ['meta.type.annotation'], settings: { foreground: '#4EC9B0' } },
    { scope: ['punctuation'], settings: { foreground: '#D4D4D4' } },
    { scope: ['punctuation.definition.tag'], settings: { foreground: '#808080' } },
    { scope: ['meta.jsx.children', 'meta.tag.without-attributes'], settings: { foreground: '#D4D4D4' } },
    { scope: ['entity.other.inherited-class'], settings: { foreground: '#4EC9B0' } },
    { scope: ['markup.heading'], settings: { foreground: '#569CD6', fontStyle: 'bold' } },
    { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { scope: ['markup.inline.raw'], settings: { foreground: '#CE9178' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#F44747' } },
  ],
};
