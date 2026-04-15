import { estimateTokenCount, truncateToTokenLimit } from '../ai/tokenCounter';

export interface ContextFile {
  filePath: string;
  content: string;
  relevanceScore: number;
  reason: string;
}

export interface ContextSelectionOptions {
  maxTokens: number;
  maxFiles: number;
  currentFilePath: string;
  cursorLine?: number;
}

export function selectContext(
  files: Map<string, string>,
  dependencyGraph: Map<string, string[]>,
  query: string,
  options: ContextSelectionOptions
): ContextFile[] {
  const { maxTokens, maxFiles, currentFilePath, cursorLine } = options;
  const candidates: ContextFile[] = [];

  // 1. Current file always first (highest priority)
  const currentContent = files.get(currentFilePath);
  if (currentContent) {
    candidates.push({
      filePath: currentFilePath,
      content: currentContent,
      relevanceScore: 1.0,
      reason: 'current file',
    });
  }

  // 2. Direct imports of current file
  const directDeps = dependencyGraph.get(currentFilePath) || [];
  for (const depPath of directDeps) {
    const content = files.get(depPath);
    if (content) {
      candidates.push({
        filePath: depPath,
        content,
        relevanceScore: 0.8,
        reason: 'imported by current file',
      });
    }
  }

  // 3. Files that import current file (reverse dependencies)
  for (const [filePath, deps] of dependencyGraph.entries()) {
    if (filePath === currentFilePath) continue;
    if (deps.includes(currentFilePath)) {
      const content = files.get(filePath);
      if (content && !candidates.some((c) => c.filePath === filePath)) {
        candidates.push({
          filePath,
          content,
          relevanceScore: 0.6,
          reason: 'imports current file',
        });
      }
    }
  }

  // 4. Same directory files
  const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
  for (const [filePath, content] of files.entries()) {
    if (filePath === currentFilePath) continue;
    if (candidates.some((c) => c.filePath === filePath)) continue;

    const fileDir = filePath.substring(0, filePath.lastIndexOf('/'));
    if (fileDir === currentDir) {
      candidates.push({
        filePath,
        content,
        relevanceScore: 0.4,
        reason: 'same directory',
      });
    }
  }

  // 5. Keyword matching against query
  if (query) {
    const queryTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    for (const [filePath, content] of files.entries()) {
      if (candidates.some((c) => c.filePath === filePath)) continue;

      const contentLower = content.toLowerCase();
      let matchScore = 0;
      for (const term of queryTerms) {
        if (contentLower.includes(term)) matchScore++;
      }

      if (queryTerms.length > 0 && matchScore > 0) {
        const score = 0.3 * (matchScore / queryTerms.length);
        candidates.push({
          filePath,
          content,
          relevanceScore: score,
          reason: 'keyword match',
        });
      }
    }
  }

  // Sort by relevance
  candidates.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Fit within token budget
  const selected: ContextFile[] = [];
  let tokenBudget = maxTokens;

  for (const candidate of candidates) {
    if (selected.length >= maxFiles) break;

    const tokens = estimateTokenCount(candidate.content);
    if (tokens <= tokenBudget) {
      selected.push(candidate);
      tokenBudget -= tokens;
    } else if (tokenBudget > 200) {
      // Truncate large files to fit
      selected.push({
        ...candidate,
        content: truncateToTokenLimit(candidate.content, tokenBudget - 50),
      });
      break;
    }
  }

  return selected;
}

export function formatContextForPrompt(contextFiles: ContextFile[]): string {
  return contextFiles
    .map(
      (cf) =>
        `--- ${cf.filePath} (${cf.reason}) ---\n${cf.content}\n--- end ${cf.filePath} ---`
    )
    .join('\n\n');
}
