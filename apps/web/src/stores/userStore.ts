import { create } from 'zustand';
import { User, UserStatus } from '../../types';

interface UserStore {
  users: Record<string, User>; // userId -> User
  onlineUsers: Set<string>;

  // Actions
  addUser: (user: User) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  setUserStatus: (userId: string, status: UserStatus) => void;
  setOnlineUsers: (userIds: string[]) => void;
  addOnlineUser: (userId: string) => void;
  removeOnlineUser: (userId: string) => void;

  // Selectors
  getUser: (userId: string) => User | undefined;
  isUserOnline: (userId: string) => boolean;
  getOnlineUsers: () => User[];
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: {},
  onlineUsers: new Set(),

  addUser: (user) =>
    set((state) => ({
      users: {
        ...state.users,
        [user.id]: user,
      },
    })),

  updateUser: (userId, updates) =>
    set((state) => {
      const existingUser = state.users[userId];
      if (!existingUser) return state;

      return {
        users: {
          ...state.users,
          [userId]: { ...existingUser, ...updates },
        },
      };
    }),

  setUserStatus: (userId, status) => {
    get().updateUser(userId, { status });

    // Update online status based on user status
    if (status === UserStatus.ONLINE) {
      get().addOnlineUser(userId);
    } else {
      get().removeOnlineUser(userId);
    }
  },

  setOnlineUsers: (userIds) =>
    set({
      onlineUsers: new Set(userIds),
    }),

  addOnlineUser: (userId) =>
    set((state) => ({
      onlineUsers: new Set([...state.onlineUsers, userId]),
    })),

  removeOnlineUser: (userId) =>
    set((state) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(userId);
      return { onlineUsers: newOnlineUsers };
    }),

  // Selectors
  getUser: (userId: string) => {
    const { users } = get();
    return users[userId];
  },

  isUserOnline: (userId: string) => {
    const { onlineUsers } = get();
    return onlineUsers.has(userId);
  },

  getOnlineUsers: () => {
    const { users, onlineUsers } = get();
    return Array.from(onlineUsers)
      .map((userId) => users[userId])
      .filter(Boolean);
  },
}));
