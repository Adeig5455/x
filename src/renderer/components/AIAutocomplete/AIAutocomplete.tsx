import type { AICompletionSuggestion } from '../../../shared/types';

// ============================================================================
// AI Autocomplete Provider - Ghost text, caching, debounced completions
// ============================================================================

interface CacheEntry {
  suggestions: AICompletionSuggestion[];
  timestamp: number;
  prefix: string;
}

interface CompletionContext {
  code: string;
  cursorPosition: { lineNumber: number; column: number };
  language: string;
  filePath?: string;
  prefix: string;
  suffix: string;
}

type CompletionBackend = (context: CompletionContext) => Promise<AICompletionSuggestion[]>;

export class AIAutocompleteProvider {
  private enabled: boolean = true;
  private cache: Map<string, CacheEntry> = new Map();
  private readonly cacheMaxSize = 100;
  private readonly cacheTTL = 60000; // 1 minute
  private pendingRequest: AbortController | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs = 300;
  private currentSuggestion: AICompletionSuggestion | null = null;
  private ghostTextVisible = false;
  private backend: CompletionBackend | null = null;
  private acceptCount = 0;
  private rejectCount = 0;
  private requestCount = 0;
  private readonly maxSuggestionLength = 500;
  private triggerCharacters = new Set(['.', '(', '{', '[', ',', ':', ' ', '\n']);
  private disabledLanguages = new Set<string>();

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.dismissSuggestion();
      this.clearCache();
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setBackend(backend: CompletionBackend): void {
    this.backend = backend;
  }

  setTriggerCharacters(chars: string[]): void {
    this.triggerCharacters = new Set(chars);
  }

  disableForLanguage(language: string): void {
    this.disabledLanguages.add(language);
  }

  enableForLanguage(language: string): void {
    this.disabledLanguages.delete(language);
  }

  getStats(): { accepted: number; rejected: number; requests: number; cacheSize: number; hitRate: number } {
    const total = this.acceptCount + this.rejectCount;
    return {
      accepted: this.acceptCount,
      rejected: this.rejectCount,
      requests: this.requestCount,
      cacheSize: this.cache.size,
      hitRate: total > 0 ? this.acceptCount / total : 0,
    };
  }

  private getCacheKey(context: CompletionContext): string {
    return `${context.language}:${context.filePath || ''}:${context.cursorPosition.lineNumber}:${context.prefix.slice(-50)}`;
  }

  private getFromCache(key: string): AICompletionSuggestion[] | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.cacheTTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.suggestions;
  }

  private addToCache(key: string, suggestions: AICompletionSuggestion[], prefix: string): void {
    if (this.cache.size >= this.cacheMaxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, { suggestions, timestamp: Date.now(), prefix });
  }

  clearCache(): void {
    this.cache.clear();
  }

  private extractContext(code: string, position: { lineNumber: number; column: number }): { prefix: string; suffix: string } {
    const lines = code.split('\n');
    const lineIndex = Math.min(position.lineNumber - 1, lines.length - 1);
    const prefixLines = lines.slice(Math.max(0, lineIndex - 20), lineIndex + 1);
    const lastLine = prefixLines[prefixLines.length - 1] || '';
    prefixLines[prefixLines.length - 1] = lastLine.slice(0, position.column - 1);
    const suffixLines = lines.slice(lineIndex);
    if (suffixLines.length > 0) {
      suffixLines[0] = (lines[lineIndex] || '').slice(position.column - 1);
    }
    return {
      prefix: prefixLines.join('\n'),
      suffix: suffixLines.slice(0, 10).join('\n'),
    };
  }

  async getSuggestions(
    code: string,
    cursorPosition: { lineNumber: number; column: number },
    language: string,
    filePath?: string
  ): Promise<AICompletionSuggestion[]> {
    if (!this.enabled || this.disabledLanguages.has(language)) return [];

    const { prefix, suffix } = this.extractContext(code, cursorPosition);
    const context: CompletionContext = { code, cursorPosition, language, filePath, prefix, suffix };

    // Check cache
    const cacheKey = this.getCacheKey(context);
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    // Cancel pending request
    if (this.pendingRequest) {
      this.pendingRequest.abort();
    }

    // Debounce
    return new Promise<AICompletionSuggestion[]>((resolve) => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);

      this.debounceTimer = setTimeout(async () => {
        this.requestCount++;
        this.pendingRequest = new AbortController();

        try {
          let suggestions: AICompletionSuggestion[] = [];

          if (this.backend) {
            suggestions = await this.backend(context);
          }

          // Filter and truncate suggestions
          suggestions = suggestions
            .filter((s) => s.text.length > 0 && s.text.length <= this.maxSuggestionLength)
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, 5);

          this.addToCache(cacheKey, suggestions, prefix);
          resolve(suggestions);
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('[AIAutocomplete] Error fetching suggestions:', err);
          }
          resolve([]);
        } finally {
          this.pendingRequest = null;
        }
      }, this.debounceMs);
    });
  }

  getCurrentSuggestion(): AICompletionSuggestion | null {
    return this.currentSuggestion;
  }

  showGhostText(suggestion: AICompletionSuggestion): void {
    this.currentSuggestion = suggestion;
    this.ghostTextVisible = true;
  }

  isGhostTextVisible(): boolean {
    return this.ghostTextVisible;
  }

  async acceptSuggestion(suggestion?: AICompletionSuggestion): Promise<AICompletionSuggestion | null> {
    const accepted = suggestion || this.currentSuggestion;
    if (!accepted) return null;

    this.acceptCount++;
    this.currentSuggestion = null;
    this.ghostTextVisible = false;
    return accepted;
  }

  dismissSuggestion(): void {
    if (this.currentSuggestion) {
      this.rejectCount++;
    }
    this.currentSuggestion = null;
    this.ghostTextVisible = false;
  }

  nextSuggestion(suggestions: AICompletionSuggestion[]): AICompletionSuggestion | null {
    if (suggestions.length === 0) return null;
    const currentIdx = this.currentSuggestion
      ? suggestions.findIndex((s) => s.text === this.currentSuggestion?.text)
      : -1;
    const nextIdx = (currentIdx + 1) % suggestions.length;
    this.currentSuggestion = suggestions[nextIdx];
    return this.currentSuggestion;
  }

  prevSuggestion(suggestions: AICompletionSuggestion[]): AICompletionSuggestion | null {
    if (suggestions.length === 0) return null;
    const currentIdx = this.currentSuggestion
      ? suggestions.findIndex((s) => s.text === this.currentSuggestion?.text)
      : 0;
    const prevIdx = (currentIdx - 1 + suggestions.length) % suggestions.length;
    this.currentSuggestion = suggestions[prevIdx];
    return this.currentSuggestion;
  }

  shouldTrigger(lastChar: string): boolean {
    return this.enabled && this.triggerCharacters.has(lastChar);
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    if (this.pendingRequest) this.pendingRequest.abort();
    this.cache.clear();
    this.currentSuggestion = null;
  }
}

export const autocompleteProvider = new AIAutocompleteProvider();
