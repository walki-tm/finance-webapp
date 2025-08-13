// src/components/IconBrowserModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Input, Button } from "./ui.jsx";
import SvgIcon from "./SvgIcon.jsx";

function hexToRgba(hex, a = 1) {
  const h = (hex || "#000000").replace("#", "");
  const v = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const r = parseInt(v.slice(0,2),16), g = parseInt(v.slice(2,4),16), b = parseInt(v.slice(4,6),16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
const isDark = () =>
  typeof document !== "undefined" && document.documentElement.classList.contains("dark");

/**
 * Modale che legge /public/icons/_list.json e mostra una griglia.
 * Usa BASE_URL per funzionare anche in build.
 */
export default function IconBrowserModal({ open, onClose, onPick, tintColor = "#0b1220" }) {
  // 🔴 Hook SEMPRE in cima, mai condizioni prima
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  // carica lista quando open diventa true
  useEffect(() => {
    if (!open) return;
    const base = (import.meta?.env?.BASE_URL || "/").replace(/\/+$/, "");
    const url = `${base}/icons/_list.json`;
    setLoading(true);
    fetch(url)
      .then(r => r.json())
      .then(arr => setList((arr || []).map(s => s.endsWith(".svg") ? s : `${s}.svg`)))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [open]);

  // handler keyboard solo quando è aperta
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
      className="flex flex-col items-center justify-center gap-2 rounded-xl p-3 border shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      title={label}
    >
      <div
        className="rounded-xl flex items-center justify-center"
        style={{ width: 56, height: 56, backgroundColor: hexToRgba(tintColor, isDark() ? 0.12 : 0.10) }}
      >
        <SvgIcon name={label} color={tintColor} size={28} />
      </div>
      <div className="text-xs opacity-70 truncate max-w-[90px]">{label.replace(/\.svg$/,'')}</div>
    </button>
  );

  return createPortal(
    <div className="fixed inset-0 z-[9999]" role="dialog" aria-modal="true"
         onClick={(e)=>{ if(e.target === e.currentTarget) onClose?.(); }}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 grid place-items-center p-4" onClick={(e)=>e.stopPropagation()}>
        <div className="w-full max-w-3xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl">
          {/* header */}
          <div className="px-5 py-4 border-b border-slate-200/10 flex items-center justify-between">
            <div className="font-semibold text-slate-900 dark:text-white">Seleziona icona</div>
            <div className="w-64">
              <Input placeholder="Cerca per nome..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>

          {/* body */}
          <div className="p-5 space-y-6">
            {loading ? (
              <div className="text-sm text-slate-500">Caricamento icone…</div>
            ) : filtered.length === 0 ? (
              <div className="text-sm text-slate-500">
                Nessuna icona trovata. Assicurati che esista <code>/public/icons/_list.json</code>.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {filtered.map(name => (
                  <Tile
                    key={name}
                    label={name}
                    onClick={() => { onPick?.(name.replace(/\.svg$/,'')); onClose?.(); }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* footer */}
          <div className="px-5 pb-5 flex justify-end">
            <Button type="button" variant="outline" onClick={onClose}>Chiudi</Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
