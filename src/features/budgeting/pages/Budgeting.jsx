// src/features/budgeting/pages/Budgeting.jsx
import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent } from '../../ui';
import { MAIN_CATS, months } from '../../../lib/constants.js';
import { nice } from '../../../lib/utils.js';
import SvgIcon from '../../icons/components/SvgIcon.jsx';
import BudgetTable from '../components/BudgetTable.jsx';
import { buildCtxFromState, selectBudgetRows } from '../lib';
import EditableCell from '../components/EditableCell.jsx';
import TotalCell from '../components/TotalCell.jsx';
import BudgetRowActions from '../components/BudgetRowActions.jsx';
import IncomeConfigSection from '../components/IncomeConfigSection.jsx';
import CategoryConfigSection from '../components/CategoryConfigSection.jsx';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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

export default function Budgeting({ state, year, upsertBudget, batchUpsertBudgets, isManagedAutomatically }) {
  const [selMain, setSelMain] = useState('expense');
  const [mode, setMode] = useState('year'); // 'year' | 'month'
  const [viewMode, setViewMode] = useState('semester1'); // 'semester1' | 'semester2'
  const [darkMode, setDarkMode] = useState(() => isDark());
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11 per Jan-Dec
  const defaultMonth = useMemo(() => {
    const y = Number(year);
    if (today.getFullYear() !== y) return 0;
    const m = today.getMonth();
    const d = today.getDate();
    return d >= 15 ? Math.min(m + 1, 11) : m; // dal 15 passa al prossimo mese
  }, [year]);
  const [monthIdx, setMonthIdx] = useState(defaultMonth);
  React.useEffect(() => { setMonthIdx(defaultMonth); }, [defaultMonth]);

  // Hook per rilevare cambiamenti tema
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setDarkMode(isDark());
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Hook per gestire il cambio semestre dalle sezioni espanse
  useEffect(() => {
    const handleSemesterChange = (event) => {
      setViewMode(event.detail);
    };

    window.addEventListener('changeSemester', handleSemesterChange);
    return () => {
      window.removeEventListener('changeSemester', handleSemesterChange);
    };
  }, []);

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
      
      // Percentuali basate sui budget del reddito - SOLO SE c'è reddito
      if (budgetIncome > 0) {
        const pct = (x) => Math.round((Math.abs(x) / budgetIncome) * 100);
        Object.entries(s.budgetTotals).forEach(([mainKey, total]) => {
          if (mainKey !== 'income') { // Solo per le categorie di spesa
            s.budgetPct[mainKey] = pct(total);
          }
        });
      } else {
        // Se non c'è reddito, tutte le percentuali sono 0
        Object.keys(s.budgetTotals).forEach(mainKey => {
          if (mainKey !== 'income') {
            s.budgetPct[mainKey] = 0;
          }
        });
      }
      
      // Flag di avvertenza se le spese > reddito
      s.hasWarning = totalBudgetExpenses > budgetIncome && budgetIncome > 0;
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

  // ---- Helper: recupera metadati colore/nome/icona per una main (core o custom)
  const mainMeta = (key) => {
    // Prima prova a leggere override dal DB (presenti in customMainCats anche per le core)
    const c = (state.customMainCats || []).find(x => x.key === key);
    if (c) return { name: c.name || key.toUpperCase(), color: c.color || '#64748b', iconKey: c.iconKey };
    // Fallback ai default statici
    const core = MAIN_CATS.find(m => m.key === key);
    if (core) return { name: core.name, color: core.color, iconKey: core.iconKey };
    return { name: key.toUpperCase(), color: '#64748b', iconKey: null };
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

  // Helper per ottenere status del mese
  const getMonthStatus = (toAllocate) => {
    if (toAllocate < 0) return { status: 'over', icon: '⚠️', color: '#ef4444', bgColor: '#fef2f2' };
    if (toAllocate > 0) return { status: 'unallocated', icon: '💰', color: '#f59e0b', bgColor: '#fffbeb' };
    return { status: 'balanced', icon: '✅', color: '#10b981', bgColor: '#f0fdf4' };
  };

  // Calcola statistiche per il riepilogo cards
  // Stato per gestire quale categoria è espansa
  const [expandedCategory, setExpandedCategory] = useState(null);

  const summaryStats = useMemo(() => {
    // Totale da allocare di tutti i mesi dell'anno
    const yearlyToAllocate = MONTH_INDEXES.reduce((sum, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      return sum + (monthlyStats[key]?.toAllocate || 0);
    }, 0);
    
    // Calcola totali annuali per reddito e spese
    const yearlyIncome = MONTH_INDEXES.reduce((sum, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      return sum + (monthlyStats[key]?.budgetTotals?.['income'] || 0);
    }, 0);
    
    const yearlyExpenses = MONTH_INDEXES.reduce((sum, i) => {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      const monthStat = monthlyStats[key];
      if (!monthStat) return sum;
      return sum + Object.entries(monthStat.budgetTotals)
        .filter(([mainKey]) => mainKey !== 'income')
        .reduce((monthSum, [, val]) => monthSum + Math.abs(val), 0);
    }, 0);
    
    // Determina se c'è sovra-spesa
    const isOverBudget = yearlyExpenses > yearlyIncome && yearlyIncome > 0;
    
    // Calcola statistiche per TUTTE le categorie main (incluso income per Da Allocare)
    const allCategoryStats = {};
    
    // Prima aggiungi la categoria income per "Reddito"
    const incomeMeta = mainMeta('income');
    allCategoryStats['income'] = {
      meta: { ...incomeMeta },
      yearlyPercentage: 100, // Il reddito è sempre 100% di se stesso
      yearlyAmount: Math.round(yearlyIncome),
      isToAllocate: true,
      toAllocateValue: yearlyToAllocate,
      isOverBudget: yearlyToAllocate < 0
    };
    
    // Poi aggiungi tutte le altre categorie
    mainsToRender
      .filter(key => key !== 'income')
      .forEach(key => {
        const meta = mainMeta(key);
        // Totale annuo della categoria
        const yearlyAmount = MONTH_INDEXES.reduce((sum, i) => {
          const monthKey = `${year}-${String(i + 1).padStart(2, '0')}`;
          return sum + (monthlyStats[monthKey]?.budgetTotals?.[key] || 0);
        }, 0);
        
        // Percentuale annua sul reddito totale annuo
        const yearlyPercentage = yearlyIncome > 0 
          ? Math.round((yearlyAmount / yearlyIncome) * 100)
          : 0;
        
        allCategoryStats[key] = { 
          meta, 
          yearlyPercentage,
          yearlyAmount: Math.round(yearlyAmount),
          isToAllocate: false
        };
      });
    
    return {
      yearlyToAllocate,
      yearlyIncome,
      yearlyExpenses,
      isOverBudget,
      allCategoryStats
    };
  }, [monthlyStats, year, mainsToRender, mainMeta]);

  return (
    <div className="space-y-6 pb-20"> {/* Extra padding bottom for context menus */}

      {/* SEZIONE ALTA: CARDS RIEPILOGO BUDGET */}
      <div className="space-y-4">
        {/* Cards principali - Layout responsive con 2 card per riga su desktop */}
        <div className="space-y-4">
          {/* Griglia delle cards con distribuzione intelligente dei colori */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(summaryStats.allCategoryStats)
              .sort(([,a], [,b]) => {
                // Da Allocare sempre per primo, poi ordina per percentuale
                if (a.isToAllocate) return -1;
                if (b.isToAllocate) return 1;
                return b.yearlyPercentage - a.yearlyPercentage;
              })
              .map(([key, stats]) => {
                const isExpanded = expandedCategory === key;
                const isToAllocate = stats.isToAllocate;
                const cardColor = isToAllocate && stats.isOverBudget ? '#ef4444' : stats.meta.color;
                
                return (
                  <div key={key} className={`w-full ${isExpanded ? 'lg:col-span-2' : ''}`}>
                    {/* Card principale */}
                    <button
                      onClick={() => setExpandedCategory(isExpanded ? null : key)}
                      className="group w-full transition-all duration-300 transform hover:scale-[1.02] focus:outline-none"
                    >
                      <Card className={`shadow-lg hover:shadow-xl transition-all duration-200 border-2 h-20 ${
                        isToAllocate && stats.isOverBudget ? 'border-red-400 bg-red-50/30 dark:bg-red-900/10' : ''
                      }`} style={{ borderColor: cardColor }}>
                        <CardContent className="p-4 h-full">
                          <div className="flex items-center justify-between h-full">
                            {/* Contenuto principale */}
                            <div className="flex items-center gap-4 lg:gap-6">
                              {/* Icona categoria */}
                              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ 
                                backgroundColor: cardColor 
                              }}>
                                {isToAllocate && stats.isOverBudget ? (
                                  <span className="text-white text-sm leading-none">⚠</span>
                                ) : stats.meta.iconKey ? (
                                  <SvgIcon name={stats.meta.iconKey} color="white" size={18} iconType="main" />
                                ) : isToAllocate ? (
                                  <span className="text-white text-sm font-bold">€</span>
                                ) : (
                                  <span className="text-white text-sm font-bold">
                                    {stats.meta.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              
                              {/* Nome e descrizione */}
                              <div className="text-left min-w-0 flex-1">
                                <h3 className="font-bold text-base lg:text-lg truncate" style={{ color: cardColor }}>
                                  {isToAllocate && stats.isOverBudget ? 'SFORAMENTO' : stats.meta.name.toUpperCase()}
                                </h3>
                                <p className="text-xs lg:text-sm text-slate-500 truncate">
                                  {isToAllocate ? 'Disponibile' : '% su reddito annuo'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Valori e grafico */}
                            <div className="flex items-center gap-3 lg:gap-6 flex-shrink-0">
                              {/* Valori numerici */}
                              <div className="text-right">
                                <div className="text-xl lg:text-2xl font-bold" style={{ color: cardColor }}>
                                  {isToAllocate ? (
                                    `${stats.toAllocateValue < 0 ? '-' : ''}${Math.abs(stats.toAllocateValue).toLocaleString('it-IT')}€`
                                  ) : (
                                    `${stats.yearlyPercentage}%`
                                  )}
                                </div>
                                <div className="text-xs lg:text-sm text-slate-500">
                                  {isToAllocate ? (
                                    stats.isOverBudget ? (
                                      `${summaryStats.yearlyExpenses.toLocaleString('it-IT')}€ spese`
                                    ) : (
                                      `${stats.yearlyAmount.toLocaleString('it-IT')}€ reddito`
                                    )
                                  ) : (
                                    `${stats.yearlyAmount.toLocaleString('it-IT')}€/anno`
                                  )}
                                </div>
                              </div>
                              
                              {/* Ring chart */}
                              <div className="w-10 h-10 lg:w-12 lg:h-12 relative flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={[
                                        { 
                                          name: 'used', 
                                          value: isToAllocate ? 
                                            (summaryStats.yearlyIncome > 0 ? Math.round((summaryStats.yearlyExpenses / summaryStats.yearlyIncome) * 100) : 0)
                                            : stats.yearlyPercentage 
                                        },
                                        { 
                                          name: 'remaining', 
                                          value: isToAllocate ? 
                                            (summaryStats.yearlyIncome > 0 ? Math.max(0, 100 - Math.round((summaryStats.yearlyExpenses / summaryStats.yearlyIncome) * 100)) : 100)
                                            : Math.max(0, 100 - stats.yearlyPercentage)
                                        }
                                      ]}
                                      dataKey="value"
                                      innerRadius={14}
                                      outerRadius={20}
                                      startAngle={90}
                                      endAngle={450}
                                      strokeWidth={0}
                                    >
                                      <Cell fill={cardColor} />
                                      <Cell fill={isToAllocate ? 'transparent' : `${cardColor}20`} />
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              
                              {/* Indicatore espansione */}
                              <div className="text-slate-400 transition-transform duration-200 flex-shrink-0" style={{
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                              }}>
                                ▼
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </button>
                    
                    {/* Sezione espandibile per questa categoria - sempre a tutta larghezza */}
                    {isExpanded && (
                      <div className="mt-4 animate-fadeIn col-span-full">
                        {stats.isToAllocate ? (
                          <IncomeConfigSection 
                            year={year}
                            state={state}
                            viewMode={viewMode}
                            visibleMonths={visibleMonths}
                            upsertBudget={upsertBudget}
                            batchUpsertBudgets={batchUpsertBudgets}
                            mainMeta={mainMeta}
                            onClose={() => setExpandedCategory(null)}
                          />
                        ) : (
                          <CategoryConfigSection 
                            categoryKey={key}
                            year={year}
                            state={state}
                            viewMode={viewMode}
                            visibleMonths={visibleMonths}
                            upsertBudget={upsertBudget}
                            batchUpsertBudgets={batchUpsertBudgets}
                            mainMeta={mainMeta}
                            isManagedAutomatically={isManagedAutomatically}
                            onClose={() => setExpandedCategory(null)}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
