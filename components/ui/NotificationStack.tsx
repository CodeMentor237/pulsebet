import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore, NotificationType } from '../../store/notifications';
import clsx from 'clsx';

const typeStyles: Record<NotificationType, { border: string, bg: string, text: string, icon: string }> = {
  success: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    icon: '✓'
  },
  error: {
    border: 'border-rose-500/40',
    bg: 'bg-rose-500/10',
    text: 'text-rose-400',
    icon: '✕'
  },
  warning: {
    border: 'border-amber-500/40',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    icon: '!'
  },
  info: {
    border: 'border-volt/40',
    bg: 'bg-volt/10',
    text: 'text-volt',
    icon: 'i'
  }
};

export const NotificationStack: React.FC = () => {
  const { notifications, dismiss } = useNotificationStore();

  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-[320px]">
      <AnimatePresence>
        {notifications.map((n) => {
          const style = typeStyles[n.type];
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.95 }}
              onClick={() => dismiss(n.id)}
              className={clsx(
                "pointer-events-auto cursor-pointer group",
                "glass-strong p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-4",
                style.border,
                style.bg
              )}
            >
              <div className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0",
                "bg-black/40 border border-white/10",
                style.text
              )}>
                {style.icon}
              </div>
              <p className="text-xs font-bold text-white/90 leading-relaxed font-sans flex-1">
                {n.message}
              </p>
              <button 
                className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss(n.id);
                }}
              >
                ✕
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
