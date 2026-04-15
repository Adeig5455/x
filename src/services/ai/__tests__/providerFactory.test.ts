import { createProvider, getProviderForModel } from '../providerFactory';

describe('providerFactory', () => {
  describe('createProvider', () => {
    it('creates OpenAI provider', () => {
      const provider = createProvider({
        type: 'openai',
        apiKey: 'test-key',
      });
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.streamChat).toBeDefined();
    });

    it('creates Anthropic provider', () => {
      const provider = createProvider({
        type: 'anthropic',
        apiKey: 'test-key',
      });
      expect(provider).toBeDefined();
      expect(provider.chat).toBeDefined();
      expect(provider.streamChat).toBeDefined();
    });

    it('throws for unknown provider type', () => {
      expect(() =>
        createProvider({
          type: 'unknown' as 'openai',
          apiKey: 'test-key',
        })
      ).toThrow('Unknown provider type: unknown');
    });
  });

  describe('getProviderForModel', () => {
    it('returns Anthropic provider for Claude models', () => {
      const provider = getProviderForModel('claude-3-opus', 'test-key');
      expect(provider).toBeDefined();
    });

    it('returns OpenAI provider for GPT models', () => {
      const provider = getProviderForModel('gpt-4', 'test-key');
      expect(provider).toBeDefined();
    });

    it('defaults to OpenAI for unknown models', () => {
      const provider = getProviderForModel('some-model', 'test-key');
      expect(provider).toBeDefined();
    });
  });
});
