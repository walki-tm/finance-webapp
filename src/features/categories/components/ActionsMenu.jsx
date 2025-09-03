import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export default function ActionsMenu({ onEdit, onRemove, onReset, customActions = [], disableRemove = false }) {
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    function place() {
      if (!btnRef.current) return;
      const r = btnRef.current.getBoundingClientRect();
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      
      // Verifica se il pulsante è effettivamente visibile nel viewport
      const isVisible = r.top >= 0 && r.left >= 0 && r.bottom <= viewport.height && r.right <= viewport.width;
      if (!isVisible) {
        // Se il pulsante è fuori dal viewport, chiudi il menu
        setOpen(false);
        return;
      }
      
      const menuWidth = 176; // w-44 = 176px
      // Calcola altezza approssimativa del menu basata sul numero di azioni
      const actionCount = (customActions?.length || 0) + (onEdit ? 1 : 0) + (onReset ? 1 : 0) + (onRemove ? 1 : 0);
      const menuHeight = Math.min(300, actionCount * 40 + 16); // 40px per azione + padding
      
      // Calcola posizione preferita (sotto a destra del pulsante)
      let top = r.bottom + 6;
      let left = r.right - menuWidth;
      
      // Assicurati che il menu non esca dal viewport a sinistra
      if (left < 8) {
        left = Math.max(8, r.left); // Allinea a sinistra del pulsante se necessario
      }
      
      // Assicurati che il menu non esca dal viewport a destra
      if (left + menuWidth > viewport.width - 8) {
        left = viewport.width - menuWidth - 8;
      }
      
      // Se il menu esce dal viewport in basso, posizionalo sopra il pulsante
      if (top + menuHeight > viewport.height - 8) {
        top = r.top - menuHeight - 6;
        // Se anche sopra esce, trova la migliore posizione verticale
        if (top < 8) {
          // Posiziona il menu nel centro dello spazio disponibile
          const availableSpace = viewport.height - 16; // margini 8px top/bottom
          const buttonCenter = r.top + r.height / 2;
          top = Math.max(8, Math.min(buttonCenter - menuHeight / 2, availableSpace - menuHeight));
        }
      }
      
      setPos({ top, left });
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
  }, [open, customActions?.length]);

  const baseItem = "w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800";
  const item = baseItem + " text-slate-700 dark:text-slate-100";
  const removeItem = baseItem + " text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10";

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        className="rounded-xl px-2 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 opacity-30 group-hover:opacity-100 hover:!opacity-100"
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
          {customActions.map((action, index) => (
            <button
              key={index}
              type="button"
              disabled={action.disabled}
              className={`${action.variant === 'danger' ? removeItem : action.variant === 'primary' ? baseItem + ' text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10' : item} ${action.disabled ? "opacity-40 cursor-not-allowed" : ""}`}
              onMouseDown={() => {
                if (action.disabled) return;
                setOpen(false);
                setTimeout(() => action.onClick(), 0);
              }}
            >
              {action.label}
            </button>
          ))}
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