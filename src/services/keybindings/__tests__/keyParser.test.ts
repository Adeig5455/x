import {
  parseKeyCombo,
  parseChord,
  comboMatches,
  comboToString,
  normalizeKey,
} from '../keyParser';

describe('keyParser', () => {
  describe('normalizeKey', () => {
    it('normalizes key aliases', () => {
      expect(normalizeKey('Control')).toBe('ctrl');
      expect(normalizeKey('Command')).toBe('meta');
      expect(normalizeKey('cmd')).toBe('meta');
      expect(normalizeKey('Option')).toBe('alt');
      expect(normalizeKey('Return')).toBe('enter');
      expect(normalizeKey('Escape')).toBe('escape');
      expect(normalizeKey('Esc')).toBe('escape');
    });

    it('normalizes arrow keys', () => {
      expect(normalizeKey('Up')).toBe('arrowup');
      expect(normalizeKey('Down')).toBe('arrowdown');
      expect(normalizeKey('Left')).toBe('arrowleft');
      expect(normalizeKey('Right')).toBe('arrowright');
    });

    it('passes through unknown keys as lowercase', () => {
      expect(normalizeKey('a')).toBe('a');
      expect(normalizeKey('F12')).toBe('f12');
    });
  });

  describe('parseKeyCombo', () => {
    it('parses simple key', () => {
      const combo = parseKeyCombo('a');
      expect(combo.key).toBe('a');
      expect(combo.ctrl).toBe(false);
      expect(combo.shift).toBe(false);
      expect(combo.alt).toBe(false);
    });

    it('parses ctrl+key', () => {
      const combo = parseKeyCombo('ctrl+s');
      expect(combo.ctrl).toBe(true);
      expect(combo.key).toBe('s');
    });

    it('parses ctrl+shift+key', () => {
      const combo = parseKeyCombo('ctrl+shift+p');
      expect(combo.ctrl).toBe(true);
      expect(combo.shift).toBe(true);
      expect(combo.key).toBe('p');
    });

    it('parses alt+key', () => {
      const combo = parseKeyCombo('alt+arrowup');
      expect(combo.alt).toBe(true);
      expect(combo.key).toBe('arrowup');
    });

    it('handles case insensitivity', () => {
      const combo = parseKeyCombo('Ctrl+Shift+P');
      expect(combo.ctrl).toBe(true);
      expect(combo.shift).toBe(true);
      expect(combo.key).toBe('p');
    });
  });

  describe('parseChord', () => {
    it('parses single combo as single-part chord', () => {
      const chord = parseChord('ctrl+k');
      expect(chord.parts).toHaveLength(1);
      expect(chord.parts[0].ctrl).toBe(true);
      expect(chord.parts[0].key).toBe('k');
    });

    it('parses multi-chord sequence', () => {
      const chord = parseChord('ctrl+k ctrl+c');
      expect(chord.parts).toHaveLength(2);
      expect(chord.parts[0].ctrl).toBe(true);
      expect(chord.parts[0].key).toBe('k');
      expect(chord.parts[1].ctrl).toBe(true);
      expect(chord.parts[1].key).toBe('c');
    });
  });

  describe('comboMatches', () => {
    it('returns true for matching combos', () => {
      const a = parseKeyCombo('ctrl+s');
      const b = parseKeyCombo('ctrl+s');
      expect(comboMatches(a, b)).toBe(true);
    });

    it('returns false for non-matching combos', () => {
      const a = parseKeyCombo('ctrl+s');
      const b = parseKeyCombo('ctrl+shift+s');
      expect(comboMatches(a, b)).toBe(false);
    });

    it('returns false for different keys', () => {
      const a = parseKeyCombo('ctrl+s');
      const b = parseKeyCombo('ctrl+a');
      expect(comboMatches(a, b)).toBe(false);
    });
  });

  describe('comboToString', () => {
    it('converts combo to display string', () => {
      const combo = parseKeyCombo('ctrl+shift+p');
      expect(comboToString(combo)).toBe('Ctrl+Shift+P');
    });

    it('handles single key', () => {
      const combo = parseKeyCombo('escape');
      expect(comboToString(combo)).toBe('Escape');
    });

    it('handles function keys', () => {
      const combo = parseKeyCombo('f12');
      expect(comboToString(combo)).toBe('F12');
    });
  });
});
