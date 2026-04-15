import React, { useState, useCallback } from 'react';

// ============================================================================
// Enhanced Status Bar - git info, language picker, encoding, line/col, notifications
// ============================================================================

interface StatusBarProps {
  currentBranch: string;
  aheadCount?: number;
  behindCount?: number;
  isSyncing?: boolean;
  activeFileName?: string;
  language?: string;
  lineNumber?: number;
  columnNumber?: number;
  tabSize?: number;
  encoding?: string;
  eol?: 'LF' | 'CRLF';
  indentMode?: 'spaces' | 'tabs';
  errorCount?: number;
  warningCount?: number;
  infoCount?: number;
  isGitRepo?: boolean;
  onBranchClick?: () => void;
  onLanguageClick?: () => void;
  onEncodingClick?: () => void;
  onEolClick?: () => void;
  onIndentClick?: () => void;
  onLineColClick?: () => void;
  onErrorsClick?: () => void;
  onNotificationClick?: () => void;
  feedbackText?: string;
}

interface StatusBarItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  side: 'left' | 'right';
}

const StatusBarItem: React.FC<StatusBarItemProps> = ({ children, onClick, title }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '0 6px',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        background: hovered && onClick ? 'rgba(255,255,255,0.12)' : 'transparent',
        fontSize: 12,
        whiteSpace: 'nowrap',
        transition: 'background 0.1s',
      }}
    >
      {children}
    </div>
  );
};

export const StatusBar: React.FC<StatusBarProps> = ({
  currentBranch,
  aheadCount = 0,
  behindCount = 0,
  isSyncing = false,
  language = '',
  lineNumber = 1,
  columnNumber = 1,
  tabSize = 2,
  encoding = 'UTF-8',
  eol = 'LF',
  indentMode = 'spaces',
  errorCount = 0,
  warningCount = 0,
  isGitRepo = true,
  onBranchClick,
  onLanguageClick,
  onEncodingClick,
  onEolClick,
  onIndentClick,
  onLineColClick,
  onErrorsClick,
  onNotificationClick,
  feedbackText,
}) => {

  return (
    <div style={{
      height: 22,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--statusbar-background, #007acc)',
      color: 'var(--statusbar-foreground, #fff)',
      fontSize: 12,
      flexShrink: 0,
      borderTop: '1px solid var(--statusbar-border, transparent)',
      overflow: 'hidden',
    }}>
      {/* Left section */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
        {/* Git branch */}
        {isGitRepo && (
          <StatusBarItem onClick={onBranchClick} title="Checkout branch" side="left">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
              <path d="M14 12.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm-3-1.29a2.5 2.5 0 100 2.58V14a2 2 0 01-2 2H7a2 2 0 01-2-2v-1.21a2.5 2.5 0 100-2.58V5.79a2.5 2.5 0 100-2.58V2a2 2 0 012-2h2a2 2 0 012 2v1.21zM5 3.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0zM5 12.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z"/>
            </svg>
            <span>{currentBranch}</span>
            {(aheadCount > 0 || behindCount > 0) && (
              <span style={{ opacity: 0.8 }}>
                {aheadCount > 0 && `${aheadCount}↑`}
                {behindCount > 0 && `${behindCount}↓`}
              </span>
            )}
            {isSyncing && <span style={{ opacity: 0.7 }}>syncing...</span>}
          </StatusBarItem>
        )}

        {/* Errors and warnings */}
        <StatusBarItem onClick={onErrorsClick} title="View problems" side="left">
          {errorCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="6"/></svg>
              {errorCount}
            </span>
          )}
          {warningCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l7 14H1L8 1z"/></svg>
              {warningCount}
            </span>
          )}
          {errorCount === 0 && warningCount === 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor"><path d="M8 16A8 8 0 108 0a8 8 0 000 16zm3.78-9.72a.75.75 0 00-1.06-1.06L7.25 8.69 5.28 6.72a.75.75 0 00-1.06 1.06l2.5 2.5a.75.75 0 001.06 0l4-4z"/></svg>
              0
            </span>
          )}
        </StatusBarItem>

        {/* Feedback text */}
        {feedbackText && (
          <StatusBarItem side="left">
            <span style={{ opacity: 0.8 }}>{feedbackText}</span>
          </StatusBarItem>
        )}
      </div>

      {/* Right section */}
      <div style={{ display: 'flex', alignItems: 'center', height: '100%', overflow: 'hidden' }}>
        {/* Line:Col */}
        <StatusBarItem onClick={onLineColClick} title="Go to line" side="right">
          Ln {lineNumber}, Col {columnNumber}
        </StatusBarItem>

        {/* Indent */}
        <StatusBarItem onClick={onIndentClick} title="Select indentation" side="right">
          {indentMode === 'spaces' ? `Spaces: ${tabSize}` : `Tab Size: ${tabSize}`}
        </StatusBarItem>

        {/* Encoding */}
        <StatusBarItem onClick={onEncodingClick} title="Select encoding" side="right">
          {encoding}
        </StatusBarItem>

        {/* EOL */}
        <StatusBarItem onClick={onEolClick} title="Select end of line sequence" side="right">
          {eol}
        </StatusBarItem>

        {/* Language */}
        {language && (
          <StatusBarItem onClick={onLanguageClick} title="Select language mode" side="right">
            {language}
          </StatusBarItem>
        )}

        {/* Notifications bell */}
        <StatusBarItem onClick={onNotificationClick} title="Notifications" side="right">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 16a2 2 0 002-2H6a2 2 0 002 2zM8 1.918l-.797.161A4.002 4.002 0 004 6c0 .628-.134 2.197-.459 3.742-.16.767-.376 1.566-.663 2.258h10.244c-.287-.692-.502-1.49-.663-2.258C12.134 8.197 12 6.628 12 6a4.002 4.002 0 00-3.203-3.92L8 1.917zM14.22 12c.223.447.481.801.78 1H1c.299-.199.557-.553.78-1C2.68 10.2 3 6.88 3 6c0-2.42 1.72-4.44 4.005-4.901a1 1 0 111.99 0A5.002 5.002 0 0113 6c0 .88.32 4.2 1.22 6z"/>
          </svg>
        </StatusBarItem>
      </div>
    </div>
  );
};
