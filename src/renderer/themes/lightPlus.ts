export const lightPlusTheme = {
  name: 'Light+',
  type: 'light' as const,
  colors: {
    // Editor
    'editor.background': '#ffffff',
    'editor.foreground': '#000000',
    'editor.lineHighlightBackground': '#f5f5f5',
    'editor.selectionBackground': '#add6ff',
    'editor.inactiveSelectionBackground': '#e5ebf1',
    'editor.findMatchBackground': '#a8ac94',
    'editor.findMatchHighlightBackground': '#ea5c0055',
    'editor.wordHighlightBackground': '#57575740',
    'editor.wordHighlightStrongBackground': '#0064001a',
    'editorCursor.foreground': '#000000',
    'editorWhitespace.foreground': '#33333333',
    'editorIndentGuide.background': '#d3d3d3',
    'editorIndentGuide.activeBackground': '#939393',
    'editorLineNumber.foreground': '#237893',
    'editorLineNumber.activeForeground': '#0b216f',
    'editorBracketMatch.background': '#0064001a',
    'editorBracketMatch.border': '#b9b9b9',
    'editorGutter.addedBackground': '#81b88b',
    'editorGutter.modifiedBackground': '#66afe0',
    'editorGutter.deletedBackground': '#ca4b51',

    // Sidebar
    'sideBar.background': '#f3f3f3',
    'sideBar.foreground': '#616161',
    'sideBar.border': '#00000000',
    'sideBarTitle.foreground': '#6f6f6f',
    'sideBarSectionHeader.background': '#80808033',
    'sideBarSectionHeader.foreground': '#616161',

    // Activity Bar
    'activityBar.background': '#2c2c2c',
    'activityBar.foreground': '#ffffff',
    'activityBar.inactiveForeground': '#ffffff66',
    'activityBar.border': '#00000000',
    'activityBarBadge.background': '#007acc',
    'activityBarBadge.foreground': '#ffffff',

    // Title Bar
    'titleBar.activeBackground': '#dddddd',
    'titleBar.activeForeground': '#333333',
    'titleBar.inactiveBackground': '#dddddd99',
    'titleBar.inactiveForeground': '#33333399',
    'titleBar.border': '#00000000',

    // Tabs
    'tab.activeBackground': '#ffffff',
    'tab.activeForeground': '#333333',
    'tab.inactiveBackground': '#ececec',
    'tab.inactiveForeground': '#33333380',
    'tab.border': '#f3f3f3',
    'tab.activeBorderTop': '#007acc',
    'tab.unfocusedActiveBorderTop': '#007acc70',
    'editorGroupHeader.tabsBackground': '#f3f3f3',
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
    'input.background': '#ffffff',
    'input.foreground': '#616161',
    'input.border': '#cecece',
    'input.placeholderForeground': '#767676',
    'inputOption.activeBorder': '#007acc',
    'inputOption.activeBackground': '#007acc40',

    // Dropdown
    'dropdown.background': '#ffffff',
    'dropdown.foreground': '#616161',
    'dropdown.border': '#cecece',

    // List
    'list.activeSelectionBackground': '#0060c0',
    'list.activeSelectionForeground': '#ffffff',
    'list.inactiveSelectionBackground': '#e4e6f1',
    'list.inactiveSelectionForeground': '#000000',
    'list.hoverBackground': '#e8e8e8',
    'list.hoverForeground': '#000000',
    'list.focusBackground': '#d6ebff',
    'list.highlightForeground': '#0066bf',

    // Scrollbar
    'scrollbar.shadow': '#dddddd',
    'scrollbarSlider.background': '#64646466',
    'scrollbarSlider.hoverBackground': '#646464b3',
    'scrollbarSlider.activeBackground': '#00000099',

    // Panel
    'panel.background': '#ffffff',
    'panel.border': '#80808059',
    'panelTitle.activeBorder': '#424242',
    'panelTitle.activeForeground': '#424242',
    'panelTitle.inactiveForeground': '#42424299',

    // Terminal
    'terminal.background': '#ffffff',
    'terminal.foreground': '#333333',
    'terminal.ansiBlack': '#000000',
    'terminal.ansiRed': '#cd3131',
    'terminal.ansiGreen': '#00bc00',
    'terminal.ansiYellow': '#949800',
    'terminal.ansiBlue': '#0451a5',
    'terminal.ansiMagenta': '#bc05bc',
    'terminal.ansiCyan': '#0598bc',
    'terminal.ansiWhite': '#555555',
    'terminal.ansiBrightBlack': '#666666',
    'terminal.ansiBrightRed': '#cd3131',
    'terminal.ansiBrightGreen': '#14ce14',
    'terminal.ansiBrightYellow': '#b5ba00',
    'terminal.ansiBrightBlue': '#0451a5',
    'terminal.ansiBrightMagenta': '#bc05bc',
    'terminal.ansiBrightCyan': '#0598bc',
    'terminal.ansiBrightWhite': '#a5a5a5',

    // Badge
    'badge.background': '#c4c4c4',
    'badge.foreground': '#333333',

    // Button
    'button.background': '#007acc',
    'button.foreground': '#ffffff',
    'button.hoverBackground': '#0062a3',
    'button.secondaryBackground': '#5f6a79',
    'button.secondaryForeground': '#ffffff',
    'button.secondaryHoverBackground': '#4c5565',

    // Notification
    'notifications.background': '#ffffff',
    'notifications.foreground': '#616161',
    'notifications.border': '#e8e8e8',

    // Minimap
    'minimap.findMatchHighlight': '#d18616ee',
    'minimap.selectionHighlight': '#add6ff99',
    'minimapGutter.addedBackground': '#81b88b',
    'minimapGutter.modifiedBackground': '#66afe0',
    'minimapGutter.deletedBackground': '#ca4b51',

    // Breadcrumb
    'breadcrumb.foreground': '#616161cc',
    'breadcrumb.focusForeground': '#2e2e2e',
    'breadcrumb.activeSelectionForeground': '#2e2e2e',
    'breadcrumbPicker.background': '#f3f3f3',

    // Git decoration
    'gitDecoration.addedResourceForeground': '#587c0c',
    'gitDecoration.modifiedResourceForeground': '#895503',
    'gitDecoration.deletedResourceForeground': '#ad0707',
    'gitDecoration.untrackedResourceForeground': '#007100',
    'gitDecoration.ignoredResourceForeground': '#8e8e90',
    'gitDecoration.conflictingResourceForeground': '#6c6cc4',

    // Diff editor
    'diffEditor.insertedTextBackground': '#9bb95533',
    'diffEditor.removedTextBackground': '#ff000033',

    // General
    'focusBorder': '#0090f1',
    'foreground': '#616161',
    'widget.shadow': '#00000029',
    'selection.background': '#add6ff',
    'errorForeground': '#a1260d',
    'icon.foreground': '#424242',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#008000' } },
    { scope: ['string', 'string.quoted'], settings: { foreground: '#A31515' } },
    { scope: ['constant.numeric'], settings: { foreground: '#098658' } },
    { scope: ['constant.language'], settings: { foreground: '#0000FF' } },
    { scope: ['constant.character', 'constant.other'], settings: { foreground: '#0000FF' } },
    { scope: ['keyword', 'storage.type', 'storage.modifier'], settings: { foreground: '#0000FF' } },
    { scope: ['keyword.control'], settings: { foreground: '#AF00DB' } },
    { scope: ['keyword.operator'], settings: { foreground: '#000000' } },
    { scope: ['entity.name.type', 'entity.name.class'], settings: { foreground: '#267F99' } },
    { scope: ['entity.name.function'], settings: { foreground: '#795E26' } },
    { scope: ['entity.name.tag'], settings: { foreground: '#800000' } },
    { scope: ['entity.other.attribute-name'], settings: { foreground: '#FF0000' } },
    { scope: ['variable', 'variable.other'], settings: { foreground: '#001080' } },
    { scope: ['variable.language'], settings: { foreground: '#0000FF' } },
    { scope: ['support.function'], settings: { foreground: '#795E26' } },
    { scope: ['support.type', 'support.class'], settings: { foreground: '#267F99' } },
    { scope: ['meta.type.annotation'], settings: { foreground: '#267F99' } },
    { scope: ['punctuation'], settings: { foreground: '#000000' } },
    { scope: ['markup.heading'], settings: { foreground: '#0000FF', fontStyle: 'bold' } },
    { scope: ['markup.bold'], settings: { fontStyle: 'bold' } },
    { scope: ['markup.italic'], settings: { fontStyle: 'italic' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#CD3131' } },
  ],
};
