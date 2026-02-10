"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { NotificationContainer, createNotification, type NotificationType } from "./Notification";

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toast: (type: NotificationType, message: string, duration?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const toast = useCallback((type: NotificationType, message: string, duration?: number) => {
    const notif = createNotification(type, message, duration);
    setNotifications((prev) => [...prev, notif]);
  }, []);

  const success = useCallback((message: string) => toast("success", message), [toast]);
  const error = useCallback((message: string) => toast("error", message), [toast]);
  const info = useCallback((message: string) => toast("info", message), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <NotificationContainer notifications={notifications} onDismiss={dismiss} position="top-right" />
    </ToastContext.Provider>
  );
}
