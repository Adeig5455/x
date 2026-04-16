import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

export type ProviderType = 'openai' | 'anthropic';

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  baseUrl?: string;
}

export interface AIProviderInterface {
  chat(request: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }): Promise<{ content: string; usage?: { inputTokens: number; outputTokens: number } }>;

  streamChat(
    request: {
      model: string;
      messages: Array<{ role: string; content: string }>;
      max_tokens?: number;
      temperature?: number;
    },
    signal?: AbortSignal
  ): AsyncGenerator<string, void, unknown>;
}

class OpenAIAdapter implements AIProviderInterface {
  private provider: OpenAIProvider;

  constructor(apiKey: string, baseUrl?: string) {
    this.provider = new OpenAIProvider(apiKey, baseUrl);
  }

  async chat(request: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }) {
    const response = await this.provider.chat({
      model: request.model,
      messages: request.messages.map((m) => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content,
      })),
      max_tokens: request.max_tokens,
      temperature: request.temperature,
    });

    return {
      content: response.choices[0].message.content,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens,
          }
        : undefined,
    };
  }

  async *streamChat(
    request: {
      model: string;
      messages: Array<{ role: string; content: string }>;
      max_tokens?: number;
      temperature?: number;
    },
    signal?: AbortSignal
  ) {
    yield* this.provider.streamChat(
      {
        model: request.model,
        messages: request.messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        max_tokens: request.max_tokens,
        temperature: request.temperature,
      },
      signal
    );
  }
}

class AnthropicAdapter implements AIProviderInterface {
  private provider: AnthropicProvider;

  constructor(apiKey: string, baseUrl?: string) {
    this.provider = new AnthropicProvider(apiKey, baseUrl);
  }

  async chat(request: {
    model: string;
    messages: Array<{ role: string; content: string }>;
    max_tokens?: number;
    temperature?: number;
  }) {
    const systemMsg = request.messages.find((m) => m.role === 'system');
    const nonSystemMsgs = request.messages.filter((m) => m.role !== 'system');

    const response = await this.provider.chat({
      model: request.model,
      messages: nonSystemMsgs.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      max_tokens: request.max_tokens || 2048,
      system: systemMsg?.content,
      temperature: request.temperature,
    });

    return {
      content: response.content[0].text,
      usage: response.usage
        ? {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
          }
        : undefined,
    };
  }

  async *streamChat(
    request: {
      model: string;
      messages: Array<{ role: string; content: string }>;
      max_tokens?: number;
      temperature?: number;
    },
    signal?: AbortSignal
  ) {
    const systemMsg = request.messages.find((m) => m.role === 'system');
    const nonSystemMsgs = request.messages.filter((m) => m.role !== 'system');

    yield* this.provider.streamChat(
      {
        model: request.model,
        messages: nonSystemMsgs.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })),
        max_tokens: request.max_tokens || 2048,
        system: systemMsg?.content,
        temperature: request.temperature,
      },
      signal
    );
  }
}

export function createProvider(config: ProviderConfig): AIProviderInterface {
  switch (config.type) {
    case 'openai':
      return new OpenAIAdapter(config.apiKey, config.baseUrl);
    case 'anthropic':
      return new AnthropicAdapter(config.apiKey, config.baseUrl);
    default:
      throw new Error(`Unknown provider type: ${config.type}`);
  }
}

export function getProviderForModel(model: string, apiKey: string): AIProviderInterface {
  if (model.startsWith('claude')) {
    return createProvider({ type: 'anthropic', apiKey });
  }
  return createProvider({ type: 'openai', apiKey });
}
