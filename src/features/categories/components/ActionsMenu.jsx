import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export default function ActionsMenu({ onEdit, onRemove, onReset, disableRemove = false }) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function place() {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 6, left: Math.max(8, r.right - 176) });
    }
    if (open) {
      place();
      const close = (e) => {
        const t = e.target;
        if (btnRef.current?.contains(t)) return;
        if (menuRef.current?.contains(t)) return;
        setOpen(false);
      };
      const onKey = (e) => { if (e.key === "Escape") setOpen(false); };

      window.addEventListener("resize", place);
      window.addEventListener("scroll", place, true);
      document.addEventListener("mousedown", close);
      document.addEventListener("keydown", onKey);
      return () => {
        window.removeEventListener("resize", place);
        window.removeEventListener("scroll", place, true);
        document.removeEventListener("mousedown", close);
        document.removeEventListener("keydown", onKey);
      };
    }
  }, [open]);

  const baseItem = "w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800";
  const item = baseItem + " text-slate-700 dark:text-slate-100";
  const removeItem = baseItem + " text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10";

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="rounded-xl px-2 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Azioni"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] w-44 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl"
          style={{ top: pos.top, left: pos.left }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              type="button"
              className={item}
              onMouseDown={() => {
                setOpen(false);
                setTimeout(() => onEdit(), 0);
              }}
            >
              Modifica
            </button>
          )}
          {onReset && (
            <button
              type="button"
              className={item}
              onMouseDown={() => {
                setOpen(false);
                setTimeout(() => onReset(), 0);
              }}
            >
              Ripristina
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              disabled={disableRemove}
              className={`${removeItem} ${disableRemove ? "opacity-40 cursor-not-allowed" : ""}`}
              onMouseDown={() => {
                if (disableRemove) return;
                setOpen(false);
                setTimeout(() => onRemove(), 0);
              }}
            >
              Rimuovi
            </button>
          )}
        </div>,
        document.body
      )}
    </>
  );
}