"use client";

import { useEffect, useState } from "react";

interface NotificationProps {
  type: "success" | "error" | "info" | "warning";
  message: string;
  onClose?: () => void;
  duration?: number;
}

export default function Notification({ type, message, onClose, duration = 5000 }: NotificationProps) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300);
  };

  if (!visible) return null;

  const styles = {
    success: {
      container: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800",
      icon: "text-emerald-500 dark:text-emerald-400",
      text: "text-emerald-800 dark:text-emerald-200",
      close: "text-emerald-400 hover:text-emerald-600 dark:text-emerald-500 dark:hover:text-emerald-300",
    },
    error: {
      container: "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
      icon: "text-red-500 dark:text-red-400",
      text: "text-red-800 dark:text-red-200",
      close: "text-red-400 hover:text-red-600 dark:text-red-500 dark:hover:text-red-300",
    },
    info: {
      container: "bg-primary-50 border-primary-200 dark:bg-primary-50 dark:border-primary-200",
      icon: "text-primary dark:text-primary-400",
      text: "text-primary-dark dark:text-primary-300",
      close: "text-primary-300 hover:text-primary dark:text-primary-400 dark:hover:text-primary-300",
    },
    warning: {
      container: "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800",
      icon: "text-amber-500 dark:text-amber-400",
      text: "text-amber-800 dark:text-amber-200",
      close: "text-amber-400 hover:text-amber-600 dark:text-amber-500 dark:hover:text-amber-300",
    },
  };

  const icons = {
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
    warning: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
  };

  const s = styles[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`rounded-lg border px-4 py-3 flex items-start gap-3 transition-all duration-300 ${s.container} ${
        exiting ? "opacity-0 translate-y-[-8px]" : "opacity-100 translate-y-0"
      }`}
    >
      <span className={`flex-shrink-0 mt-0.5 ${s.icon}`}>{icons[type]}</span>
      <p className={`text-sm flex-1 ${s.text}`}>{message}</p>
      {onClose && (
        <button
          onClick={handleClose}
          className={`flex-shrink-0 p-0.5 rounded transition-colors ${s.close}`}
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
