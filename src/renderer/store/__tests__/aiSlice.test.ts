import { createAISlice, AISlice } from '../aiSlice';

function createTestSlice() {
  let state: { ai: AISlice };

  const set = (fn: (s: { ai: AISlice }) => Partial<{ ai: AISlice }>) => {
    const partial = fn(state);
    if (partial.ai) {
      state = { ai: { ...state.ai, ...partial.ai } };
    }
  };

  const get = () => state;

  const slice = createAISlice(set, get);
  state = { ai: slice };

  return { getState: () => state.ai, set, get };
}

describe('AISlice', () => {
  let store: ReturnType<typeof createTestSlice>;

  beforeEach(() => {
    store = createTestSlice();
  });

  describe('initial state', () => {
    it('should have empty conversations', () => {
      expect(store.getState().conversations).toEqual([]);
    });

    it('should have no active conversation', () => {
      expect(store.getState().activeConversationId).toBeNull();
    });

    it('should default to gpt-4 model', () => {
      expect(store.getState().aiModel).toBe('gpt-4');
    });

    it('should have autocomplete enabled by default', () => {
      expect(store.getState().autoCompleteEnabled).toBe(true);
    });

    it('should not be loading', () => {
      expect(store.getState().aiLoading).toBe(false);
    });

    it('should have no streaming message', () => {
      expect(store.getState().streamingMessageId).toBeNull();
    });
  });

  describe('createConversation', () => {
    it('should create a conversation with default title', () => {
      const id = store.getState().createConversation();
      expect(id).toBeTruthy();
      expect(store.getState().conversations).toHaveLength(1);
      expect(store.getState().activeConversationId).toBe(id);
    });

    it('should create a conversation with custom title', () => {
      store.getState().createConversation('My Chat');
      expect(store.getState().conversations[0].title).toBe('My Chat');
    });

    it('should create multiple conversations', () => {
      store.getState().createConversation('Chat 1');
      store.getState().createConversation('Chat 2');
      expect(store.getState().conversations).toHaveLength(2);
    });

    it('should set latest conversation as active', () => {
      store.getState().createConversation('Chat 1');
      const id2 = store.getState().createConversation('Chat 2');
      expect(store.getState().activeConversationId).toBe(id2);
    });
  });

  describe('deleteConversation', () => {
    it('should delete a conversation', () => {
      const id = store.getState().createConversation('Test');
      store.getState().deleteConversation(id);
      expect(store.getState().conversations).toHaveLength(0);
    });

    it('should switch active conversation when deleting active', () => {
      const id1 = store.getState().createConversation('Chat 1');
      store.getState().createConversation('Chat 2');
      store.getState().setActiveConversation(id1);

      store.getState().deleteConversation(id1);
      expect(store.getState().activeConversationId).not.toBe(id1);
    });

    it('should set activeConversationId to null when deleting last conversation', () => {
      const id = store.getState().createConversation('Only');
      store.getState().deleteConversation(id);
      expect(store.getState().activeConversationId).toBeNull();
    });
  });

  describe('addMessage', () => {
    it('should add a user message to active conversation', () => {
      store.getState().createConversation('Test');
      store.getState().addMessage('user', 'Hello world');

      const msgs = store.getState().getActiveMessages();
      expect(msgs).toHaveLength(1);
      expect(msgs[0].role).toBe('user');
      expect(msgs[0].content).toBe('Hello world');
    });

    it('should add assistant message with code blocks', () => {
      store.getState().createConversation('Test');
      const codeBlocks = [{ language: 'typescript', code: 'const x = 1;' }];
      store.getState().addMessage('assistant', 'Here is the code:', codeBlocks);

      const msgs = store.getState().getActiveMessages();
      expect(msgs[0].codeBlocks).toEqual(codeBlocks);
    });

    it('should auto-create conversation if none exists', () => {
      store.getState().addMessage('user', 'Auto-create test');
      expect(store.getState().conversations).toHaveLength(1);
      expect(store.getState().getActiveMessages()).toHaveLength(1);
    });

    it('should add multiple messages in order', () => {
      store.getState().createConversation('Test');
      store.getState().addMessage('user', 'Question');
      store.getState().addMessage('assistant', 'Answer');
      store.getState().addMessage('user', 'Follow-up');

      const msgs = store.getState().getActiveMessages();
      expect(msgs).toHaveLength(3);
      expect(msgs[0].content).toBe('Question');
      expect(msgs[1].content).toBe('Answer');
      expect(msgs[2].content).toBe('Follow-up');
    });
  });

  describe('appendToMessage', () => {
    it('should append content to existing message', () => {
      store.getState().createConversation('Test');
      store.getState().addMessage('assistant', 'Hello');

      const msgId = store.getState().getActiveMessages()[0].id;
      store.getState().appendToMessage(msgId, ' World');

      expect(store.getState().getActiveMessages()[0].content).toBe('Hello World');
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages in active conversation', () => {
      store.getState().createConversation('Test');
      store.getState().addMessage('user', 'msg1');
      store.getState().addMessage('assistant', 'msg2');

      store.getState().clearMessages();
      expect(store.getState().getActiveMessages()).toHaveLength(0);
    });
  });

  describe('setAILoading', () => {
    it('should set loading state', () => {
      store.getState().setAILoading(true);
      expect(store.getState().aiLoading).toBe(true);
      store.getState().setAILoading(false);
      expect(store.getState().aiLoading).toBe(false);
    });
  });

  describe('setAIModel', () => {
    it('should change the AI model', () => {
      store.getState().setAIModel('claude-3-opus');
      expect(store.getState().aiModel).toBe('claude-3-opus');
    });
  });

  describe('setAutoComplete', () => {
    it('should toggle autocomplete', () => {
      store.getState().setAutoComplete(false);
      expect(store.getState().autoCompleteEnabled).toBe(false);
    });
  });

  describe('setStreamingMessageId', () => {
    it('should set and clear streaming message', () => {
      store.getState().setStreamingMessageId('msg-123');
      expect(store.getState().streamingMessageId).toBe('msg-123');
      store.getState().setStreamingMessageId(null);
      expect(store.getState().streamingMessageId).toBeNull();
    });
  });

  describe('getActiveMessages', () => {
    it('should return empty array when no active conversation', () => {
      expect(store.getState().getActiveMessages()).toEqual([]);
    });

    it('should return messages from active conversation only', () => {
      const id1 = store.getState().createConversation('Chat 1');
      store.getState().addMessage('user', 'msg in chat 1');

      store.getState().createConversation('Chat 2');
      store.getState().addMessage('user', 'msg in chat 2');

      // Active is Chat 2
      expect(store.getState().getActiveMessages()).toHaveLength(1);
      expect(store.getState().getActiveMessages()[0].content).toBe('msg in chat 2');

      // Switch to Chat 1
      store.getState().setActiveConversation(id1);
      expect(store.getState().getActiveMessages()).toHaveLength(1);
      expect(store.getState().getActiveMessages()[0].content).toBe('msg in chat 1');
    });
  });
});
