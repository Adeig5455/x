import { selectContext, formatContextForPrompt } from '../contextSelector';

describe('contextSelector', () => {
  const createFiles = () => {
    const files = new Map<string, string>();
    files.set('/src/main.ts', 'import { helper } from "./helper";\nconst main = () => helper();');
    files.set('/src/helper.ts', 'export function helper() { return 42; }');
    files.set('/src/utils.ts', 'export function util() { return "util"; }');
    files.set('/src/other/deep.ts', 'export const deep = true;');
    return files;
  };

  const createGraph = () => {
    const graph = new Map<string, string[]>();
    graph.set('/src/main.ts', ['/src/helper.ts']);
    graph.set('/src/helper.ts', []);
    graph.set('/src/utils.ts', []);
    graph.set('/src/other/deep.ts', []);
    return graph;
  };

  describe('selectContext', () => {
    it('always includes the current file first', () => {
      const files = createFiles();
      const graph = createGraph();

      const result = selectContext(files, graph, '', {
        maxTokens: 10000,
        maxFiles: 10,
        currentFilePath: '/src/main.ts',
      });

      expect(result[0].filePath).toBe('/src/main.ts');
      expect(result[0].relevanceScore).toBe(1.0);
    });

    it('includes direct dependencies with high relevance', () => {
      const files = createFiles();
      const graph = createGraph();

      const result = selectContext(files, graph, '', {
        maxTokens: 10000,
        maxFiles: 10,
        currentFilePath: '/src/main.ts',
      });

      const helperContext = result.find((c) => c.filePath === '/src/helper.ts');
      expect(helperContext).toBeDefined();
      expect(helperContext!.relevanceScore).toBe(0.8);
    });

    it('includes same-directory files', () => {
      const files = createFiles();
      const graph = createGraph();

      const result = selectContext(files, graph, '', {
        maxTokens: 10000,
        maxFiles: 10,
        currentFilePath: '/src/main.ts',
      });

      const utilsContext = result.find((c) => c.filePath === '/src/utils.ts');
      expect(utilsContext).toBeDefined();
    });

    it('respects maxFiles limit', () => {
      const files = createFiles();
      const graph = createGraph();

      const result = selectContext(files, graph, '', {
        maxTokens: 10000,
        maxFiles: 2,
        currentFilePath: '/src/main.ts',
      });

      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('matches keyword query', () => {
      const files = createFiles();
      const graph = createGraph();

      const result = selectContext(files, graph, 'deep', {
        maxTokens: 10000,
        maxFiles: 10,
        currentFilePath: '/src/main.ts',
      });

      const deepContext = result.find((c) => c.filePath === '/src/other/deep.ts');
      expect(deepContext).toBeDefined();
    });
  });

  describe('formatContextForPrompt', () => {
    it('formats context files as structured text', () => {
      const contextFiles = [
        { filePath: '/src/main.ts', content: 'const x = 1;', relevanceScore: 1.0, reason: 'current file' },
      ];

      const formatted = formatContextForPrompt(contextFiles);
      expect(formatted).toContain('/src/main.ts');
      expect(formatted).toContain('const x = 1;');
      expect(formatted).toContain('current file');
    });

    it('handles empty context', () => {
      const formatted = formatContextForPrompt([]);
      expect(formatted).toBe('');
    });
  });
});
