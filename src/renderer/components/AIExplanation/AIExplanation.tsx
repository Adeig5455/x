import React, { useState, useCallback } from 'react';

// ============================================================================
// AI Code Explanation Panel - Deep code analysis with context-aware explanations
// ============================================================================

export type ExplanationDepth = 'brief' | 'detailed' | 'expert';

export interface CodeSection {
  startLine: number;
  endLine: number;
  label: string;
  explanation: string;
  complexity?: 'simple' | 'moderate' | 'complex';
}

export interface AIExplanationData {
  id: string;
  code: string;
  language: string;
  filePath: string;
  summary: string;
  sections: CodeSection[];
  concepts: string[];
  complexity: {
    cyclomatic: number;
    cognitive: number;
    linesOfCode: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
  };
  suggestions?: string[];
  relatedDocs?: Array<{ title: string; url: string }>;
  timestamp: number;
}

interface AIExplanationProps {
  explanation: AIExplanationData | null;
  isLoading: boolean;
  streamingText?: string;
  onRequestExplanation: (code: string, depth: ExplanationDepth) => void;
  onClose: () => void;
  onCopyExplanation: () => void;
  onJumpToLine: (line: number) => void;
}

const GRADE_COLORS: Record<string, string> = {
  A: '#4ec9b0', B: '#b5cea8', C: '#cca700', D: '#ce9178', F: '#f44747',
};

const COMPLEXITY_COLORS: Record<string, string> = {
  simple: '#4ec9b0', moderate: '#cca700', complex: '#f44747',
};

export const AIExplanation: React.FC<AIExplanationProps> = ({
  explanation,
  isLoading,
  streamingText,
  onRequestExplanation,
  onClose,
  onCopyExplanation,
  onJumpToLine,
}) => {
  const [depth, setDepth] = useState<ExplanationDepth>('detailed');
  const [activeTab, setActiveTab] = useState<'explanation' | 'complexity' | 'suggestions'>('explanation');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const toggleSection = useCallback((idx: number) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: 14 }}>💡</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>AI Explanation</span>
        <div style={{ flex: 1 }} />

        {/* Depth selector */}
        {(['brief', 'detailed', 'expert'] as ExplanationDepth[]).map((d) => (
          <button
            key={d}
            onClick={() => setDepth(d)}
            style={{
              padding: '2px 8px', borderRadius: 10, border: 'none', fontSize: 10, cursor: 'pointer',
              textTransform: 'capitalize',
              background: depth === d ? 'var(--accent-color)' : 'transparent',
              color: depth === d ? '#fff' : 'var(--text-secondary)',
            }}
          >
            {d}
          </button>
        ))}

        <button onClick={onCopyExplanation} title="Copy explanation" style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11,
        }}>📋</button>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 14,
        }}>×</button>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div style={{ padding: 16 }}>
          {streamingText ? (
            <div style={{
              fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {streamingText}
              <span style={{ color: 'var(--accent-color)' }}>▊</span>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--accent-color)', fontSize: 12 }}>
              Analyzing code...
            </div>
          )}
        </div>
      )}

      {/* Content */}
      {explanation && !isLoading && (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
            {(['explanation', 'complexity', 'suggestions'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1, padding: '6px', border: 'none', fontSize: 11, cursor: 'pointer',
                  textTransform: 'capitalize', fontWeight: activeTab === tab ? 600 : 400,
                  background: activeTab === tab ? 'var(--bg-active)' : 'transparent',
                  color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
            {/* Explanation tab */}
            {activeTab === 'explanation' && (
              <div>
                {/* Summary */}
                <div style={{
                  padding: 10, background: 'var(--bg-secondary)', borderRadius: 6,
                  marginBottom: 12, border: '1px solid var(--border-color)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>
                    Summary
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.7 }}>
                    {explanation.summary}
                  </div>
                </div>

                {/* Concepts */}
                {explanation.concepts.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>
                      Key Concepts
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {explanation.concepts.map((concept) => (
                        <span key={concept} style={{
                          padding: '2px 8px', borderRadius: 10, fontSize: 10,
                          background: 'rgba(55,148,255,0.1)', color: '#3794ff',
                          border: '1px solid rgba(55,148,255,0.2)',
                        }}>{concept}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sections */}
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>
                  Code Sections
                </div>
                {explanation.sections.map((section, i) => (
                  <div key={i} style={{
                    marginBottom: 6, border: '1px solid var(--border-color)',
                    borderRadius: 4, overflow: 'hidden',
                  }}>
                    <div
                      onClick={() => toggleSection(i)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px',
                        cursor: 'pointer', background: 'var(--bg-secondary)',
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
                      onMouseOut={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
                    >
                      <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>
                        {expandedSections.has(i) ? '▼' : '▶'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500, flex: 1 }}>
                        {section.label}
                      </span>
                      {section.complexity && (
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 3,
                          background: `${COMPLEXITY_COLORS[section.complexity]}22`,
                          color: COMPLEXITY_COLORS[section.complexity],
                        }}>{section.complexity}</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); onJumpToLine(section.startLine); }}
                        style={{
                          background: 'none', border: 'none', color: 'var(--text-secondary)',
                          cursor: 'pointer', fontSize: 10, fontFamily: 'monospace',
                        }}
                      >
                        L{section.startLine}-{section.endLine}
                      </button>
                    </div>
                    {expandedSections.has(i) && (
                      <div style={{
                        padding: '8px 8px 8px 22px', fontSize: 12, color: 'var(--text-primary)',
                        lineHeight: 1.7, background: 'var(--bg-primary)',
                      }}>
                        {section.explanation}
                      </div>
                    )}
                  </div>
                ))}

                {/* Related docs */}
                {explanation.relatedDocs && explanation.relatedDocs.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4, textTransform: 'uppercase' }}>
                      Related Documentation
                    </div>
                    {explanation.relatedDocs.map((doc) => (
                      <div key={doc.url} style={{ fontSize: 11, color: 'var(--accent-color)', cursor: 'pointer', padding: '2px 0' }}>
                        📄 {doc.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Complexity tab */}
            {activeTab === 'complexity' && (
              <div>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 24, gap: 16,
                }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: 40,
                    background: `${GRADE_COLORS[explanation.complexity.grade]}15`,
                    border: `3px solid ${GRADE_COLORS[explanation.complexity.grade]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 36, fontWeight: 700,
                    color: GRADE_COLORS[explanation.complexity.grade],
                  }}>
                    {explanation.complexity.grade}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                  {[
                    { label: 'Cyclomatic', value: explanation.complexity.cyclomatic, max: 20 },
                    { label: 'Cognitive', value: explanation.complexity.cognitive, max: 25 },
                    { label: 'Lines of Code', value: explanation.complexity.linesOfCode, max: 100 },
                  ].map((metric) => {
                    const pct = Math.min(100, (metric.value / metric.max) * 100);
                    const color = pct < 40 ? '#4ec9b0' : pct < 70 ? '#cca700' : '#f44747';
                    return (
                      <div key={metric.label} style={{
                        padding: 10, background: 'var(--bg-secondary)', borderRadius: 6,
                        border: '1px solid var(--border-color)', textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 20, fontWeight: 700, color, marginBottom: 4 }}>
                          {metric.value}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4 }}>
                          {metric.label}
                        </div>
                        <div style={{
                          height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden',
                        }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Suggestions tab */}
            {activeTab === 'suggestions' && (
              <div>
                {explanation.suggestions && explanation.suggestions.length > 0 ? (
                  explanation.suggestions.map((suggestion, i) => (
                    <div key={i} style={{
                      padding: '8px 10px', marginBottom: 6,
                      background: 'var(--bg-secondary)', borderRadius: 4,
                      border: '1px solid var(--border-color)',
                      fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.6,
                    }}>
                      <span style={{ color: '#cca700', marginRight: 6 }}>💡</span>
                      {suggestion}
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 12 }}>
                    No suggestions available
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: '3px 10px', borderTop: '1px solid var(--border-color)',
            fontSize: 10, color: 'var(--text-secondary)', display: 'flex', gap: 8,
          }}>
            <span>{explanation.language}</span>
            <span>{explanation.filePath}</span>
            <div style={{ flex: 1 }} />
            <span>{new Date(explanation.timestamp).toLocaleTimeString()}</span>
          </div>
        </>
      )}

      {/* Empty state */}
      {!explanation && !isLoading && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', padding: 32, color: 'var(--text-secondary)',
        }}>
          <span style={{ fontSize: 36, marginBottom: 12 }}>💡</span>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>
            AI Code Explanation
          </div>
          <div style={{ fontSize: 11, textAlign: 'center', lineHeight: 1.6 }}>
            Select code in the editor and press Ctrl+Shift+E to get an AI-powered explanation
          </div>
        </div>
      )}
    </div>
  );
};
