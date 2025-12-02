import { create } from 'zustand';
import { Conversation, Message } from '../../types';

interface ChatStore {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;

  // Actions
  setConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (
    conversationId: string,
    updates: Partial<Conversation>
  ) => void;
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<Message>
  ) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;

  // Selectors
  getActiveConversation: () => Conversation | undefined;
  getMessages: (conversationId: string) => Message[];
  getConversation: (conversationId: string) => Conversation | undefined;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},

  setConversations: (conversations) => set({ conversations }),

  addConversation: (conversation) =>
    set((state) => ({
      conversations: [conversation, ...state.conversations],
    })),

  updateConversation: (conversationId, updates) =>
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === conversationId ? { ...conv, ...updates } : conv
      ),
    })),

  setActiveConversation: (conversationId) =>
    set({ activeConversationId: conversationId }),

  addMessage: (conversationId, message) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: [...existingMessages, message],
        },
      };
    }),

  updateMessage: (conversationId, messageId, updates) =>
    set((state) => {
      const existingMessages = state.messages[conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [conversationId]: existingMessages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        },
      };
    }),

  setMessages: (conversationId, messages) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [conversationId]: messages,
      },
    })),

  // Selectors
  getActiveConversation: () => {
    const { conversations, activeConversationId } = get();
    return conversations.find((conv) => conv.id === activeConversationId);
  },

  getMessages: (conversationId: string) => {
    const { messages } = get();
    return messages[conversationId] || [];
  },

  getConversation: (conversationId: string) => {
    const { conversations } = get();
    return conversations.find((conv) => conv.id === conversationId);
  },
}));
