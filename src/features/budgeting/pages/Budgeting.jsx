// src/features/budgeting/pages/Budgeting.jsx
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '../../ui';
import { MAIN_CATS, months } from '../../../lib/constants.js';
import { nice } from '../../../lib/utils.js';
import SvgIcon from '../../icons/components/SvgIcon.jsx';
import BudgetTable from '../components/BudgetTable.jsx';
import { buildCtxFromState, selectBudgetRows } from '../lib';
import EditableCell from '../components/EditableCell.jsx';
import TotalCell from '../components/TotalCell.jsx';
import BudgetRowActions from '../components/BudgetRowActions.jsx';

// helper utili
const CORE = new Set(['income', 'expense', 'debt', 'saving']);
const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i); // 0..11

// colore con alpha
function hexToRgba(hex, a = 1) {
  const h = String(hex || '#000000').replace('#','');
  const v = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const r = parseInt(v.slice(0,2), 16);
  const g = parseInt(v.slice(2,4), 16);
  const b = parseInt(v.slice(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function Budgeting({ state, year, upsertBudget, batchUpsertBudgets }) {
  const [selMain, setSelMain] = useState('expense');
  const [mode, setMode] = useState('year'); // 'year' | 'month'
  const [viewMode, setViewMode] = useState('semester1'); // 'semester1' | 'semester2' | 'all'
  const today = new Date();
  const defaultMonth = useMemo(() => {
    const y = Number(year);
    if (today.getFullYear() !== y) return 0;
    const m = today.getMonth();
    const d = today.getDate();
    return d >= 15 ? Math.min(m + 1, 11) : m; // dal 15 passa al prossimo mese
  }, [year]);
  const [monthIdx, setMonthIdx] = useState(defaultMonth);
  React.useEffect(() => { setMonthIdx(defaultMonth); }, [defaultMonth]);

  // Costruisci elenco main da renderizzare: solo quelli abilitati e che hanno sottocategorie
  const mainsToRender = useMemo(() => {
    const enabled = new Set([
      ...MAIN_CATS.map(m => m.key).filter(k => state.mainEnabled?.[k] !== false),
      ...(state.customMainCats || []).filter(c => state.mainEnabled?.[c.key] !== false).map(c => c.key),
    ]);
    const withSubs = Object.entries(state.subcats || {})
      .filter(([k, arr]) => Array.isArray(arr) && arr.length > 0 && enabled.has(k))
      .map(([k]) => k);
    return withSubs;
  }, [state.customMainCats, state.mainEnabled, state.subcats]);

  // 1) STATISTICHE MENSILI CON BUDGET (solo budget, no transazioni reali)
  const monthlyStats = useMemo(() => {
    const stats = {};
    for (const mi of MONTH_INDEXES) {
      const key = `${year}-${String(mi + 1).padStart(2, '0')}`;
      stats[key] = { 
        budgetTotals: {}, // totali budget per categoria
        budgetPct: {} // percentuali budget
      };
    }

    // Calcola totali budget per ogni mese (SOLO BUDGET, NO TRANSAZIONI)
    for (const mi of MONTH_INDEXES) {
      const key = `${year}-${String(mi + 1).padStart(2, '0')}`;
      const s = stats[key];
      
      // Calcola somme budget per ogni main categoria
      for (const mainKey of mainsToRender) {
        const subs = state.subcats?.[mainKey] || [];
        let mainTotal = 0;
        subs.forEach(sub => {
          const budgetValue = Number(state.budgets[year]?.[`${mainKey}:${sub.name}:${mi}`] || 0);
          mainTotal += budgetValue;
        });
        s.budgetTotals[mainKey] = mainTotal;
      }

      // CALCOLO DA ALLOCARE: Budget Reddito - Budget delle altre categorie (non reddito)
      const budgetIncome = s.budgetTotals['income'] || 0;
      const totalBudgetExpenses = Object.entries(s.budgetTotals)
        .filter(([mainKey]) => mainKey !== 'income') // ESCLUDI income dalla sottrazione
        .reduce((sum, [, val]) => sum + Math.abs(val), 0);
      
      s.toAllocate = budgetIncome - totalBudgetExpenses;
      
      const pct = (x) => budgetIncome > 0 ? Math.round((Math.abs(x) / budgetIncome) * 100) : 0;
      
      // Percentuali basate sui budget del reddito
      Object.entries(s.budgetTotals).forEach(([mainKey, total]) => {
        if (mainKey !== 'income') { // Solo per le categorie di spesa
          s.budgetPct[mainKey] = pct(total);
        }
      });
    }
    return stats;
  }, [state.budgets, state.subcats, mainsToRender, year]);

  // mains custom note (per intestare le righe in alto)
  const customMains = useMemo(() => {
    const byKey = new Set(
      (state.customMainCats || [])
        .filter(c => state.mainEnabled?.[c.key] !== false)
        .map(c => c.key)
    );
    return Array.from(byKey);
  }, [state.customMainCats, state.mainEnabled]);

  // ---- Helper: recupera metadati colore/nome per una main (core o custom)
  const mainMeta = (key) => {
    // Prima prova a leggere override dal DB (presenti in customMainCats anche per le core)
    const c = (state.customMainCats || []).find(x => x.key === key);
    if (c) return { name: c.name || key.toUpperCase(), color: c.color || '#64748b' };
    // Fallback ai default statici
    const core = MAIN_CATS.find(m => m.key === key);
    if (core) return { name: core.name, color: core.color };
    return { name: key.toUpperCase(), color: '#64748b' };
  };

  // Determina quali mesi mostrare in base alla view mode
  const visibleMonths = useMemo(() => {
    switch (viewMode) {
      case 'semester1':
        return [0, 1, 2, 3, 4, 5]; // Gen-Giu
      case 'semester2':
        return [6, 7, 8, 9, 10, 11]; // Lug-Dic
      default:
        return MONTH_INDEXES; // tutti i 12 mesi
    }
  }, [viewMode]);

  // Calcola mappa valori per mese per (main, sub)
  const mapMainSubPerMonth = useMemo(() => {
    const map = {}; // main -> sub -> {0..11}
    for (const main of mainsToRender) {
      const subs = state.subcats?.[main] || [];
      if (!subs.length) continue;
      map[main] = {};
      subs.forEach(sc => { map[main][sc.name] = Object.fromEntries(MONTH_INDEXES.map(i => [i, 0])); });
    }
    state.transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() !== Number(year)) return;
      const main = String(t.main);
      if (!map[main]) return;
      const m = d.getMonth();
      const subName = t.sub || t.subName || t.subname || t.subcategory?.name || t.Subcategory?.name;
      if (subName && map[main][subName] != null) {
        map[main][subName][m] += Number(t.amount) || 0;
      }
    });
    return map;
  }, [state.transactions, state.subcats, mainsToRender, year]);

  // Vista mensile (beta) con nuova tabella
  const periodMonthKey = useMemo(() => `${year}-${String(monthIdx + 1).padStart(2,'0')}`, [year, monthIdx]);
  const compatCtx = useMemo(() => buildCtxFromState(state, year), [state, year]);
  const monthRows = useMemo(() => selectBudgetRows({ period: periodMonthKey, ...compatCtx, prorataMode: 'equal' }), [periodMonthKey, compatCtx]);

  async function handleUpdateCell(period, categoryKey, patch) {
    if (!patch || typeof patch.amount !== 'number') return;
    const y = Number(period.slice(0,4));
    const m = Number(period.slice(5,7)) - 1; // 0..11
    const [main, sub] = String(categoryKey).split(':');
    if (!main || !sub) return;
    await upsertBudget(main, `${sub}:${m}`, Number(patch.amount) || 0);
  }

  return (
    <div className="space-y-6 pb-20"> {/* Extra padding bottom for context menus */}


      {/* SEZIONE ALTA: RIEPILOGO MENSILE (vista Anno) */}
      <Card>
        <CardContent>
          <div className="font-semibold mb-2">Riepilogo mese per mese</div>
          <div className="rounded-xl border border-slate-200/20">
            {/* Header con griglia responsive */}
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-t-xl">
              <div className="grid grid-cols-13 gap-2 text-sm font-semibold">
                <div className="text-left col-span-2 lg:col-span-1">Voce</div>
                {MONTH_INDEXES.map(i => (
                  <div key={i} className="text-center text-xs lg:text-sm">
                    {months[i].substring(0, 3).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Contenuto con griglia responsive */}
            <div className="p-4 space-y-3">
              {/* Da allocare */}
              <div className="grid grid-cols-13 gap-2 py-2 border-b border-slate-200/10">
                <div className="col-span-2 lg:col-span-1 font-semibold text-sm" style={{ color: mainMeta('income').color }}>Da allocare</div>
                {MONTH_INDEXES.map(i => {
                  const key = `${year}-${String(i + 1).padStart(2, '0')}`;
                  const monthStat = monthlyStats[key];
                  const toAllocate = monthStat?.toAllocate || 0;
                  let textColor = '#64748b'; // default color
                  let displayText = Math.round(toAllocate).toLocaleString('it-IT') + '€';
                  
                  if (toAllocate > 0) {
                    textColor = mainMeta('income').color;
                  } else if (toAllocate < 0) {
                    textColor = '#ef4444'; // rosso
                    displayText = `OVER ${Math.round(Math.abs(toAllocate)).toLocaleString('it-IT')}€`;
                  }
                  
                  return (
                    <div 
                      key={i} 
                      className="text-center font-semibold text-base" 
                      style={{ color: textColor }}
                      data-month={months[i].substring(0, 3).toUpperCase()}
                    >
                      {displayText}
                    </div>
                  );
                })}
              </div>
              
              {/* Percentuali per ogni main presente */}
              {mainsToRender
                .filter(key => key !== 'income') // escludi income
                .map(key => {
                  const meta = mainMeta(key);
                  return (
                    <div key={key} className="grid grid-cols-13 gap-2 py-2 border-b border-slate-200/10">
                      <div className="col-span-2 lg:col-span-1 text-sm" style={{ color: meta.color }}>
                        % {meta.name.toLowerCase()}
                      </div>
                      {MONTH_INDEXES.map(i => {
                        const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
                        const monthStat = monthlyStats[monthKey];
                        const percentage = monthStat?.budgetPct?.[key] || 0;
                        return (
                          <div 
                            key={i} 
                            className="text-center font-semibold text-xs" 
                            style={{ color: meta.color }}
                            data-month={months[i].substring(0, 3).toUpperCase()}
                          >
                            {percentage}%
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CONTROLLI VISUALIZZAZIONE */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <button
          onClick={() => setViewMode('semester1')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            viewMode === 'semester1' 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Semestre 1 (GEN-GIU)
        </button>
        <button
          onClick={() => setViewMode('semester2')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
            viewMode === 'semester2' 
              ? 'bg-blue-500 text-white border-blue-500' 
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
          }`}
        >
          Semestre 2 (LUG-DIC)
        </button>
      </div>

      {/* SEZIONE BASSA: UN FORM PER OGNI MAIN (core + custom con sottocategorie) */}
      {mainsToRender.map(mainKey => {
        const subs = state.subcats?.[mainKey] || [];
        if (!subs.length) return null; // salta se non ci sono sottocategorie
        const { name, color } = mainMeta(mainKey);
        const rowsActual = mapMainSubPerMonth[mainKey] || {};
        const planFor = (sub, i) => Number(state.budgets[year]?.[`${mainKey}:${sub}:${i}`] || 0);
        const dark = isDark();
        const cardBg = hexToRgba(color, dark ? 0.08 : 0.06);
        const cardBorder = hexToRgba(color, dark ? 0.35 : 0.25);
        const headBg = hexToRgba(color, dark ? 0.20 : 0.12);
        
        // Calcola totali semestri
        const semester1Total = MONTH_INDEXES.slice(0, 6).reduce((sum, i) => {
          return sum + subs.reduce((subSum, sc) => subSum + planFor(sc.name, i), 0);
        }, 0);
        const semester2Total = MONTH_INDEXES.slice(6, 12).reduce((sum, i) => {
          return sum + subs.reduce((subSum, sc) => subSum + planFor(sc.name, i), 0);
        }, 0);
        const yearTotal = semester1Total + semester2Total;
        
        return (
          <div key={mainKey}>
            {/* Card unica con entrambe le tabelle */}
            <Card style={{ borderColor: cardBorder, backgroundColor: cardBg }} className="border">
              <CardContent>
                <div className="font-semibold mb-3" style={{ color }}>{name}</div>
                <div className="flex gap-4">
                  {/* Tabella principale */}
                  <div className="flex-1">
                    <div className="rounded-xl border" style={{ borderColor: cardBorder }}>
                      {/* Vista Desktop - Tabella compatta */}
                      <div className="hidden lg:block overflow-x-auto">
                        <table className="w-full">
                          <thead style={{ backgroundColor: headBg }}>
                            <tr>
                              <th className="text-left p-2" style={{ color }}>Sottocategoria</th>
                              {visibleMonths.map(i => (
                                <th key={i} className="text-center px-3 py-2 whitespace-nowrap" style={{ color }}>
                                  {months[i].toUpperCase()}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {subs.map((sc, idx) => {
                              const totalPlanned = MONTH_INDEXES.reduce((a, i) => a + planFor(sc.name, i), 0);
                              const rowBg = hexToRgba(color, isDark() ? 0.22 : 0.12);
                              const rowAltBg = hexToRgba(color, isDark() ? 0.14 : 0.08);
                              
                              const handleSetAllMonths = async (value) => {
                                if (batchUpsertBudgets) {
                                  const updates = MONTH_INDEXES.map(monthIdx => ({
                                    main: mainKey,
                                    keyWithMonth: `${sc.name}:${monthIdx}`,
                                    value
                                  }));
                                  await batchUpsertBudgets(updates);
                                } else {
                                  for (const monthIdx of MONTH_INDEXES) {
                                    await upsertBudget(mainKey, `${sc.name}:${monthIdx}`, value);
                                  }
                                }
                              };
                              
                              const handleResetAll = async () => {
                                if (batchUpsertBudgets) {
                                  const updates = MONTH_INDEXES.map(monthIdx => ({
                                    main: mainKey,
                                    keyWithMonth: `${sc.name}:${monthIdx}`,
                                    value: 0
                                  }));
                                  await batchUpsertBudgets(updates);
                                } else {
                                  for (const monthIdx of MONTH_INDEXES) {
                                    await upsertBudget(mainKey, `${sc.name}:${monthIdx}`, 0);
                                  }
                                }
                              };
                              
                              return (
                                <tr 
                                  key={sc.id || sc.name} 
                                  className="border-t" 
                                  style={{ 
                                    borderColor: cardBorder,
                                    backgroundColor: (idx % 2 === 0) ? rowBg : rowAltBg 
                                  }}
                                >
                                  <td className="p-2" style={{ color }}>
                                    <div className="flex items-center gap-2">
                                      <SvgIcon name={sc.iconKey} color={color} size={18} />
                                      <span className="font-semibold text-sm">{sc.name}</span>
                                    </div>
                                  </td>
                                  {visibleMonths.map(i => (
                                    <td key={i} className="px-3 py-2 text-center">
                                      <EditableCell
                                        value={planFor(sc.name, i)}
                                        color={color}
                                        onSave={async (newValue) => {
                                          await upsertBudget(mainKey, `${sc.name}:${i}`, newValue);
                                        }}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabella totali e azioni a destra */}
                  <div className="w-48">
                    <div className="rounded-xl border" style={{ borderColor: cardBorder }}>
                      {/* Vista Desktop - Colonne totale/azioni */}
                      <div className="hidden lg:block">
                        <table className="w-full">
                          <thead style={{ backgroundColor: headBg }}>
                            <tr>
                              <th className="text-center px-3 py-2" style={{ color }}>Totale</th>
                              <th className="text-center px-3 py-2" style={{ color }}>Azioni</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subs.map((sc, idx) => {
                              const totalPlanned = MONTH_INDEXES.reduce((a, i) => a + planFor(sc.name, i), 0);
                              const rowBg = hexToRgba(color, isDark() ? 0.22 : 0.12);
                              const rowAltBg = hexToRgba(color, isDark() ? 0.14 : 0.08);
                              
                              const handleSetAllMonths = async (value) => {
                                if (batchUpsertBudgets) {
                                  const updates = MONTH_INDEXES.map(monthIdx => ({
                                    main: mainKey,
                                    keyWithMonth: `${sc.name}:${monthIdx}`,
                                    value
                                  }));
                                  await batchUpsertBudgets(updates);
                                } else {
                                  for (const monthIdx of MONTH_INDEXES) {
                                    await upsertBudget(mainKey, `${sc.name}:${monthIdx}`, value);
                                  }
                                }
                              };
                              
                              const handleResetAll = async () => {
                                if (batchUpsertBudgets) {
                                  const updates = MONTH_INDEXES.map(monthIdx => ({
                                    main: mainKey,
                                    keyWithMonth: `${sc.name}:${monthIdx}`,
                                    value: 0
                                  }));
                                  await batchUpsertBudgets(updates);
                                } else {
                                  for (const monthIdx of MONTH_INDEXES) {
                                    await upsertBudget(mainKey, `${sc.name}:${monthIdx}`, 0);
                                  }
                                }
                              };
                              
                              return (
                                <tr 
                                  key={sc.id || sc.name} 
                                  className="border-t" 
                                  style={{ 
                                    borderColor: cardBorder,
                                    backgroundColor: (idx % 2 === 0) ? rowBg : rowAltBg 
                                  }}
                                >
                                  <td className="px-3 py-2 text-center">
                                    <TotalCell
                                      value={totalPlanned}
                                      color={color}
                                      label={`Totale ${sc.name}`}
                                    />
                                  </td>
                                  <td className="px-3 py-2 text-center">
                                    <BudgetRowActions
                                      color={color}
                                      onSetAllMonths={handleSetAllMonths}
                                      onResetAll={handleResetAll}
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vista Mobile/Tablet - Layout a cards */}
                <div className="lg:hidden">
                  {subs.map((sc, idx) => {
                    const totalPlanned = MONTH_INDEXES.reduce((a, i) => a + planFor(sc.name, i), 0);
                    const rowBg = hexToRgba(color, isDark() ? 0.22 : 0.12);
                    
                    const handleSetAllMonths = async (value) => {
                      if (batchUpsertBudgets) {
                        const updates = MONTH_INDEXES.map(monthIdx => ({
                          main: mainKey,
                          keyWithMonth: `${sc.name}:${monthIdx}`,
                          value
                        }));
                        await batchUpsertBudgets(updates);
                      } else {
                        for (const monthIdx of MONTH_INDEXES) {
                          await upsertBudget(mainKey, `${sc.name}:${monthIdx}`, value);
                        }
                      }
                    };
                    
                    const handleResetAll = async () => {
                      if (batchUpsertBudgets) {
                        const updates = MONTH_INDEXES.map(monthIdx => ({
                          main: mainKey,
                          keyWithMonth: `${sc.name}:${monthIdx}`,
                          value: 0
                        }));
                        await batchUpsertBudgets(updates);
                      } else {
                        for (const monthIdx of MONTH_INDEXES) {
                          await upsertBudget(mainKey, `${sc.name}:${monthIdx}`, 0);
                        }
                      }
                    };
                    
                    return (
                      <div 
                        key={sc.id || sc.name} 
                        className="p-4 border-t" 
                        style={{ 
                          borderColor: cardBorder,
                          backgroundColor: rowBg 
                        }}
                      >
                        {/* Header sottocategoria */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2" style={{ color }}>
                            <SvgIcon name={sc.iconKey} color={color} size={18} />
                            <span className="font-semibold">{sc.name}</span>
                          </div>
                          <BudgetRowActions
                            color={color}
                            onSetAllMonths={handleSetAllMonths}
                            onResetAll={handleResetAll}
                          />
                        </div>
                        
                        {/* Griglia mesi */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                          {MONTH_INDEXES.map(i => (
                            <div key={i} className="bg-white bg-opacity-20 rounded-lg p-2">
                              <div className="text-xs font-medium mb-1" style={{ color, opacity: 0.8 }}>
                                {months[i].substring(0, 3)}
                              </div>
                              <EditableCell
                                value={planFor(sc.name, i)}
                                color={color}
                                onSave={async (newValue) => {
                                  await upsertBudget(mainKey, `${sc.name}:${i}`, newValue);
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Totale */}
                        <div className="flex justify-between items-center pt-2 border-t" style={{ borderColor: cardBorder }}>
                          <span className="font-medium" style={{ color }}>Totale:</span>
                          <span className="font-bold" style={{ color }}>{Math.round(totalPlanned).toLocaleString('it-IT')}€</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
