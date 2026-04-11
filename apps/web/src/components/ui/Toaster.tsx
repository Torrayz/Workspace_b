// ============================================================================
// Toaster — Toast notification system
// ============================================================================

'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

const TOAST_ICONS = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
} as const;

const TOAST_STYLES = {
  success: 'border-l-4 border-l-success',
  error: 'border-l-4 border-l-danger',
  info: 'border-l-4 border-l-accent',
} as const;

export function Toaster({ children }: { children?: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, type, message }]);

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container — pojok kanan bawah */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => {
          const Icon = TOAST_ICONS[t.type];
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-center gap-3 rounded-xl border border-border bg-surface',
                'px-5 py-4 shadow-2xl animate-toast-in min-w-[320px] max-w-[420px]',
                'dark:bg-dark-surface dark:border-dark-border',
                TOAST_STYLES[t.type],
              )}
            >
              <Icon
                size={20}
                className={cn(
                  t.type === 'success' && 'text-success',
                  t.type === 'error' && 'text-danger',
                  t.type === 'info' && 'text-accent',
                )}
              />
              <p className="flex-1 text-sm text-text-primary dark:text-gray-100">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
