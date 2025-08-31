import React, { useMemo, useState } from 'react';
import { Card, CardContent, NativeSelect, Button } from '../../ui';
import TransactionTable from '../components/TransactionTable.jsx';
import PlannedTransactionsTab from '../components/PlannedTransactionsTab.jsx';
import { MAIN_CATS, months } from '../../../lib/constants.js';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

/**
 * Pagina Transazioni
 * - Sub-tab Register: comportamento attuale con selettore periodo e tabella
 * - Sub-tab Planned: gestione transazioni pianificate con gruppi e schedulazione
 * - Intestazione: selettore periodo ← DATO → con menu (OGGI, SETTIMANA, MESE, ANNO, DA–A)
 * - Frecce mai nel futuro: il blocco avviene se l'INIZIO del prossimo periodo è > oggi.
 * - Filtro categoria MAIN a destra.
 * - Tabella: ordinata per data desc e filtrata per periodo + categoria.
 */

export default function Transactions({ state, updateTx, delTx, openTxEditor, refreshTransactions }) {
  /* ===== Sub-tab state ===== */
  const [activeTab, setActiveTab] = useState('register');
  /* ===== Filtro macro-categoria ===== */
  const [filterMain, setFilterMain] = useState('all');

  /* ===== Stato selettore periodo ===== */
  // mode: 'day' | 'week' | 'month' | 'year' | 'range'
  const today = new Date();
  const [mode, setMode] = useState('month');           // default: mese corrente
  const [pointer, setPointer] = useState(new Date());  // puntatore temporale
  const [panelOpen, setPanelOpen] = useState(false);   // dropdown opzioni
  // range custom
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  /* ===== Helpers date ===== */
  const atStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const atEnd   = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

  const mondayOfWeek = (d) => {
    const dd = new Date(d);
    const day = dd.getDay(); // 0=dom,1=lun,...6=sab
    const diff = (day === 0 ? -6 : 1 - day);
    dd.setDate(dd.getDate() + diff);
    return atStart(dd);
  };

  const endOfToday = atEnd(today);

  /** Inizio del periodo corrente per pointer+mode */
  const periodStart = (p, m) => {
    if (m === 'day')   return atStart(p);
    if (m === 'week')  return mondayOfWeek(p);
    if (m === 'month') return new Date(p.getFullYear(), p.getMonth(), 1);
    if (m === 'year')  return new Date(p.getFullYear(), 0, 1);
    return atStart(today);
  };

  /** Inizio del periodo SUCCESSIVO: usato per bloccare la freccia avanti */
  const nextPeriodStart = (p, m) => {
    if (m === 'day')   { const x = new Date(atStart(p)); x.setDate(x.getDate() + 1); return x; }
    if (m === 'week')  { const start = mondayOfWeek(p); const x = new Date(start); x.setDate(start.getDate() + 7); return x; }
    if (m === 'month') { return new Date(p.getFullYear(), p.getMonth() + 1, 1); }
    if (m === 'year')  { return new Date(p.getFullYear() + 1, 0, 1); }
    return endOfToday; // range non naviga
  };

  /* ===== Calcolo range + etichetta ===== */
  const { rangeStart, rangeEnd, label } = useMemo(() => {
    let start, end, lbl;

    if (mode === 'day') {
      start = atStart(pointer);
      end = atEnd(pointer);
      lbl = `${pointer.getDate()} ${months[pointer.getMonth()].toUpperCase()} ${pointer.getFullYear()}`;
    }

    if (mode === 'week') {
      start = mondayOfWeek(pointer);
      const tmpEnd = new Date(start); tmpEnd.setDate(start.getDate() + 6);
      end = atEnd(tmpEnd);
      lbl = `SETTIMANA ${start.getDate()}–${tmpEnd.getDate()} ${months[start.getMonth()].toUpperCase()} ${start.getFullYear()}`;
    }

    if (mode === 'month') {
      start = new Date(pointer.getFullYear(), pointer.getMonth(), 1);
      end   = new Date(pointer.getFullYear(), pointer.getMonth() + 1, 0, 23, 59, 59, 999);
      lbl   = `${months[pointer.getMonth()].toUpperCase()} ${pointer.getFullYear()}`;
    }

    if (mode === 'year') {
      start = new Date(pointer.getFullYear(), 0, 1);
      end   = new Date(pointer.getFullYear(), 11, 31, 23, 59, 59, 999);
      lbl   = `${pointer.getFullYear()}`;
    }

    if (mode === 'range') {
      start = fromDate ? atStart(new Date(fromDate)) : atStart(today);
      end   = toDate   ? atEnd(new Date(toDate))     : atEnd(today);
      const fmt = (d) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
      lbl   = `${fmt(start)} → ${fmt(end)}`;
    }

    return { rangeStart: start, rangeEnd: end, label: lbl };
  }, [mode, pointer, fromDate, toDate]);

  /* ===== Navigazione con frecce ===== */
  const goPrev = () => {
    const p = new Date(pointer);
    if (mode === 'day')   p.setDate(p.getDate() - 1);
    if (mode === 'week')  p.setDate(p.getDate() - 7);
    if (mode === 'month') p.setMonth(p.getMonth() - 1);
    if (mode === 'year')  p.setFullYear(p.getFullYear() - 1);
    setPointer(p);
  };

  const goNext = () => {
    if (mode === 'range') return; // range non naviga

    // Blocca se l'INIZIO del prossimo periodo è nel futuro
    if (nextPeriodStart(pointer, mode) > endOfToday) return;

    const p = new Date(pointer);
    if (mode === 'day')   p.setDate(p.getDate() + 1);
    if (mode === 'week')  p.setDate(p.getDate() + 7);
    if (mode === 'month') p.setMonth(p.getMonth() + 1);
    if (mode === 'year')  p.setFullYear(p.getFullYear() + 1);
    setPointer(p);
  };

  // Disabilita freccia destra quando l'inizio del prossimo periodo è nel futuro
  const disableNext = mode !== 'range' && nextPeriodStart(pointer, mode) > endOfToday;

  /* ===== Filtraggio & Ordinamento ===== */
  const rows = useMemo(() => {
    const filtered = state.transactions.filter((t) => {
      const d = new Date(t.date);
      const inRange = d >= rangeStart && d <= rangeEnd;
      const mainOk = filterMain === 'all' ? true : t.main === filterMain;
      return inRange && mainOk;
    });
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
    return filtered;
  }, [state.transactions, filterMain, rangeStart, rangeEnd]);

  /* ===== UI ===== */
  return (
    <div className="space-y-6">
      {/* Header con tab navigation e CTA contestualizzata */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('register')}
            className={`px-3 py-2 rounded-xl text-sm transition
              ${activeTab === 'register'
                ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white'
                : 'border border-slate-300 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/60'}`}
          >
            Register
          </button>
          <button
            onClick={() => setActiveTab('planned')}
            className={`px-3 py-2 rounded-xl text-sm transition
              ${activeTab === 'planned'
                ? 'bg-gradient-to-tr from-sky-600 to-indigo-600 text-white'
                : 'border border-slate-300 dark:border-slate-700 hover:bg-white/60 dark:hover:bg-slate-900/60'}`}
          >
            Planned
          </button>
        </div>
        
        {/* CTA solo per Register */}
        {activeTab === 'register' && (
          <Button
            onClick={() => {
              if (typeof openTxEditor === 'function') openTxEditor();
            }}
            className="flex items-center gap-2 bg-gradient-to-tr from-sky-600 to-indigo-600"
          >
            <Plus className="h-4 w-4" />
            Nuova Transazione
          </Button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === 'register' ? (
        <div className="grid lg:grid-cols-1 gap-4">
          <Card className="lg:col-span-1">
            <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            {/* Selettore periodo */}
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Indietro"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              {/* DATO */}
              {mode !== 'range' ? (
                <div className="relative">
                  <button
                    onClick={() => setPanelOpen(v => !v)}
                    className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    aria-label="Apri opzioni periodo"
                  >
                    {label}
                  </button>

                  {panelOpen && (
                    <div className="absolute z-20 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2">
                      <div className="text-xs px-2 pb-1 opacity-70">Seleziona vista</div>
                      <button className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => { setMode('day');   setPointer(today); setPanelOpen(false); }}>OGGI</button>
                      <button className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => { setMode('week');  setPointer(today); setPanelOpen(false); }}>QUESTA SETTIMANA</button>
                      <button className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => { setMode('month'); setPointer(today); setPanelOpen(false); }}>QUESTO MESE</button>
                      <button className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => { setMode('year');  setPointer(today); setPanelOpen(false); }}>QUEST&apos;ANNO</button>
                      <div className="border-t my-1 border-slate-200 dark:border-slate-700" />
                      <button className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                              onClick={() => { setMode('range'); setPanelOpen(false); }}>DA – A</button>
                    </div>
                  )}
                </div>
              ) : (
                // Modalità "DA–A"
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    aria-label="Data da"
                  />
                  <span>→</span>
                  <input
                    type="date"
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    aria-label="Data a"
                  />
                  <button
                    className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50"
                    onClick={() => {
                      if (!fromDate || !toDate) { setMode('month'); setPointer(today); return; }
                      // useMemo ricalcola range/label
                    }}
                    disabled={!fromDate || !toDate}
                  >
                    Applica
                  </button>
                  <button
                    className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setMode('month'); setPointer(today); }}
                  >
                    Annulla
                  </button>
                </div>
              )}

              <button
                onClick={goNext}
                className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${disableNext ? 'opacity-40 cursor-not-allowed' : ''}`}
                aria-label="Avanti"
                disabled={disableNext}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Filtro CATEGORIA MAIN */}
            <NativeSelect
              className="w-48"
              value={filterMain}
              onChange={(v) => setFilterMain(v)}
              options={[{ value: 'all', label: 'Tutte le categorie' }, ...MAIN_CATS.map(m => ({ value: m.key, label: m.name }))]}
            />
          </div>

              {/* Tabella transazioni */}
              <div className="-mx-2 md:mx-0 overflow-x-hidden">
                <TransactionTable
                  rows={rows}
                  state={state}
                  onEdit={(t) => { if (typeof openTxEditor === 'function') openTxEditor(t); }}
                  onDelete={(t) => delTx(t.id)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <PlannedTransactionsTab state={state} refreshTransactions={refreshTransactions} />
      )}
    </div>
  );
}
