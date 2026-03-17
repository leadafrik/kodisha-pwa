import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
};

const STYLES: Record<ToastType, string> = {
  success: "bg-emerald-700 text-white",
  error: "bg-rose-600 text-white",
  info: "bg-slate-800 text-white",
};

const AUTO_DISMISS_MS = 3500;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const addToast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++nextId.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, AUTO_DISMISS_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2"
        style={{ pointerEvents: "none" }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-lg ${STYLES[toast.type]}`}
            style={{ pointerEvents: "auto", minWidth: 220, maxWidth: 360 }}
          >
            <span className="shrink-0 text-base leading-none">{ICONS[toast.type]}</span>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
};
