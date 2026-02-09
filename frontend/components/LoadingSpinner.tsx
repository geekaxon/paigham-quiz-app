"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  label?: string;
  fullPage?: boolean;
  overlay?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  label,
  fullPage = false,
  overlay = false,
}: LoadingSpinnerProps) {
  const sizes: Record<string, string> = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-[3px]",
    lg: "h-12 w-12 border-4",
    xl: "h-16 w-16 border-4",
  };

  const labelSizes: Record<string, string> = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-lg",
  };

  const spinner = (
    <div
      className="flex flex-col items-center justify-center gap-3"
      role="status"
      aria-live="polite"
      aria-label={label || "Loading"}
    >
      <div
        className={`animate-spin rounded-full border-primary-100 border-t-primary dark:border-primary-200 dark:border-t-primary-400 ${sizes[size]}`}
      />
      {label && (
        <p
          className={`text-gray-500 dark:text-gray-400 animate-pulse ${labelSizes[size]}`}
        >
          {label}
        </p>
      )}
      <span className="sr-only">{label || "Loading content, please wait"}</span>
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-black/50 backdrop-blur-sm"
        aria-modal="true"
        role="dialog"
        aria-label="Loading"
      >
        {spinner}
      </div>
    );
  }

  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] py-20">
        {spinner}
      </div>
    );
  }

  return spinner;
}

interface InlineLoadingProps {
  text?: string;
}

export function InlineLoading({ text = "Loading..." }: InlineLoadingProps) {
  return (
    <span
      className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400"
      role="status"
      aria-live="polite"
    >
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-primary-100 border-t-primary dark:border-primary-200 dark:border-t-primary-400" />
      <span>{text}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
