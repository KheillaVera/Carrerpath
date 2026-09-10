import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X, XCircle } from 'lucide-react';

/**
 * Lightweight toast notifications. Confirmations belong here rather than as a
 * green box pushed into the page, which shifts layout and is easy to miss.
 */
const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const TONE = {
  success: 'text-success',
  error: 'text-danger',
  warning: 'text-warn',
  info: 'text-accent',
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback((toast) => {
    const id = Math.random().toString(36).slice(2);
    const entry = { id, variant: 'info', duration: 4200, ...toast };
    setToasts((prev) => [...prev, entry]);
    if (entry.duration > 0) {
      timers.current.set(id, setTimeout(() => dismiss(id), entry.duration));
    }
    return id;
  }, [dismiss]);

  useEffect(() => {
    const pending = timers.current;
    return () => { pending.forEach((t) => clearTimeout(t)); pending.clear(); };
  }, []);

  const value = useMemo(() => ({
    toast: push,
    success: (title, description) => push({ variant: 'success', title, description }),
    error: (title, description) => push({ variant: 'error', title, description, duration: 6000 }),
    warning: (title, description) => push({ variant: 'warning', title, description }),
    info: (title, description) => push({ variant: 'info', title, description }),
    dismiss,
  }), [push, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.variant] || Info;
          return (
            <div key={t.id} className="toast animate-slide-in-right" role="status">
              <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE[t.variant] || ''}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink">{t.title}</div>
                {t.description && <div className="mt-0.5 text-xs text-muted">{t.description}</div>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="-m-1 rounded p-1 text-faint transition-colors hover:text-ink"
                aria-label="Dismiss notification"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
