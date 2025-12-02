import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'message' | 'friend_request' | 'mention' | 'reaction';
  title: string;
  body: string;
  conversationId?: string;
  senderId?: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;

  // Actions
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  clearAll: () => void;

  // Selectors
  getUnreadNotifications: () => Notification[];
  getNotificationsByType: (type: Notification['type']) => Notification[];
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (notification) =>
    set((state) => {
      const newNotifications = [notification, ...state.notifications];
      const unreadCount = newNotifications.filter((n) => !n.isRead).length;
      return {
        notifications: newNotifications,
        unreadCount,
      };
    }),

  markAsRead: (notificationId) =>
    set((state) => {
      const updatedNotifications = state.notifications.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );
      const unreadCount = updatedNotifications.filter((n) => !n.isRead).length;
      return {
        notifications: updatedNotifications,
        unreadCount,
      };
    }),

  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        isRead: true,
      })),
      unreadCount: 0,
    })),

  removeNotification: (notificationId) =>
    set((state) => {
      const filteredNotifications = state.notifications.filter(
        (n) => n.id !== notificationId
      );
      const unreadCount = filteredNotifications.filter((n) => !n.isRead).length;
      return {
        notifications: filteredNotifications,
        unreadCount,
      };
    }),

  clearAll: () =>
    set({
      notifications: [],
      unreadCount: 0,
    }),

  // Selectors
  getUnreadNotifications: () => {
    const { notifications } = get();
    return notifications.filter((n) => !n.isRead);
  },

  getNotificationsByType: (type: Notification['type']) => {
    const { notifications } = get();
    return notifications.filter((n) => n.type === type);
  },
}));
