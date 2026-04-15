import type { FileNode } from '../../shared/types';

export interface CodeContext {
  filePath: string;
  content: string;
  language: string;
  relevanceScore: number;
}

export interface ContextOptions {
  maxFiles: number;
  maxTokens: number;
  includeImports: boolean;
  includeRelatedFiles: boolean;
}

export class ContextEngine {
  private fileIndex: Map<string, string> = new Map();

  async indexDirectory(dirPath: string): Promise<void> {
    // TODO: Recursively index files in directory
    console.log(`Indexing directory: ${dirPath}`);
  }

  async indexFile(filePath: string, content: string): Promise<void> {
    this.fileIndex.set(filePath, content);
  }

  removeFile(filePath: string): void {
    this.fileIndex.delete(filePath);
  }

  async getRelevantContext(
    query: string,
    currentFilePath: string,
    options: Partial<ContextOptions> = {}
  ): Promise<CodeContext[]> {
    const { maxFiles = 5, maxTokens: _maxTokens = 4000 } = options;

    const contexts: CodeContext[] = [];

    // Include current file first
    const currentContent = this.fileIndex.get(currentFilePath);
    if (currentContent) {
      contexts.push({
        filePath: currentFilePath,
        content: currentContent,
        language: this.detectLanguage(currentFilePath),
        relevanceScore: 1.0,
      });
    }

    // Simple keyword-based relevance scoring
    for (const [filePath, content] of this.fileIndex.entries()) {
      if (filePath === currentFilePath) continue;
      if (contexts.length >= maxFiles) break;

      const score = this.calculateRelevance(query, content);
      if (score > 0.1) {
        contexts.push({
          filePath,
          content,
          language: this.detectLanguage(filePath),
          relevanceScore: score,
        });
      }
    }

    return contexts.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  private calculateRelevance(query: string, content: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    let matchCount = 0;

    for (const term of queryTerms) {
      if (contentLower.includes(term)) matchCount++;
    }

    return queryTerms.length > 0 ? matchCount / queryTerms.length : 0;
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const langMap: Record<string, string> = {
      ts: 'typescript', tsx: 'typescriptreact', js: 'javascript', jsx: 'javascriptreact',
      py: 'python', java: 'java', go: 'go', rs: 'rust', cpp: 'cpp', c: 'c',
    };
    return langMap[ext] || 'plaintext';
  }

  getFileTree(): FileNode[] {
    const tree: FileNode[] = [];
    // TODO: Build tree from indexed files
    return tree;
  }

  getIndexedFileCount(): number {
    return this.fileIndex.size;
  }

  clearIndex(): void {
    this.fileIndex.clear();
  }
}

export const contextEngine = new ContextEngine();
