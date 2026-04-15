import { evaluateWhenClause } from '../whenClause';

describe('whenClause', () => {
  describe('evaluateWhenClause', () => {
    it('returns true for undefined expression', () => {
      expect(evaluateWhenClause(undefined, {})).toBe(true);
    });

    it('returns true for empty expression', () => {
      expect(evaluateWhenClause('', {})).toBe(true);
    });

    it('evaluates simple boolean context variable', () => {
      expect(evaluateWhenClause('editorFocus', { editorFocus: true })).toBe(true);
      expect(evaluateWhenClause('editorFocus', { editorFocus: false })).toBe(false);
      expect(evaluateWhenClause('editorFocus', {})).toBe(false);
    });

    it('evaluates NOT operator', () => {
      expect(evaluateWhenClause('!editorFocus', { editorFocus: true })).toBe(false);
      expect(evaluateWhenClause('!editorFocus', { editorFocus: false })).toBe(true);
    });

    it('evaluates AND operator', () => {
      const context = { editorFocus: true, suggestWidgetVisible: true };
      expect(evaluateWhenClause('editorFocus && suggestWidgetVisible', context)).toBe(true);
      expect(evaluateWhenClause('editorFocus && terminalFocus', context)).toBe(false);
    });

    it('evaluates OR operator', () => {
      const context = { editorFocus: true, terminalFocus: false };
      expect(evaluateWhenClause('editorFocus || terminalFocus', context)).toBe(true);
      expect(evaluateWhenClause('terminalFocus || sidebarFocus', context)).toBe(false);
    });

    it('evaluates equality operator', () => {
      expect(evaluateWhenClause("language == 'typescript'", { language: 'typescript' })).toBe(true);
      expect(evaluateWhenClause("language == 'python'", { language: 'typescript' })).toBe(false);
    });

    it('evaluates inequality operator', () => {
      expect(evaluateWhenClause("language != 'python'", { language: 'typescript' })).toBe(true);
      expect(evaluateWhenClause("language != 'typescript'", { language: 'typescript' })).toBe(false);
    });

    it('evaluates complex expressions', () => {
      const context = { editorFocus: true, language: 'typescript', readOnly: false };
      expect(evaluateWhenClause("editorFocus && language == 'typescript' && !readOnly", context)).toBe(true);
    });

    it('handles parentheses', () => {
      const context = { a: true, b: false, c: true };
      expect(evaluateWhenClause('a && (b || c)', context)).toBe(true);
      expect(evaluateWhenClause('(a && b) || c', context)).toBe(true);
    });

    it('returns false for malformed expressions', () => {
      expect(evaluateWhenClause('((invalid', {})).toBe(false);
    });
  });
});
