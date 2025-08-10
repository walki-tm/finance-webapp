// src/components/TransactionModal.jsx
// Modale riutilizzabile per Aggiungi/Modifica Transazione.
// Entità coinvolta: Transaction { id?, main, sub, amount, date, note }

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function TransactionModal({
  open,              // bool: visibilità della modale
  onClose,           // fn: chiusura modale
  onSave,            // fn: salvataggio (aggiunta o modifica)
  subcats,           // mappa sottocategorie per main: { income:[], expense:[], ... }
  initial,           // transazione da editare (se presente) altrimenti undefined = aggiungi
  MAIN_CATS          // costanti macro-categorie (label, key, color)
}) {
  // Stato locale della form (se initial esiste, pre-compila)
  const [main, setMain] = useState(initial?.main || 'expense');
  const [sub, setSub] = useState(initial?.sub || (subcats['expense']?.[0]?.name || ''));
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState(initial?.amount ?? '');
  const [note, setNote] = useState(initial?.note || '');

  // Quando cambia la categoria principale (main), se la sub corrente non è valida
  // seleziono la prima sottocategoria disponibile per quella main.
  useEffect(() => {
    const list = subcats[main] || [];
    if (!list.find(s => s.name === sub)) setSub(list[0]?.name || '');
  }, [main, subcats]);

  // Submit della form: normalizza i dati e chiama onSave (il parent decide se add o update)
  function submit(e) {
    e?.preventDefault?.();
    if (!sub || !date || !amount) return;
    onSave({ main, sub, date, amount: Number(amount), note });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop che chiude la modale */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-xl rounded-2xl border border-slate-200/20 bg-white dark:bg-slate-900 shadow-xl">
          {/* Header modale */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/10">
            <h3 className="text-lg font-semibold">
              {initial ? 'Modifica transazione' : 'Aggiungi transazione'}
            </h3>
            <button
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={onClose}
              aria-label="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form modale */}
          <form onSubmit={submit} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Entità: main (macro-categoria) */}
            <div>
              <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">
                Categoria
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={main}
                onChange={(e) => setMain(e.target.value)}
              >
                {MAIN_CATS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Entità: sub (sottocategoria appartenente a main) */}
            <div>
              <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">
                Sottocategoria
              </label>
              <select
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={sub}
                onChange={(e) => setSub(e.target.value)}
              >
                {(subcats[main] || []).map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Entità: date (data transazione) */}
            <div>
              <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">
                Data
              </label>
              <input
                type="date"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            {/* Entità: amount (importo in €) */}
            <div>
              <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">
                Importo (€)
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
              />
            </div>

            {/* Entità: note (campo opzionale) */}
            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-slate-600 dark:text-slate-300">
                Note (facoltative)
              </label>
              <input
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Aggiungi una nota"
              />
            </div>

            {/* Azioni */}
            <div className="md:col-span-2 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={!sub || !date || !amount}
                className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50"
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
