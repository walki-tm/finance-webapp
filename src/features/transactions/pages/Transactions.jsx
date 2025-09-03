import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent, NativeSelect, Button } from '../../ui';
import TransactionTable from '../components/TransactionTable.jsx';
import PlannedTransactionsTab from '../components/PlannedTransactionsTab.jsx';
import { MAIN_CATS, months } from '../../../lib/constants.js';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTransactions } from '../useTransactions.js';
import { api } from '../../../lib/api.js';
import { formatDateForAPI, getTodayDate } from '../../../lib/dateUtils.js';

/**
 * Pagina Transazioni
 * - Sub-tab Register: comportamento attuale con selettore periodo e tabella
 * - Sub-tab Planned: gestione transazioni pianificate con gruppi e schedulazione
 * - Intestazione: selettore periodo ← DATO → con menu (OGGI, SETTIMANA, MESE, ANNO, DA–A)
 * - Frecce mai nel futuro: il blocco avviene se l'INIZIO del prossimo periodo è > oggi.
 * - Filtro categoria MAIN a destra.
 * - Tabella: ordinata per data desc e filtrata per periodo + categoria.
 */

export default function Transactions({ state, updateTx, delTx, openTxEditor, refreshTransactions, token }) {
  console.log('🏪 Transactions props:', { updateTx, delTx, refreshTransactions });
  /* ===== Sub-tab state ===== */
  const [activeTab, setActiveTab] = useState('register');
  /* ===== Filtro macro-categoria ===== */
  const [filterMain, setFilterMain] = useState('all');

  /* ===== Stato selettore periodo ===== */
  // mode: 'day' | 'week' | 'month' | 'year' | 'range'
  const today = getTodayDate();
  const [mode, setMode] = useState('month');           // default: mese corrente
  const [pointer, setPointer] = useState(() => {
    const currentDate = getTodayDate();
    console.log('🗺 [INIT] Initializing pointer with today:', currentDate);
    return currentDate;
  });  // puntatore temporale
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

  /* ===== Calcolo filtri API in base al periodo selezionato ===== */
  const apiFilters = useMemo(() => {
    
    let result;
    
    if (mode === 'month') {
      // Per mese, usa year/month per compatibilità
      result = {
        year: pointer.getFullYear(),
        month: pointer.getMonth() + 1,
        limit: 200
      };
    } else {
      // Per tutti gli altri modi, usa fromDate/toDate
      let start, end;
      
      if (mode === 'day') {
        start = atStart(pointer);
        end = atEnd(pointer);
      } else if (mode === 'week') {
        start = mondayOfWeek(pointer);
        const tmpEnd = new Date(start); 
        tmpEnd.setDate(start.getDate() + 6);
        end = atEnd(tmpEnd);
      } else if (mode === 'year') {
        start = new Date(pointer.getFullYear(), 0, 1);
        end = new Date(pointer.getFullYear(), 11, 31, 23, 59, 59, 999);
      } else if (mode === 'range') {
        start = fromDate ? atStart(new Date(fromDate)) : atStart(today);
        end = toDate ? atEnd(new Date(toDate)) : atEnd(today);
      }
      
      result = {
        fromDate: formatDateForAPI(start),
        toDate: formatDateForAPI(end),
        limit: 200
      };
    }
    
    console.log('📅 Transactions.jsx: apiFilters calculated:', { mode, pointer, result });
    return result;
  }, [mode, pointer, fromDate, toDate, today]);

  /* ===== Hook per caricare transazioni con filtri dinamici ===== */
  const transactionState = useTransactions(token, apiFilters);
  
  // Wrapper per operazioni che richiedono refresh
  const handleDelete = useCallback(async (id) => {
    console.log('🗑️ Local delete wrapper:', id);
    await delTx(id); // Chiama la funzione globale
    // Refresh dei dati locali dopo l'operazione
    setTimeout(() => {
      console.log('🔄 Refreshing local transactions after delete');
      transactionState.refreshTransactions();
    }, 200);
  }, [delTx, transactionState]);
  
  // Listener per refresh globale (quando si aggiunge transazione dalla modale)
  React.useEffect(() => {
    const handleGlobalRefresh = () => {
      console.log('🌍 Global refresh event received, refreshing local transactions');
      setTimeout(() => {
        transactionState.refreshTransactions();
      }, 100);
    };
    
    window.addEventListener('transactionRefresh', handleGlobalRefresh);
    return () => window.removeEventListener('transactionRefresh', handleGlobalRefresh);
  }, [transactionState]);
  
  console.log('🏪 Transactions component: transactionState =', {
    transactions: transactionState.transactions,
    length: transactionState.transactions?.length,
    loading: transactionState.loading
  });

  /* ===== Helper per normalizzare le transazioni ===== */
  const normalizeMainKey = (main) => {
    const u = String(main || 'EXPENSE').toUpperCase();
    const map = { INCOME: 'income', EXPENSE: 'expense', DEBT: 'debt', SAVINGS: 'saving', SAVING: 'saving' };
    return map[u] || u.toLowerCase();
  };


  /* ===== Calcolo range + etichetta per UI ===== */
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
      
      console.log('📅 [DEBUG] Month label calculation:');
      console.log('  - pointer:', pointer);
      console.log('  - pointer.getMonth():', pointer.getMonth());
      console.log('  - months[pointer.getMonth()]:', months[pointer.getMonth()]);
      console.log('  - final label:', lbl);
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
    
    // I nuovi filtri verranno applicati automaticamente tramite apiFilters
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
    
    // I nuovi filtri verranno applicati automaticamente tramite apiFilters
  };

  // Disabilita freccia destra quando l'inizio del prossimo periodo è nel futuro
  const disableNext = mode !== 'range' && nextPeriodStart(pointer, mode) > endOfToday;

  /* ===== Filtraggio solo per categoria (il range è già gestito dall'API) ===== */
  const rows = useMemo(() => {
    console.log('🔍 Transactions component: processing transactions', {
      rawTransactions: transactionState.transactions,
      length: transactionState.transactions?.length || 0,
      filterMain
    });
    
    if (!transactionState.transactions) return [];
    
    const filtered = transactionState.transactions.filter((t) => {
      const mainOk = filterMain === 'all' ? true : t.main === filterMain;
      return mainOk;
    });
    
    console.log('✅ Filtered transactions for display:', {
      filteredCount: filtered.length,
      firstFew: filtered.slice(0, 3)
    });
    
    // Le transazioni dall'API sono già ordinate per data desc
    return filtered;
  }, [transactionState.transactions, filterMain]);

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
                      // I nuovi filtri verranno applicati automaticamente tramite apiFilters
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
                  onDelete={(t) => handleDelete(t.id)}
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
