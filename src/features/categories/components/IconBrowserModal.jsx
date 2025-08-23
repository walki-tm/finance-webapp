// src/features/categories/components/IconBrowserModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Input } from "../../ui";
import SvgIcon from "../../icons/components/SvgIcon.jsx";

function hexToRgba(hex, a = 1) {
  const h = (hex || "#000000").replace("#", "");
  const v = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
const isDark = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

/**
 * Modale che legge le liste di icone e mostra una griglia.
 * Usa BASE_URL per funzionare anche in build.
 * 
 * @param {string} iconType - "main" per icone categorie principali, "sub" per sottocategorie
 */
export default function IconBrowserModal({ open, onClose, onPick, tintColor = "#0b1220", iconType = "sub" }) {
  // hook sempre in cima
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // carica lista quando open diventa true
  useEffect(() => {
    if (!open) return;
    const base = (import.meta?.env?.BASE_URL || "/").replace(/\/+$/, "");
    const fileName = iconType === "main" ? "main-icons.json" : "sub-icons.json";
    const url = `${base}/icons/${fileName}`;
    setLoading(true);
    
    const loadIcons = async () => {
      console.log(`[IconBrowserModal] Loading ${iconType} icons from:`, url);
      try {
        // Try to load the specific icon list first
        const response = await fetch(url);
        console.log(`[IconBrowserModal] Response:`, response.status, response.ok);
        if (response.ok) {
          const arr = await response.json();
          console.log(`[IconBrowserModal] Loaded ${arr.length} icons:`, arr.slice(0,5));
          setList((arr || []).map(s => (s.endsWith(".svg") ? s : `${s}.svg`)));
          return;
        }
      } catch (error) {
        console.warn(`Failed to load ${fileName}, trying fallback`, error);
      }
      
      try {
        // Fallback to legacy list
        const fallbackUrl = `${base}/icons/_list.json`;
        const response = await fetch(fallbackUrl);
        if (response.ok) {
          const arr = await response.json();
          setList((arr || []).map(s => (s.endsWith(".svg") ? s : `${s}.svg`)));
          return;
        }
      } catch (error) {
        console.error('Failed to load any icon list', error);
      }
      
      // Final fallback: empty list
      setList([]);
    };
    
    loadIcons().finally(() => setLoading(false));
  }, [open, iconType]);

  // esc per chiudere
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const filtered = useMemo(() => {
    if (!q) return list;
    const qq = q.toLowerCase();
    return list.filter(n => n.toLowerCase().includes(qq));
  }, [q, list]);

  if (!open) return null;

  const Tile = ({ label, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label.replace(/\.svg$/, "")}
      className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 border shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      title={label.replace(/\.svg$/, "")}
    >
      <div
        className="rounded-xl flex items-center justify-center"
        style={{
          width: 56,
          height: 56,
          backgroundColor: hexToRgba(tintColor, isDark() ? 0.12 : 0.1),
        }}
      >
        <SvgIcon name={label} color={tintColor} size={28} iconType={iconType} />
      </div>
      {/* niente nome file visibile */}
    </button>
  );

  return createPortal(
    <div
      className="fixed inset-0 z-[9999]"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="absolute inset-0 grid place-items-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* contenitore column: header / body scroll / footer */}
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl flex flex-col max-h-[85vh]">
          {/* header */}
          <div className="px-5 py-4 border-b border-slate-200/10 flex items-center justify-between gap-3">
            <div className="font-semibold text-slate-900 dark:text-white">
              Seleziona icona {iconType === "main" ? "categoria principale" : "sottocategoria"}
            </div>
            <div className="w-64">
              <Input
                placeholder="Cerca per nome..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                style={{
                  backgroundColor: isDark() ? "rgba(255,255,255,0.05)" : "",
                  borderColor: isDark() ? "rgba(255,255,255,0.15)" : "",
                }}
              />
            </div>
          </div>

          {/* body scrollabile */}
          <div className="p-5 space-y-6 overflow-y-auto">
            <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="text-sm text-slate-500">Caricamento icone…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-slate-500">Nessuna icona trovata.</div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filtered.map((name) => (
                  <Tile
                    key={name}
                    label={name}
                    onClick={() => {
                      onPick?.(name.replace(/\.svg$/, ""));
                      onClose?.();
                    }}
                  />
                ))}
              </div>
            )}
            </div>
          </div>

          {/* footer */}
          <div className="px-5 pb-5 pt-2 flex justify-end border-t border-slate-200/10">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90"
            >
              Chiudi
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}