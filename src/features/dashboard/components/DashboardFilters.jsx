/**
 * 📄 DASHBOARD FILTERS: Sistema filtri periodo per dashboard
 * 
 * 🎯 Scopo: Replica la logica filtri del tab Transactions per la dashboard
 * 
 * 🔧 Dipendenze:
 * - Stessa logica navigation del tab Transactions
 * - Supporta day, week, month, year, range custom
 * - Calcola apiFilters per hook dati
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creato per dashboard redesign
 */

import React, { useState, useMemo } from 'react'
import { NativeSelect } from '../../ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { months } from '../../../lib/constants.js'
import { formatDateForAPI, getTodayDate } from '../../../lib/dateUtils.js'

export default function DashboardFilters({ 
  onFiltersChange,
  filterMain = 'all',
  onFilterMainChange,
  mainCategories = []
}) {
  /* ===== State periodo (stessa logica Transactions) ===== */
  const today = useMemo(() => getTodayDate(), [])  // ✅ Memoizzato per evitare ricreazione ad ogni render
  const [mode, setMode] = useState('month')          // default: mese corrente
  const [pointer, setPointer] = useState(() => getTodayDate())     // puntatore temporale
  const [panelOpen, setPanelOpen] = useState(false) // dropdown opzioni
  // Range custom
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  /* ===== Helpers date (identici a Transactions) ===== */
  const atStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
  const atEnd = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

  const mondayOfWeek = (d) => {
    const dd = new Date(d)
    const day = dd.getDay() // 0=dom,1=lun,...6=sab
    const diff = (day === 0 ? -6 : 1 - day)
    dd.setDate(dd.getDate() + diff)
    return atStart(dd)
  }

  const endOfToday = atEnd(today)

  /** Inizio del periodo SUCCESSIVO: per bloccare freccia avanti */
  const nextPeriodStart = (p, m) => {
    if (m === 'day') { const x = new Date(atStart(p)); x.setDate(x.getDate() + 1); return x }
    if (m === 'week') { const start = mondayOfWeek(p); const x = new Date(start); x.setDate(start.getDate() + 7); return x }
    if (m === 'month') { return new Date(p.getFullYear(), p.getMonth() + 1, 1) }
    if (m === 'year') { return new Date(p.getFullYear() + 1, 0, 1) }
    return endOfToday // range non naviga
  }

  /* ===== Calcolo filtri API (identico a Transactions) ===== */
  const apiFilters = useMemo(() => {
    let result

    if (mode === 'month') {
      result = {
        year: pointer.getFullYear(),
        month: pointer.getMonth() + 1,
        limit: 1000 // Dashboard carica più transazioni per calcoli
      }
    } else {
      let start, end

      if (mode === 'day') {
        start = atStart(pointer)
        end = atEnd(pointer)
      } else if (mode === 'week') {
        start = mondayOfWeek(pointer)
        const tmpEnd = new Date(start)
        tmpEnd.setDate(start.getDate() + 6)
        end = atEnd(tmpEnd)
      } else if (mode === 'year') {
        start = new Date(pointer.getFullYear(), 0, 1)
        end = new Date(pointer.getFullYear(), 11, 31, 23, 59, 59, 999)
      } else if (mode === 'range') {
        start = fromDate ? atStart(new Date(fromDate)) : atStart(today)
        end = toDate ? atEnd(new Date(toDate)) : atEnd(today)
      }

      result = {
        fromDate: formatDateForAPI(start),
        toDate: formatDateForAPI(end),
        limit: 1000
      }
    }

    return result
  }, [mode, pointer, fromDate, toDate, today])

  /* ===== Range + label per UI (identico a Transactions) ===== */
  const { label } = useMemo(() => {
    let lbl

    if (mode === 'day') {
      lbl = `${pointer.getDate()} ${months[pointer.getMonth()].toUpperCase()} ${pointer.getFullYear()}`
    }

    if (mode === 'week') {
      const start = mondayOfWeek(pointer)
      const tmpEnd = new Date(start); tmpEnd.setDate(start.getDate() + 6)
      lbl = `SETTIMANA ${start.getDate()}–${tmpEnd.getDate()} ${months[start.getMonth()].toUpperCase()} ${start.getFullYear()}`
    }

    if (mode === 'month') {
      lbl = `${months[pointer.getMonth()].toUpperCase()} ${pointer.getFullYear()}`
    }

    if (mode === 'year') {
      lbl = `${pointer.getFullYear()}`
    }

    if (mode === 'range') {
      const start = fromDate ? atStart(new Date(fromDate)) : atStart(today)
      const end = toDate ? atEnd(new Date(toDate)) : atEnd(today)
      const fmt = (d) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      lbl = `${fmt(start)} → ${fmt(end)}`
    }

    return { label: lbl }
  }, [mode, pointer, fromDate, toDate])

  /* ===== Navigazione con frecce ===== */
  const goPrev = () => {
    const p = new Date(pointer)
    if (mode === 'day') p.setDate(p.getDate() - 1)
    if (mode === 'week') p.setDate(p.getDate() - 7)
    if (mode === 'month') p.setMonth(p.getMonth() - 1)
    if (mode === 'year') p.setFullYear(p.getFullYear() - 1)
    setPointer(p)
  }

  const goNext = () => {
    if (mode === 'range') return // range non naviga

    // Blocca se l'INIZIO del prossimo periodo è nel futuro
    if (nextPeriodStart(pointer, mode) > endOfToday) return

    const p = new Date(pointer)
    if (mode === 'day') p.setDate(p.getDate() + 1)
    if (mode === 'week') p.setDate(p.getDate() + 7)
    if (mode === 'month') p.setMonth(p.getMonth() + 1)
    if (mode === 'year') p.setFullYear(p.getFullYear() + 1)
    setPointer(p)
  }

  // Disabilita freccia destra quando periodo futuro
  const disableNext = mode !== 'range' && nextPeriodStart(pointer, mode) > endOfToday

  /* ===== Effect per notificare parent dei filtri ===== */
  React.useEffect(() => {
    const filters = {
      apiFilters,
      mode,
      pointer,
      rangeStart: mode === 'range' && fromDate ? atStart(new Date(fromDate)) : 
                  mode === 'day' ? atStart(pointer) :
                  mode === 'week' ? mondayOfWeek(pointer) :
                  mode === 'month' ? new Date(pointer.getFullYear(), pointer.getMonth(), 1) :
                  mode === 'year' ? new Date(pointer.getFullYear(), 0, 1) : null,
      rangeEnd: mode === 'range' && toDate ? atEnd(new Date(toDate)) :
                mode === 'day' ? atEnd(pointer) :
                mode === 'week' ? (() => { const s = mondayOfWeek(pointer); const e = new Date(s); e.setDate(s.getDate() + 6); return atEnd(e) })() :
                mode === 'month' ? new Date(pointer.getFullYear(), pointer.getMonth() + 1, 0, 23, 59, 59, 999) :
                mode === 'year' ? new Date(pointer.getFullYear(), 11, 31, 23, 59, 59, 999) : null,
      label
    }
    onFiltersChange?.(filters)
  }, [apiFilters, mode, pointer, fromDate, toDate, label]) // ✅ onFiltersChange rimosso dalle dipendenze per evitare loop

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      {/* Selettore periodo */}
      <div className="flex items-center gap-2">
        <button
          onClick={goPrev}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Indietro"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* LABEL PERIODO */}
        {mode !== 'range' ? (
          <div className="relative">
            <button
              onClick={() => setPanelOpen(v => !v)}
              className="px-4 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors font-medium min-w-0"
              aria-label="Apri opzioni periodo"
            >
              {label}
            </button>

            {panelOpen && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setPanelOpen(false)} 
                />
                <div className="absolute z-20 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl p-2">
                  <div className="text-xs px-2 pb-1 opacity-70">Seleziona vista</div>
                  <button 
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setMode('day'); setPointer(today); setPanelOpen(false) }}
                  >
                    OGGI
                  </button>
                  <button 
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setMode('week'); setPointer(today); setPanelOpen(false) }}
                  >
                    QUESTA SETTIMANA
                  </button>
                  <button 
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setMode('month'); setPointer(today); setPanelOpen(false) }}
                  >
                    QUESTO MESE
                  </button>
                  <button 
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setMode('year'); setPointer(today); setPanelOpen(false) }}
                  >
                    QUEST&apos;ANNO
                  </button>
                  <div className="border-t my-1 border-slate-200 dark:border-slate-700" />
                  <button 
                    className="w-full text-left px-2 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                    onClick={() => { setMode('range'); setPanelOpen(false) }}
                  >
                    DA – A
                  </button>
                </div>
              </>
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
            <span className="text-slate-400">→</span>
            <input
              type="date"
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              aria-label="Data a"
            />
            <button
              className="px-3 py-2 rounded-xl text-sm bg-gradient-to-tr from-sky-600 to-indigo-600 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              onClick={() => {
                if (!fromDate || !toDate) { setMode('month'); setPointer(today); return }
                // I filtri vengono applicati automaticamente
              }}
              disabled={!fromDate || !toDate}
            >
              Applica
            </button>
            <button
              className="px-3 py-2 rounded-xl text-sm border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => { setMode('month'); setPointer(today) }}
            >
              Annulla
            </button>
          </div>
        )}

        <button
          onClick={goNext}
          className={`p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${disableNext ? 'opacity-40 cursor-not-allowed' : ''}`}
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
        onChange={onFilterMainChange}
        options={[
          { value: 'all', label: 'Tutte le categorie' }, 
          ...mainCategories.map(m => ({ value: m.key, label: m.name }))
        ]}
      />
    </div>
  )
}
