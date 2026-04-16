export type ContextValues = Record<string, string | boolean | number>;

export function evaluateWhenClause(
  expression: string | undefined,
  context: ContextValues
): boolean {
  if (!expression || expression.trim() === '') return true;

  try {
    return evaluateExpression(expression.trim(), context);
  } catch {
    return false;
  }
}

function evaluateExpression(expr: string, context: ContextValues): boolean {
  expr = expr.trim();

  // Handle OR (||) - lowest precedence
  const orParts = splitAtOperator(expr, '||');
  if (orParts.length > 1) {
    return orParts.some((part) => evaluateExpression(part, context));
  }

  // Handle AND (&&)
  const andParts = splitAtOperator(expr, '&&');
  if (andParts.length > 1) {
    return andParts.every((part) => evaluateExpression(part, context));
  }

  // Handle NOT (!)
  if (expr.startsWith('!')) {
    return !evaluateExpression(expr.slice(1), context);
  }

  // Handle parentheses
  if (expr.startsWith('(') && expr.endsWith(')')) {
    return evaluateExpression(expr.slice(1, -1), context);
  }

  // Handle comparison operators
  const eqMatch = expr.match(/^(.+?)\s*==\s*(.+)$/);
  if (eqMatch) {
    const left = resolveValue(eqMatch[1].trim(), context);
    const right = resolveValue(eqMatch[2].trim(), context);
    return left === right;
  }

  const neqMatch = expr.match(/^(.+?)\s*!=\s*(.+)$/);
  if (neqMatch) {
    const left = resolveValue(neqMatch[1].trim(), context);
    const right = resolveValue(neqMatch[2].trim(), context);
    return left !== right;
  }

  // Simple boolean context variable
  const value = context[expr];
  return !!value;
}

function resolveValue(
  token: string,
  context: ContextValues
): string | boolean | number {
  // String literal
  if (
    (token.startsWith("'") && token.endsWith("'")) ||
    (token.startsWith('"') && token.endsWith('"'))
  ) {
    return token.slice(1, -1);
  }

  // Boolean literal
  if (token === 'true') return true;
  if (token === 'false') return false;

  // Number literal
  if (!isNaN(Number(token))) return Number(token);

  // Context variable
  return context[token] ?? '';
}

function splitAtOperator(expr: string, operator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < expr.length; i++) {
    const char = expr[i];

    if (char === '(') depth++;
    if (char === ')') depth--;

    if (depth === 0 && expr.slice(i, i + operator.length) === operator) {
      parts.push(current);
      current = '';
      i += operator.length - 1;
    } else {
      current += char;
    }
  }

  parts.push(current);
  return parts.filter((p) => p.trim() !== '');
}
