import {
  parseImports,
  resolveImportPath,
  buildDependencyGraph,
} from '../importParser';

describe('importParser', () => {
  describe('parseImports', () => {
    it('parses named imports', () => {
      const code = `import { foo, bar } from './module';`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0].source).toBe('./module');
      expect(imports[0].symbols).toEqual(['foo', 'bar']);
      expect(imports[0].isDefault).toBe(false);
      expect(imports[0].isNamespace).toBe(false);
    });

    it('parses default imports', () => {
      const code = `import React from 'react';`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0].source).toBe('react');
      expect(imports[0].symbols).toEqual(['React']);
      expect(imports[0].isDefault).toBe(true);
    });

    it('parses namespace imports', () => {
      const code = `import * as path from 'path';`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0].source).toBe('path');
      expect(imports[0].isNamespace).toBe(true);
    });

    it('parses side-effect imports', () => {
      const code = `import './styles.css';`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0].source).toBe('./styles.css');
      expect(imports[0].symbols).toEqual([]);
    });

    it('parses require statements', () => {
      const code = `const { readFile } = require('fs');`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0].source).toBe('fs');
      expect(imports[0].symbols).toEqual(['readFile']);
    });

    it('parses default require', () => {
      const code = `const path = require('path');`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0].source).toBe('path');
      expect(imports[0].isDefault).toBe(true);
    });

    it('handles multiple imports', () => {
      const code = `
import React from 'react';
import { useState, useEffect } from 'react';
import './styles.css';
import * as utils from '../utils';
`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(4);
    });

    it('skips commented imports', () => {
      const code = `
// import foo from 'bar';
import real from 'module';
`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0].source).toBe('module');
    });

    it('handles aliased named imports', () => {
      const code = `import { foo as bar, baz } from './module';`;
      const imports = parseImports(code);
      expect(imports).toHaveLength(1);
      expect(imports[0].symbols).toEqual(['foo', 'baz']);
    });
  });

  describe('resolveImportPath', () => {
    it('resolves relative imports', () => {
      const result = resolveImportPath('./utils', '/src/main/index.ts');
      expect(result).toBe('/src/main/utils');
    });

    it('resolves parent directory imports', () => {
      const result = resolveImportPath('../shared/types', '/src/main/index.ts');
      expect(result).toBe('/src/shared/types');
    });

    it('returns null for node_modules imports', () => {
      const result = resolveImportPath('react', '/src/main/index.ts');
      expect(result).toBeNull();
    });

    it('returns null for scoped packages', () => {
      const result = resolveImportPath('@types/node', '/src/main/index.ts');
      expect(result).toBeNull();
    });
  });

  describe('buildDependencyGraph', () => {
    it('builds graph from file map', () => {
      const files = new Map<string, string>();
      files.set('/src/a.ts', `import { foo } from './b';`);
      files.set('/src/b.ts', `export const foo = 42;`);

      const graph = buildDependencyGraph(files);
      expect(graph.get('/src/a.ts')).toEqual(['/src/b.ts']);
      expect(graph.get('/src/b.ts')).toEqual([]);
    });

    it('handles files with no imports', () => {
      const files = new Map<string, string>();
      files.set('/src/a.ts', `export const x = 1;`);

      const graph = buildDependencyGraph(files);
      expect(graph.get('/src/a.ts')).toEqual([]);
    });

    it('skips unresolvable imports', () => {
      const files = new Map<string, string>();
      files.set('/src/a.ts', `import React from 'react';\nimport { x } from './missing';`);

      const graph = buildDependencyGraph(files);
      expect(graph.get('/src/a.ts')).toEqual([]);
    });
  });
});
