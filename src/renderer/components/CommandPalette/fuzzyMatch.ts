export interface FuzzyMatchResult {
  score: number;
  matchedIndices: number[];
}

export function fuzzyMatch(pattern: string, text: string): FuzzyMatchResult | null {
  if (!pattern) return { score: 0, matchedIndices: [] };
  if (!text) return null;

  const patternLower = pattern.toLowerCase();
  const textLower = text.toLowerCase();

  let patternIdx = 0;
  let textIdx = 0;
  const matchedIndices: number[] = [];
  let score = 0;

  while (patternIdx < patternLower.length && textIdx < textLower.length) {
    if (patternLower[patternIdx] === textLower[textIdx]) {
      matchedIndices.push(textIdx);

      // Bonus for exact case match
      if (pattern[patternIdx] === text[textIdx]) {
        score += 2;
      } else {
        score += 1;
      }

      // Bonus for consecutive matches
      if (matchedIndices.length > 1) {
        const prev = matchedIndices[matchedIndices.length - 2];
        if (textIdx === prev + 1) {
          score += 5;
        }
      }

      // Bonus for matching at word boundaries
      if (textIdx === 0 || isSeparator(text[textIdx - 1])) {
        score += 10;
      }

      // Bonus for matching uppercase in camelCase
      if (text[textIdx] === text[textIdx].toUpperCase() && text[textIdx] !== text[textIdx].toLowerCase()) {
        score += 5;
      }

      patternIdx++;
    }
    textIdx++;
  }

  // All pattern characters must be found
  if (patternIdx !== patternLower.length) return null;

  // Penalty for longer text (prefer shorter matches)
  score -= Math.floor(text.length * 0.1);

  // Bonus for shorter match span
  if (matchedIndices.length > 0) {
    const span = matchedIndices[matchedIndices.length - 1] - matchedIndices[0];
    score -= Math.floor(span * 0.5);
  }

  return { score: Math.max(0, score), matchedIndices };
}

function isSeparator(char: string): boolean {
  return /[\s_\-./\\:,;]/.test(char);
}

export function highlightMatches(text: string, matchedIndices: number[]): string {
  if (matchedIndices.length === 0) return text;

  const indexSet = new Set(matchedIndices);
  let result = '';
  let inHighlight = false;

  for (let i = 0; i < text.length; i++) {
    if (indexSet.has(i)) {
      if (!inHighlight) {
        result += '<mark>';
        inHighlight = true;
      }
      result += text[i];
    } else {
      if (inHighlight) {
        result += '</mark>';
        inHighlight = false;
      }
      result += text[i];
    }
  }

  if (inHighlight) result += '</mark>';
  return result;
}

export function fuzzySort<T>(
  items: T[],
  pattern: string,
  getText: (item: T) => string
): Array<T & { matchResult: FuzzyMatchResult }> {
  const results: Array<T & { matchResult: FuzzyMatchResult }> = [];

  for (const item of items) {
    const text = getText(item);
    const match = fuzzyMatch(pattern, text);
    if (match) {
      results.push({ ...item, matchResult: match });
    }
  }

  results.sort((a, b) => b.matchResult.score - a.matchResult.score);
  return results;
}
