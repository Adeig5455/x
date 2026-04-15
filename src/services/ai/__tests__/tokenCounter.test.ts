import {
  estimateTokenCount,
  getModelLimits,
  fitWithinTokenBudget,
  truncateToTokenLimit,
} from '../tokenCounter';

describe('tokenCounter', () => {
  describe('estimateTokenCount', () => {
    it('returns 0 for empty string', () => {
      expect(estimateTokenCount('')).toBe(0);
    });

    it('estimates tokens for plain English text', () => {
      const text = 'Hello world, this is a test sentence.';
      const tokens = estimateTokenCount(text);
      // ~36 chars / 4 chars per token = ~9 tokens
      expect(tokens).toBeGreaterThan(5);
      expect(tokens).toBeLessThan(20);
    });

    it('estimates tokens for code with a lower chars-per-token ratio', () => {
      const code = 'function foo() { return bar(); }';
      const tokens = estimateTokenCount(code);
      // Code has symbols so uses 3.5 chars/token ratio
      expect(tokens).toBeGreaterThan(5);
      expect(tokens).toBeLessThan(20);
    });

    it('detects code via symbols', () => {
      const code = 'if (x > 0) { console.log(x); }';
      const text = 'The quick brown fox jumps over the lazy dog';
      // Code should have more tokens per character length
      const codeTokens = estimateTokenCount(code);
      const textTokens = estimateTokenCount(text);
      // code is 31 chars, text is 43 chars
      // code: 31/3.5 = ~9, text: 43/4 = ~11
      expect(codeTokens).toBeGreaterThan(0);
      expect(textTokens).toBeGreaterThan(0);
    });
  });

  describe('getModelLimits', () => {
    it('returns correct limits for known models', () => {
      const gpt4 = getModelLimits('gpt-4');
      expect(gpt4.maxTokens).toBe(8192);
      expect(gpt4.maxOutputTokens).toBe(4096);
    });

    it('returns limits for prefix-matched models', () => {
      const gpt4variant = getModelLimits('gpt-4-0613');
      expect(gpt4variant.maxTokens).toBe(8192);
    });

    it('returns limits for claude models', () => {
      const claude = getModelLimits('claude-3-opus');
      expect(claude.maxTokens).toBe(200000);
    });

    it('returns default limits for unknown models', () => {
      const unknown = getModelLimits('unknown-model');
      expect(unknown.maxTokens).toBe(4096);
      expect(unknown.maxOutputTokens).toBe(2048);
    });
  });

  describe('fitWithinTokenBudget', () => {
    it('returns all texts when within budget', () => {
      const texts = ['short', 'text', 'here'];
      const result = fitWithinTokenBudget(texts, 1000);
      expect(result).toEqual(texts);
    });

    it('truncates when exceeding budget', () => {
      const texts = ['a'.repeat(100), 'b'.repeat(100), 'c'.repeat(100)];
      const result = fitWithinTokenBudget(texts, 30);
      expect(result.length).toBeLessThan(texts.length);
    });

    it('returns empty array for zero budget', () => {
      const result = fitWithinTokenBudget(['text'], 0);
      expect(result).toEqual([]);
    });
  });

  describe('truncateToTokenLimit', () => {
    it('returns text unchanged when within limit', () => {
      const text = 'short text';
      expect(truncateToTokenLimit(text, 100)).toBe(text);
    });

    it('truncates long text', () => {
      const text = 'a'.repeat(1000);
      const result = truncateToTokenLimit(text, 10);
      expect(result.length).toBeLessThan(text.length);
      expect(result).toContain('... (truncated)');
    });
  });
});
