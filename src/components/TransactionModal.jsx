import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, AlertCircle, StickyNote, ChevronDown } from 'lucide-react';
import { MAIN_CATS } from '../lib/constants.js';

/** testo bianco/nero leggibile su sfondo HEX */
function contrastText(hex) {
  const h = (hex || '#94a3b8').replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16), g = parseInt(v.slice(2, 4), 16), b = parseInt(v.slice(4, 6), 16);
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? '#0b1220' : '#ffffff';
}

/** Dropdown base (clic fuori, Esc, frecce ↑/↓, Enter) */
function useDropdown(onClose) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(-1);
  const ref = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) { setOpen(false); onClose?.(); }
    }
    function onKey(e) {
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); onClose?.(); }
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [open, onClose]);

  return { open, setOpen, idx, setIdx, ref };
}

/** Selettore Categoria (colorato) */
function CategorySelect({ value, onChange }) {
  const selected = MAIN_CATS.find(c => c.key === value) || MAIN_CATS[0];
  const bg = selected.color;
  const fg = contrastText(bg);
  const { open, setOpen, idx, setIdx, ref } = useDropdown();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none flex items-center justify-between"
        style={{ backgroundColor: bg, color: fg, borderColor: bg }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium">{selected.name}</span>
        <ChevronDown className="h-4 w-4" style={{ color: fg }} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {MAIN_CATS.map((c, i) => (
              <li
                key={c.key}
                role="option"
                aria-selected={c.key === value}
                onMouseEnter={() => setIdx(i)}
                onMouseLeave={() => setIdx(-1)}
                onClick={() => { onChange(c.key); setOpen(false); }}
                className={`px-3 py-2 cursor-pointer flex items-center justify-between ${c.key === value ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
              >
                <span style={{ color: c.color }} className="font-medium">{c.name}</span>
                {c.key === value && <span className="text-xs text-slate-500">selezionata</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Selettore Sottocategoria (testo colorato come categoria) */
function SubcatSelect({ value, onChange, options = [], color }) {
  const selected = options.find(s => s.name === value) || options[0] || { name: '—' };
  const { open, setOpen, idx, setIdx, ref } = useDropdown();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between"
        style={{ color }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="font-medium">{selected.name}</span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {options.map((s, i) => (
              <li
                key={s.name}
                role="option"
                aria-selected={s.name === value}
                onMouseEnter={() => setIdx(i)}
                onMouseLeave={() => setIdx(-1)}
                onClick={() => { onChange(s.name); setOpen(false); }}
                className={`px-3 py-2 cursor-pointer ${s.name === value ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                style={{ color }}
              >
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/** Modale Aggiungi/Modifica transazione */
export default function TransactionModal({
  open,
  onClose,
  onSave,
  subcats,
  initial = null,
}) {
  if (!open) return null;

  // stato form
  const [main, setMain] = useState(initial?.main || 'expense');
  const [sub, setSub] = useState(initial?.sub || '');
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(initial?.amount != null ? Math.abs(Number(initial.amount)) : '');
  const [note, setNote] = useState(initial?.note || '');
  const [showNote, setShowNote] = useState(Boolean(initial?.note));
  const [error, setError] = useState('');

  // lista sub per la main scelta
  const listForMain = useMemo(() => subcats?.[main] || [], [subcats, main]);

  // se cambio main o la sub non esiste, seleziono la prima
  useEffect(() => {
    if (!listForMain.find(s => s.name === sub)) setSub(listForMain[0]?.name || '');
  }, [listForMain, sub]);

  const mainColor = useMemo(
    () => MAIN_CATS.find(m => m.key === main)?.color || '#94a3b8',
    [main]
  );

  // validazione + normalizzazione segno
  function submit(e) {
    e?.preventDefault?.();
    setError('');
    const a = Number(amount);
    if (!sub || !date || isNaN(a) || a <= 0) {
      setError('Compila i campi obbligatori e usa un importo > 0.');
      return;
    }
    const signed = main === 'income' ? Math.abs(a) : -Math.abs(a);
    onSave({ main, sub, date, amount: signed, note: note.trim() });
  }

  return (
    <div className="fixed inset-0 z-50">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* dialog */}
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl">
          {/* header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/10">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              {initial ? 'Modifica transazione' : 'Aggiungi transazione'}
            </h3>
            <button
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={onClose}
              aria-label="Chiudi"
            >
              <X className="h-5 w-5 text-slate-700 dark:text-slate-200" />
            </button>
          </div>

          {/* form */}
          <form onSubmit={submit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* CATEGORIA */}
            <div>
              <label className="block text-sm mb-1 text-white font-semibold">Categoria</label>
              <CategorySelect value={main} onChange={(v) => setMain(v)} />
            </div>

            {/* SOTTOCATEGORIA */}
            <div>
              <label className="block text-sm mb-1 text-white font-semibold">Sottocategoria</label>
              <SubcatSelect value={sub} onChange={(v) => setSub(v)} options={listForMain} color={mainColor} />
            </div>

            {/* DATA */}
            <div>
              <label className="block text-sm mb-1 text-white font-semibold">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm
               bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            {/* IMPORTO */}
            <div>
              <label className="block text-sm mb-1 text-white font-semibold">Importo (€)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm
               bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            {/* NOTA */}
            {!showNote && (
              <div className="md:col-span-2">
                <button
                  type="button"
                  onClick={() => setShowNote(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700
                 text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <StickyNote className="h-4 w-4" />
                  Aggiungi nota
                </button>
              </div>
            )}

            {showNote && (
              <div className="md:col-span-2">
                <label className="block text-sm mb-1 text-white font-semibold">Nota</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Aggiungi una nota"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm
                 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>
            )}


            {/* ERRORE */}
            {error && (
              <div className="md:col-span-2 flex items-center gap-2 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-700/40 rounded-xl px-3 py-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {/* AZIONI */}
            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700
                           text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!sub || !date || !amount || Number(amount) <= 0}
                className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white
                           hover:opacity-90 disabled:opacity-50"
              >
                {initial ? 'Salva' : 'Aggiungi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
