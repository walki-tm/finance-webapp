// src/components/TransactionModal.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, AlertCircle, StickyNote, ChevronDown, TrendingUp, ShoppingCart, CreditCard, PiggyBank } from 'lucide-react';
import { MAIN_CATS } from '../lib/constants.js';
import SvgIcon from './SvgIcon.jsx';

/* ===== utils ===== */
function hexToRgba(hex, a = 1) {
  const h = (hex || '#000000').replace('#', '');
  const v = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}
const isDark = () =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

function useDropdown(onClose) {
  const [open, setOpen] = useState(false);
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
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return { open, setOpen, ref };
}

/* mappa icone per le 4 core */
const CORE_MAIN_ICONS = {
  income: TrendingUp,
  expense: ShoppingCart,
  debt: CreditCard,
  saving: PiggyBank,
};

/* ===== CategorySelect: mostra anche icone + rispetta 'enabled' ===== */
function CategorySelect({ value, onChange, mains = [] }) {
  const dark = isDark();

  // pool = merge passato dal parent, altrimenti MAIN_CATS
  const POOL = Array.isArray(mains) && mains.length > 0 ? mains : MAIN_CATS;
  // nascondi main con enabled === false
  const LIST = POOL.filter(m => m.enabled !== false);

  // selezionata o fallback
  const selected =
    LIST.find(c => c.key === value) ||
    LIST[0] ||
    { key: 'expense', name: 'SPESE', color: '#5B86E5' };

  const { open, setOpen, ref } = useDropdown();
  const mainColor = selected.color;

  const badgeStyle = {
    backgroundColor: hexToRgba(mainColor, dark ? 0.24 : 0.18),
    color: mainColor,
    border: `1px solid ${hexToRgba(mainColor, 0.55)}`
  };

  // se la main corrente sparisce dai visibili, spostati sulla prima disponibile
  useEffect(() => {
    if (!LIST.some(c => c.key === value) && LIST[0]) onChange?.(LIST[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [LIST.map(c => `${c.key}:${c.enabled !== false}`).join('|')]);

  const RenderMainChip = ({ m }) => {
    const CoreIcon = CORE_MAIN_ICONS[m.key];
    return (
      <span
        className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wide px-2 py-1 rounded-lg"
        style={{
          backgroundColor: hexToRgba(m.color, dark ? 0.24 : 0.18),
          color: m.color,
          border: `1px solid ${hexToRgba(m.color, 0.55)}`
        }}
      >
        {/* se custom e ha iconKey -> SvgIcon; altrimenti icona core se disponibile */}
        {m.iconKey
          ? <SvgIcon name={m.iconKey} size={14} color={m.color} />
          : (CoreIcon ? <CoreIcon className="h-4 w-4" /> : null)}
        {m.name}
      </span>
    );
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-2 py-2 text-sm border focus:outline-none flex items-center justify-between"
        style={{
          borderColor: hexToRgba(mainColor, 0.55),
          backgroundColor: hexToRgba(mainColor, dark ? 0.16 : 0.12)
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <RenderMainChip m={selected} />
        <ChevronDown className="h-4 w-4" style={{ color: mainColor }} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {LIST.map((c) => (
              <li
                key={c.key}
                role="option"
                onClick={() => { onChange(c.key); setOpen(false); }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <RenderMainChip m={c} />
              </li>
            ))}
            {LIST.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-500">Nessuna categoria visibile</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ===== SubcatSelect: bolla con icona svg e testo tinto dalla main ===== */
function SubcatSelect({ value, onChange, options = [], color }) {
  const selected = options.find(s => s.name === value) || options[0] || { name: '—' };
  const { open, setOpen, ref } = useDropdown();
  const dark = isDark();

  const IconBubble = ({ iconKey }) => (
    <span
      className="inline-flex items-center justify-center rounded-full"
      style={{
        width: 22, height: 22,
        border: `2px solid ${color}`,
        color
      }}
    >
      <SvgIcon name={iconKey} size={14} color={color} />
    </span>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full rounded-xl px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-between"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <IconBubble iconKey={selected.iconKey} />
          <span className="font-semibold" style={{ color: dark ? '#ffffff' : color }}>
            {selected.name}
          </span>
        </span>
        <ChevronDown className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          <ul role="listbox" className="py-1 max-h-64 overflow-auto">
            {options.map((s) => (
              <li
                key={s.name}
                role="option"
                onClick={() => { onChange(s.name); setOpen(false); }}
                className="px-3 py-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="inline-flex items-center gap-2" style={{ color: dark ? '#ffffff' : color }}>
                  <IconBubble iconKey={s.iconKey} />
                  <span className="font-semibold">{s.name}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ===== Modale Aggiungi/Modifica transazione ===== */
export default function TransactionModal({
  open,
  onClose,
  onSave,
  subcats,
  /** mains opzionale: array unito core+custom, con { key, name, color, enabled, iconKey? } */
  mains = [],
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

  // quando cambio main, allinea la sub
  useEffect(() => {
    if (!listForMain.find(s => s.name === sub)) setSub(listForMain[0]?.name || '');
  }, [listForMain, sub]);

  // colore main corrente (anche custom)
  const mainColor = useMemo(() => {
    const pool = (Array.isArray(mains) && mains.length > 0) ? mains : MAIN_CATS;
    return pool.find(m => m.key === main)?.color || '#94a3b8';
  }, [mains, main]);

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
            {/* CATEGORIA (usa mains incluse custom) */}
            <div>
              <label className="block text-sm mb-1 font-semibold">Categoria</label>
              <CategorySelect value={main} onChange={(v) => setMain(v)} mains={mains} />
            </div>

            {/* SOTTOCATEGORIA */}
            <div>
              <label className="block text-sm mb-1 font-semibold">Sottocategoria</label>
              <SubcatSelect
                value={sub}
                onChange={(v) => setSub(v)}
                options={listForMain}
                color={mainColor}
              />
            </div>

            {/* DATA */}
            <div>
              <label className="block text-sm mb-1 font-semibold">Data</label>
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
              <label className="block text-sm mb-1 font-semibold">Importo (€)</label>
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

            {/* NOTA (toggle) */}
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
                <label className="block text-sm mb-1 font-semibold">Nota</label>
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
