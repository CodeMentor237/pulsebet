import { create } from 'zustand';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  notify: (message: string, type?: NotificationType, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  notify: (message, type = 'info', duration = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: Notification = { id, message, type, duration };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    if (duration !== Infinity) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  dismiss: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
