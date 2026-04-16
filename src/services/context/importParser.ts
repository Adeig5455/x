export interface ImportInfo {
  source: string;
  symbols: string[];
  isDefault: boolean;
  isNamespace: boolean;
  raw: string;
}

const IMPORT_PATTERNS = [
  // import { foo, bar } from 'module'
  /import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g,
  // import foo from 'module'
  /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g,
  // import * as foo from 'module'
  /import\s*\*\s*as\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g,
  // import 'module' (side effect)
  /import\s*['"]([^'"]+)['"]/g,
  // require('module')
  /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
];

export function parseImports(code: string): ImportInfo[] {
  const imports: ImportInfo[] = [];
  const lines = code.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
      continue;
    }

    // Named imports: import { foo, bar } from 'module'
    const namedMatch = trimmed.match(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/);
    if (namedMatch) {
      const symbols = namedMatch[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
      imports.push({
        source: namedMatch[2],
        symbols,
        isDefault: false,
        isNamespace: false,
        raw: trimmed,
      });
      continue;
    }

    // Namespace import: import * as foo from 'module'
    const namespaceMatch = trimmed.match(/^import\s*\*\s*as\s+(\w+)\s+from\s*['"]([^'"]+)['"]/);
    if (namespaceMatch) {
      imports.push({
        source: namespaceMatch[2],
        symbols: [namespaceMatch[1]],
        isDefault: false,
        isNamespace: true,
        raw: trimmed,
      });
      continue;
    }

    // Default import: import foo from 'module'
    const defaultMatch = trimmed.match(/^import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/);
    if (defaultMatch) {
      imports.push({
        source: defaultMatch[2],
        symbols: [defaultMatch[1]],
        isDefault: true,
        isNamespace: false,
        raw: trimmed,
      });
      continue;
    }

    // Side-effect import: import 'module'
    const sideEffectMatch = trimmed.match(/^import\s*['"]([^'"]+)['"]/);
    if (sideEffectMatch) {
      imports.push({
        source: sideEffectMatch[1],
        symbols: [],
        isDefault: false,
        isNamespace: false,
        raw: trimmed,
      });
      continue;
    }

    // Require: const foo = require('module')
    const requireMatch = trimmed.match(/(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\s*\(\s*['"]([^'"]+)['"]\s*\)/);
    if (requireMatch) {
      const symbols = requireMatch[1]
        ? requireMatch[1].split(',').map((s) => s.trim()).filter(Boolean)
        : requireMatch[2]
          ? [requireMatch[2]]
          : [];
      imports.push({
        source: requireMatch[3],
        symbols,
        isDefault: !requireMatch[1],
        isNamespace: false,
        raw: trimmed,
      });
    }
  }

  return imports;
}

export function resolveImportPath(importSource: string, currentFilePath: string): string | null {
  // Skip node_modules imports
  if (!importSource.startsWith('.') && !importSource.startsWith('/')) {
    return null;
  }

  const currentDir = currentFilePath.substring(0, currentFilePath.lastIndexOf('/'));
  const parts = importSource.split('/');
  let resolved = currentDir;

  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      resolved = resolved.substring(0, resolved.lastIndexOf('/'));
    } else {
      resolved = `${resolved}/${part}`;
    }
  }

  return resolved;
}

export function buildDependencyGraph(
  files: Map<string, string>
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const [filePath, content] of files.entries()) {
    const imports = parseImports(content);
    const dependencies: string[] = [];

    for (const imp of imports) {
      const resolved = resolveImportPath(imp.source, filePath);
      if (resolved) {
        // Try various extensions
        const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js'];
        for (const ext of extensions) {
          const candidate = resolved + ext;
          if (files.has(candidate)) {
            dependencies.push(candidate);
            break;
          }
        }
      }
    }

    graph.set(filePath, dependencies);
  }

  return graph;
}
