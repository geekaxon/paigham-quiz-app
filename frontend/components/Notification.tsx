"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export type NotificationType = "success" | "error" | "info";

interface NotificationProps {
  type: NotificationType;
  message: string;
  onClose?: () => void;
  duration?: number;
  id?: string;
}

const DURATIONS: Record<NotificationType, number> = {
  success: 3000,
  error: 5000,
  info: 4000,
};

export default function Notification({
  type,
  message,
  onClose,
  duration,
  id,
}: NotificationProps) {
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const autoDismiss = duration ?? DURATIONS[type];

  const handleClose = useCallback(() => {
    if (exiting) return;
    setExiting(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    setTimeout(() => {
      onClose?.();
    }, 300);
  }, [exiting, onClose]);

  useEffect(() => {
    if (autoDismiss <= 0) return;

    startRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / autoDismiss) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    timerRef.current = setTimeout(handleClose, autoDismiss);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [autoDismiss, handleClose]);

  const config = {
    success: {
      bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
      icon: "text-emerald-500 dark:text-emerald-400",
      text: "text-emerald-800 dark:text-emerald-200",
      close: "text-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-300",
      bar: "bg-emerald-400 dark:bg-emerald-500",
    },
    error: {
      bg: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
      icon: "text-red-500 dark:text-red-400",
      text: "text-red-800 dark:text-red-200",
      close: "text-red-400 hover:text-red-600 dark:hover:text-red-300",
      bar: "bg-red-400 dark:bg-red-500",
    },
    info: {
      bg: "bg-primary-50 border-primary-200 dark:bg-primary/10 dark:border-primary-200",
      icon: "text-primary dark:text-primary-400",
      text: "text-primary-dark dark:text-primary-300",
      close: "text-primary-300 hover:text-primary dark:hover:text-primary-300",
      bar: "bg-primary dark:bg-primary-400",
    },
  };

  const icons: Record<NotificationType, React.ReactNode> = {
    success: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const c = config[type];

  return (
    <div
      key={id}
      role="alert"
      aria-live={type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={`relative overflow-hidden rounded-lg border shadow-sm transition-all duration-300 ${c.bg} ${
        exiting ? "opacity-0 -translate-y-2 scale-95" : "opacity-100 translate-y-0 scale-100"
      }`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className={`flex-shrink-0 mt-0.5 ${c.icon}`}>{icons[type]}</span>
        <p className={`text-sm flex-1 leading-snug ${c.text}`}>{message}</p>
        <button
          type="button"
          onClick={handleClose}
          className={`flex-shrink-0 p-0.5 rounded-md transition-colors duration-200 ${c.close}`}
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      {autoDismiss > 0 && (
        <div className="h-0.5 w-full bg-black/5 dark:bg-white/5">
          <div
            className={`h-full transition-none ${c.bar}`}
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Time remaining before auto-dismiss"
          />
        </div>
      )}
    </div>
  );
}

interface NotificationItem {
  id: string;
  type: NotificationType;
  message: string;
  duration?: number;
}

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
  position?: "top-right" | "top-center" | "bottom-right";
}

export function NotificationContainer({
  notifications,
  onDismiss,
  position = "top-right",
}: NotificationContainerProps) {
  const positionClasses: Record<string, string> = {
    "top-right": "top-4 right-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  };

  if (notifications.length === 0) return null;

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 w-full max-w-sm px-4 sm:px-0 ${positionClasses[position]}`}
      aria-label="Notifications"
    >
      {notifications.map((n) => (
        <Notification
          key={n.id}
          id={n.id}
          type={n.type}
          message={n.message}
          duration={n.duration}
          onClose={() => onDismiss(n.id)}
        />
      ))}
    </div>
  );
}

let notificationCounter = 0;

export function createNotification(
  type: NotificationType,
  message: string,
  duration?: number
): NotificationItem {
  return {
    id: `notif-${++notificationCounter}-${Date.now()}`,
    type,
    message,
    duration,
  };
}
