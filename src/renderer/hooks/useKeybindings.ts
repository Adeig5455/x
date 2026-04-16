import { useEffect, useRef, useCallback } from 'react';
import { parseKeyCombo, comboMatches, keyEventToCombo, parseChord, type ParsedKeyCombo } from '../../services/keybindings/keyParser';
import { evaluateWhenClause, type ContextValues } from '../../services/keybindings/whenClause';
import type { KeyBinding } from '../../shared/types';

interface UseKeybindingsOptions {
  bindings: KeyBinding[];
  context: ContextValues;
  handlers: Record<string, () => void>;
  enabled?: boolean;
}

export function useKeybindings({ bindings, context, handlers, enabled = true }: UseKeybindingsOptions) {
  const chordBuffer = useRef<ParsedKeyCombo | null>(null);
  const chordTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!enabled) return;

      const currentCombo = keyEventToCombo(e);

      for (const binding of bindings) {
        // Check when clause
        if (!evaluateWhenClause(binding.when, context)) continue;

        const chord = parseChord(binding.key);

        if (chord.parts.length === 1) {
          // Single combo binding
          if (chordBuffer.current) continue; // In chord mode, skip single combos
          if (comboMatches(currentCombo, chord.parts[0])) {
            e.preventDefault();
            e.stopPropagation();
            const handler = handlers[binding.command];
            if (handler) handler();
            return;
          }
        } else if (chord.parts.length === 2) {
          // Two-part chord
          if (chordBuffer.current) {
            // Second part of chord
            if (
              comboMatches(chordBuffer.current, chord.parts[0]) &&
              comboMatches(currentCombo, chord.parts[1])
            ) {
              e.preventDefault();
              e.stopPropagation();
              chordBuffer.current = null;
              if (chordTimer.current) clearTimeout(chordTimer.current);
              const handler = handlers[binding.command];
              if (handler) handler();
              return;
            }
          } else {
            // First part of chord
            if (comboMatches(currentCombo, chord.parts[0])) {
              // Check if this could be a chord start
              e.preventDefault();
              chordBuffer.current = currentCombo;
              chordTimer.current = setTimeout(() => {
                chordBuffer.current = null;
              }, 2000);
              return;
            }
          }
        }
      }

      // If we're in chord mode and no match, clear chord buffer
      if (chordBuffer.current) {
        chordBuffer.current = null;
        if (chordTimer.current) clearTimeout(chordTimer.current);
      }
    },
    [bindings, context, handlers, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (chordTimer.current) clearTimeout(chordTimer.current);
    };
  }, [handleKeyDown]);
}
