// // src/components/Toast.jsx
// import React, { createContext, useContext, useMemo, useState, useCallback } from "react";

// const ToastCtx = createContext(null);

// export function ToastProvider({ children }) {
//   const [toasts, setToasts] = useState([]);

//   const dismiss = useCallback((id) => {
//     setToasts((ts) => ts.filter((t) => t.id !== id));
//   }, []);

//   const show = useCallback((opts) => {
//     const id = Math.random().toString(36).slice(2);
//     const t = {
//       id,
//       title: opts.title || "",
//       description: opts.description || "",
//       variant: opts.variant || "info", // info | success | error | warning
//       duration: opts.duration ?? 3000,
//     };
//     setToasts((ts) => [...ts, t]);
//     if (t.duration > 0) {
//       setTimeout(() => dismiss(id), t.duration);
//     }
//     return id;
//   }, [dismiss]);

//   const api = useMemo(() => ({
//     show,
//     info: (msg, opt={}) => show({ title: msg, variant: "info", ...opt }),
//     success: (msg, opt={}) => show({ title: msg, variant: "success", ...opt }),
//     error: (msg, opt={}) => show({ title: msg, variant: "error", ...opt }),
//     warning: (msg, opt={}) => show({ title: msg, variant: "warning", ...opt }),
//     dismiss,
//   }), [show, dismiss]);

//   return (
//     <ToastCtx.Provider value={api}>
//       {children}
//       {/* viewport qui di default */}
//       <ToastViewport toasts={toasts} onClose={dismiss} />
//     </ToastCtx.Provider>
//   );
// }

// export function useToast() {
//   const ctx = useContext(ToastCtx);
//   if (!ctx) throw new Error("useToast must be used inside <ToastProvider />");
//   return ctx;
// }

// export function ToastViewport({ toasts, onClose }) {
//   const base =
//     "pointer-events-auto rounded-xl shadow-lg border px-3 py-2 min-w-[240px] text-sm flex gap-2 items-start";
//   const byVariant = {
//     info:    "bg-slate-50 dark:bg-slate-900 border-slate-200/60 dark:border-slate-700/60",
//     success: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-700/60",
//     error:   "bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-700/60",
//     warning: "bg-amber-50 dark:bg-amber-950/40 border-amber-200/60 dark:border-amber-700/60",
//   };

//   return (
//     <div className="fixed z-[10000] top-4 right-4 flex flex-col gap-2">
//       {toasts.map((t) => (
//         <div key={t.id} className={`${base} ${byVariant[t.variant] || byVariant.info}`}>
//           <div className="flex-1">
//             <div className="font-semibold">{t.title}</div>
//             {t.description ? <div className="opacity-80">{t.description}</div> : null}
//           </div>
//           <button
//             onClick={() => onClose(t.id)}
//             className="rounded-md px-2 py-1 text-xs border hover:bg-black/5 dark:hover:bg-white/5"
//             aria-label="Chiudi"
//           >
//             ×
//           </button>
//         </div>
//       ))}
//     </div>
//   );
// }
// src/components/Toast.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X as XIcon,
} from "lucide-react";

/* ---------------------- Context & Provider ---------------------- */

const ToastCtx = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((ts) => ts.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (opts) => {
      const id = Math.random().toString(36).slice(2);
      const t = {
        id,
        title: opts.title || "",
        description: opts.description || "",
        variant: opts.variant || "info", // info | success | error | warning
        duration: opts.duration ?? 5500, // 5-6s
      };
      setToasts((ts) => [...ts, t]);
      return id;
    },
    []
  );

  const api = useMemo(
    () => ({
      show,
      info: (msg, opt = {}) => show({ title: msg, variant: "info", ...opt }),
      success: (msg, opt = {}) =>
        show({ title: msg, variant: "success", ...opt }),
      error: (msg, opt = {}) => show({ title: msg, variant: "error", ...opt }),
      warning: (msg, opt = {}) =>
        show({ title: msg, variant: "warning", ...opt }),
      dismiss: remove,
    }),
    [show, remove]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}

      {/* Stack – in alto a destra */}
      <div className="pointer-events-none fixed top-5 right-5 z-[10000] flex w-[min(92vw,420px)] flex-col gap-2">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onExited={() => remove(t.id)} />
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider />");
  return ctx;
}

/* --------------------------- Item UI ---------------------------- */

function ToastItem({ id, title, description, variant, duration, onExited }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  // Slide-in al mount
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 10);
    return () => clearTimeout(t);
  }, []);

  // Auto-close dopo duration
  useEffect(() => {
    timerRef.current = setTimeout(() => setOpen(false), Math.max(1200, duration));
    return () => clearTimeout(timerRef.current);
  }, [duration]);

  const onClose = () => {
    clearTimeout(timerRef.current);
    setOpen(false);
  };

  const styles = variantStyles(variant);

  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      aria-live="polite"
      // animation: translate X + fade
      className={[
        "pointer-events-auto rounded-2xl border shadow-xl backdrop-blur",
        "transition-all duration-300 ease-out",
        open ? "opacity-100 translate-x-0" : "opacity-0 translate-x-6",
        styles.wrapper,
      ].join(" ")}
      onTransitionEnd={(e) => {
        // Quando termina l'uscita → rimuovi dal provider
        if (e.propertyName === "transform" && !open) onExited?.();
      }}
    >
      <div className="flex items-start gap-3 p-3">
        {/* Icona */}
        <div
          className={[
            "mt-[2px] inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
            styles.iconWrap,
          ].join(" ")}
          aria-hidden="true"
        >
          {variant === "success" ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : variant === "error" ? (
            <XCircle className="h-4 w-4" />
          ) : variant === "warning" ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Info className="h-4 w-4" />
          )}
        </div>

        {/* Testo */}
        <div className="min-w-0 flex-1">
          {title ? (
            <div className="truncate text-sm font-semibold">{title}</div>
          ) : null}
          {description ? (
            <div className="mt-0.5 text-xs opacity-90">{description}</div>
          ) : null}
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="ml-1 rounded-md p-1 text-xs transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2"
          aria-label="Chiudi"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Barra di progresso (discreta) */}
      <Progress duration={duration} colorClass={styles.progress} />
    </div>
  );
}

/* ------------------------ Variant styling ----------------------- */

function variantStyles(variant) {
  switch (variant) {
    case "success":
      return {
        wrapper:
          "bg-emerald-50/90 dark:bg-emerald-900/40 border-emerald-200/60 dark:border-emerald-700/60 text-emerald-900 dark:text-emerald-100",
        iconWrap:
          "bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-100",
        progress: "bg-emerald-500",
      };
    case "error":
      return {
        wrapper:
          "bg-rose-50/90 dark:bg-rose-900/40 border-rose-200/60 dark:border-rose-700/60 text-rose-900 dark:text-rose-100",
        iconWrap:
          "bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-100",
        progress: "bg-rose-500",
      };
    case "warning":
      return {
        wrapper:
          "bg-amber-50/90 dark:bg-amber-900/40 border-amber-200/60 dark:border-amber-700/60 text-amber-900 dark:text-amber-100",
        iconWrap:
          "bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-100",
        progress: "bg-amber-500",
      };
    default:
      return {
        wrapper:
          "bg-slate-50/90 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-700/60 text-slate-900 dark:text-slate-100",
        iconWrap:
          "bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-100",
        progress: "bg-sky-500",
      };
  }
}

/* ---------------------- Progress bar (auto) --------------------- */

function Progress({ duration, colorClass }) {
  return (
    <div className="relative h-1 w-full overflow-hidden rounded-b-2xl bg-black/5 dark:bg-white/10">
      {/* barra animata che “scarica” verso dx */}
      <div
        className={["absolute inset-y-0 left-0", colorClass].join(" ")}
        style={{
          width: "100%",
          transform: "translateX(-100%)",
          animation: `toastProgress ${Math.max(1200, duration)}ms linear forwards`,
        }}
      />
      <style>{`
        @keyframes toastProgress {
          to { transform: translateX(0%); }
        }
      `}</style>
    </div>
  );
}
