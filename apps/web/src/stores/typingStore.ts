import { create } from 'zustand';

export interface TypingEvent {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: number;
}

interface TypingStore {
  typingUsers: Record<string, string[]>; // conversationId -> userIds[]
  typingTimeouts: Record<string, NodeJS.Timeout>; // userId -> timeout

  // Actions
  setTyping: (conversationId: string, userId: string, username: string) => void;
  removeTyping: (conversationId: string, userId: string) => void;
  clearTypingForConversation: (conversationId: string) => void;

  // Selectors
  getTypingUsers: (conversationId: string) => string[];
  isUserTyping: (conversationId: string, userId: string) => boolean;
}

export const useTypingStore = create<TypingStore>((set, get) => ({
  typingUsers: {},
  typingTimeouts: {},

  setTyping: (conversationId, userId, _username) => {
    const { typingTimeouts } = get();

    // Clear existing timeout for this user
    if (typingTimeouts[userId]) {
      clearTimeout(typingTimeouts[userId]);
    }

    // Add user to typing list
    set((state) => {
      const currentTypingUsers = state.typingUsers[conversationId] || [];
      const updatedTypingUsers = currentTypingUsers.includes(userId)
        ? currentTypingUsers
        : [...currentTypingUsers, userId];

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updatedTypingUsers,
        },
      };
    });

    // Set timeout to remove typing indicator after 3 seconds
    const timeout = setTimeout(() => {
      get().removeTyping(conversationId, userId);
    }, 3000);

    set((state) => ({
      typingTimeouts: {
        ...state.typingTimeouts,
        [userId]: timeout,
      },
    }));
  },

  removeTyping: (conversationId, userId) => {
    const { typingTimeouts } = get();

    // Clear timeout if it exists
    if (typingTimeouts[userId]) {
      clearTimeout(typingTimeouts[userId]);
    }

    set((state) => {
      const currentTypingUsers = state.typingUsers[conversationId] || [];
      const updatedTypingUsers = currentTypingUsers.filter(
        (id) => id !== userId
      );

      const { [userId]: _removedTimeout, ...remainingTimeouts } =
        state.typingTimeouts;

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: updatedTypingUsers,
        },
        typingTimeouts: remainingTimeouts,
      };
    });
  },

  clearTypingForConversation: (conversationId) => {
    const { typingUsers, typingTimeouts } = get();
    const usersInConversation = typingUsers[conversationId] || [];

    // Clear all timeouts for users in this conversation
    usersInConversation.forEach((userId) => {
      if (typingTimeouts[userId]) {
        clearTimeout(typingTimeouts[userId]);
      }
    });

    set((state) => {
      const updatedTimeouts = { ...state.typingTimeouts };
      usersInConversation.forEach((userId) => {
        delete updatedTimeouts[userId];
      });

      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: [],
        },
        typingTimeouts: updatedTimeouts,
      };
    });
  },

  // Selectors
  getTypingUsers: (conversationId: string) => {
    const { typingUsers } = get();
    return typingUsers[conversationId] || [];
  },

  isUserTyping: (conversationId: string, userId: string) => {
    const { typingUsers } = get();
    const usersTyping = typingUsers[conversationId] || [];
    return usersTyping.includes(userId);
  },
}));
