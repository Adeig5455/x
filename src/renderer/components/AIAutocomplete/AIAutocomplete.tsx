import type { AICompletionSuggestion } from '../../../shared/types';

export class AIAutocompleteProvider {
  private enabled: boolean = true;

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  async getSuggestions(
    _code: string,
    _cursorPosition: { lineNumber: number; column: number },
    _language: string
  ): Promise<AICompletionSuggestion[]> {
    if (!this.enabled) return [];

    // TODO: Integrate with AI API service for real completions
    return [];
  }

  async acceptSuggestion(_suggestion: AICompletionSuggestion): Promise<void> {
    // TODO: Apply the suggestion to the editor
  }

  dismissSuggestion(): void {
    // TODO: Dismiss current inline suggestion
  }
}

export const autocompleteProvider = new AIAutocompleteProvider();
