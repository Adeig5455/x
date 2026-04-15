import type { AIMessage, CodeBlock } from '../../shared/types';
import { generateId } from '../../shared/utils';

export interface Conversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface AIState {
  conversations: Conversation[];
  activeConversationId: string | null;
  aiLoading: boolean;
  aiModel: string;
  autoCompleteEnabled: boolean;
  streamingMessageId: string | null;
}

export interface AISlice extends AIState {
  createConversation: (title?: string) => string;
  deleteConversation: (id: string) => void;
  setActiveConversation: (id: string) => void;
  addMessage: (role: 'user' | 'assistant' | 'system', content: string, codeBlocks?: CodeBlock[]) => void;
  appendToMessage: (messageId: string, content: string) => void;
  clearMessages: () => void;
  setAILoading: (loading: boolean) => void;
  setAIModel: (model: string) => void;
  setAutoComplete: (enabled: boolean) => void;
  setStreamingMessageId: (id: string | null) => void;
  getActiveMessages: () => AIMessage[];
}

export const createAISlice = (
  set: (fn: (state: { ai: AISlice }) => Partial<{ ai: AISlice }>) => void,
  get: () => { ai: AISlice }
): AISlice => ({
  conversations: [],
  activeConversationId: null,
  aiLoading: false,
  aiModel: 'gpt-4',
  autoCompleteEnabled: true,
  streamingMessageId: null,

  createConversation: (title) => {
    const id = generateId();
    const conversation: Conversation = {
      id,
      title: title || `Chat ${new Date().toLocaleString()}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    set((state) => ({
      ai: {
        ...state.ai,
        conversations: [...state.ai.conversations, conversation],
        activeConversationId: id,
      },
    }));

    return id;
  },

  deleteConversation: (id) => {
    set((state) => {
      const conversations = state.ai.conversations.filter((c) => c.id !== id);
      const activeConversationId =
        state.ai.activeConversationId === id
          ? conversations.length > 0
            ? conversations[conversations.length - 1].id
            : null
          : state.ai.activeConversationId;

      return { ai: { ...state.ai, conversations, activeConversationId } };
    });
  },

  setActiveConversation: (id) => {
    set((state) => ({ ai: { ...state.ai, activeConversationId: id } }));
  },

  addMessage: (role, content, codeBlocks) => {
    set((state) => {
      let conversationId = state.ai.activeConversationId;

      // Auto-create conversation if none exists
      if (!conversationId || !state.ai.conversations.some((c) => c.id === conversationId)) {
        conversationId = generateId();
        const newConv: Conversation = {
          id: conversationId,
          title: content.slice(0, 50) || 'New Chat',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        state = {
          ...state,
          ai: {
            ...state.ai,
            conversations: [...state.ai.conversations, newConv],
            activeConversationId: conversationId,
          },
        };
      }

      const message: AIMessage = {
        id: generateId(),
        role,
        content,
        timestamp: Date.now(),
        codeBlocks: codeBlocks || [],
      };

      const conversations = state.ai.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, message], updatedAt: Date.now() }
          : c
      );

      return { ai: { ...state.ai, conversations } };
    });
  },

  appendToMessage: (messageId, content) => {
    set((state) => {
      const conversations = state.ai.conversations.map((c) => {
        if (c.id !== state.ai.activeConversationId) return c;
        return {
          ...c,
          messages: c.messages.map((m) =>
            m.id === messageId ? { ...m, content: m.content + content } : m
          ),
          updatedAt: Date.now(),
        };
      });
      return { ai: { ...state.ai, conversations } };
    });
  },

  clearMessages: () => {
    set((state) => {
      const conversations = state.ai.conversations.map((c) =>
        c.id === state.ai.activeConversationId
          ? { ...c, messages: [], updatedAt: Date.now() }
          : c
      );
      return { ai: { ...state.ai, conversations } };
    });
  },

  setAILoading: (loading) => {
    set((state) => ({ ai: { ...state.ai, aiLoading: loading } }));
  },

  setAIModel: (model) => {
    set((state) => ({ ai: { ...state.ai, aiModel: model } }));
  },

  setAutoComplete: (enabled) => {
    set((state) => ({ ai: { ...state.ai, autoCompleteEnabled: enabled } }));
  },

  setStreamingMessageId: (id) => {
    set((state) => ({ ai: { ...state.ai, streamingMessageId: id } }));
  },

  getActiveMessages: () => {
    const state = get();
    const conv = state.ai.conversations.find((c) => c.id === state.ai.activeConversationId);
    return conv?.messages || [];
  },
});
