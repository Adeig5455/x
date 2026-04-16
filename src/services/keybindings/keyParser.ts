export interface ParsedKeyCombo {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

export interface ParsedChord {
  parts: ParsedKeyCombo[];
}

const KEY_ALIASES: Record<string, string> = {
  control: 'ctrl',
  command: 'meta',
  cmd: 'meta',
  option: 'alt',
  return: 'enter',
  escape: 'escape',
  esc: 'escape',
  backspace: 'backspace',
  delete: 'delete',
  del: 'delete',
  space: ' ',
  spacebar: ' ',
  arrowup: 'arrowup',
  arrowdown: 'arrowdown',
  arrowleft: 'arrowleft',
  arrowright: 'arrowright',
  up: 'arrowup',
  down: 'arrowdown',
  left: 'arrowleft',
  right: 'arrowright',
  tab: 'tab',
  '`': '`',
};

export function normalizeKey(key: string): string {
  const lower = key.toLowerCase();
  return KEY_ALIASES[lower] || lower;
}

export function parseKeyCombo(combo: string): ParsedKeyCombo {
  const parts = combo.toLowerCase().split('+').map((p) => p.trim());
  const result: ParsedKeyCombo = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: '',
  };

  for (const part of parts) {
    const normalized = normalizeKey(part);
    switch (normalized) {
      case 'ctrl':
        result.ctrl = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      case 'alt':
        result.alt = true;
        break;
      case 'meta':
        result.meta = true;
        break;
      default:
        result.key = normalized;
    }
  }

  return result;
}

export function parseChord(chord: string): ParsedChord {
  // Multi-chord: "ctrl+k ctrl+c" (space separated combos)
  const parts = chord.trim().split(/\s+/);
  return {
    parts: parts.map(parseKeyCombo),
  };
}

export function keyEventToCombo(e: KeyboardEvent): ParsedKeyCombo {
  return {
    ctrl: e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    alt: e.altKey,
    meta: false,
    key: normalizeKey(e.key),
  };
}

export function comboMatches(a: ParsedKeyCombo, b: ParsedKeyCombo): boolean {
  return (
    a.ctrl === b.ctrl &&
    a.shift === b.shift &&
    a.alt === b.alt &&
    a.key === b.key
  );
}

export function comboToString(combo: ParsedKeyCombo): string {
  const parts: string[] = [];
  if (combo.ctrl) parts.push('Ctrl');
  if (combo.shift) parts.push('Shift');
  if (combo.alt) parts.push('Alt');
  if (combo.meta) parts.push('Meta');
  if (combo.key) parts.push(combo.key.length === 1 ? combo.key.toUpperCase() : capitalize(combo.key));
  return parts.join('+');
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
