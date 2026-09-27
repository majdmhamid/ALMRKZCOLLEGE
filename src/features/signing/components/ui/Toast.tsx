"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";

type Toast = { id: number; text: string; tone: "ok" | "error" };
const ToastContext = createContext<(text: string, tone?: Toast["tone"]) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((text: string, tone: Toast["tone"] = "ok") => {
    const id = Date.now() + Math.random();
    setToasts((all) => [...all.slice(-2), { id, text, tone }]);
    setTimeout(() => setToasts((all) => all.filter((t) => t.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
              t.tone === "ok" ? "bg-ink" : "bg-red-600"
            }`}
          >
            {t.tone === "ok" ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
