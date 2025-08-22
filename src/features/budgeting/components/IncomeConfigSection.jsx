// src/features/budgeting/components/IncomeConfigSection.jsx
import React from 'react';
import { Card, CardContent } from '../../ui';
import SvgIcon from '../../icons/components/SvgIcon.jsx';
import EditableCell from './EditableCell.jsx';
import TotalCell from './TotalCell.jsx';
import BudgetRowActions from './BudgetRowActions.jsx';
import { months } from '../../../lib/constants.js';
import { nice } from '../../../lib/utils.js';

const MONTH_INDEXES = Array.from({ length: 12 }, (_, i) => i); // 0..11

// Colore con alpha
function hexToRgba(hex, a = 1) {
  const h = String(hex || '#000000').replace('#','');
  const v = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
  const r = parseInt(v.slice(0,2), 16);
  const g = parseInt(v.slice(2,4), 16);
  const b = parseInt(v.slice(4,6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

export default function IncomeConfigSection({ 
  year, 
  state, 
  viewMode, 
  visibleMonths, 
  upsertBudget, 
  batchUpsertBudgets, 
  mainMeta, 
  onClose 
}) {
  const incomeMeta = mainMeta('income');
  const subs = state.subcats?.['income'] || [];
  const planFor = (sub, i) => Number(state.budgets[year]?.[`income:${sub}:${i}`] || 0);
  const dark = isDark();
  const color = incomeMeta.color;
  const cardBg = hexToRgba(color, dark ? 0.08 : 0.06);
  const cardBorder = hexToRgba(color, dark ? 0.35 : 0.25);
  const headBg = hexToRgba(color, dark ? 0.20 : 0.12);

  // Calcola totali
  const yearTotal = MONTH_INDEXES.reduce((sum, i) => {
    return sum + subs.reduce((subSum, sc) => subSum + planFor(sc.name, i), 0);
  }, 0);

  if (!subs.length) {
    return (
      <Card style={{ borderColor: cardBorder, backgroundColor: cardBg }} className="border">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg" style={{ color }}>
              💰 CONFIGURAZIONE REDDITO
            </h3>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <div className="text-center py-8 text-slate-500">
            Nessuna sottocategoria di reddito configurata.
            <br />
            Aggiungi delle sottocategorie per configurare il budget del reddito.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card style={{ borderColor: cardBorder, backgroundColor: cardBg }} className="border">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6">
            <h3 className="font-semibold text-lg" style={{ color }}>
              💰 CONFIGURAZIONE REDDITO
            </h3>
            
            {/* Controlli navigazione semestre - a sinistra */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Toggle tra semestre 1 e 2
                  const newViewMode = viewMode === 'semester1' ? 'semester2' : 'semester1';
                  // Qui dovremmo passare una callback per aggiornare il viewMode del parent
                  // Per ora usiamo un evento personalizzato
                  window.dispatchEvent(new CustomEvent('changeSemester', { detail: newViewMode }));
                }}
                className="p-2 rounded-lg text-sm font-bold transition-all duration-200 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105"
                title="Semestre precedente"
              >
                ←
              </button>
              
              <div className="px-3 py-1 rounded-lg font-semibold text-sm" style={{ 
                backgroundColor: `${color}20`, 
                color: color 
              }}>
                {viewMode === 'semester1' ? 'GEN-GIU' : 'LUG-DIC'}
              </div>
              
              <button
                onClick={() => {
                  // Toggle tra semestre 1 e 2
                  const newViewMode = viewMode === 'semester1' ? 'semester2' : 'semester1';
                  // Qui dovremmo passare una callback per aggiornare il viewMode del parent
                  // Per ora usiamo un evento personalizzato
                  window.dispatchEvent(new CustomEvent('changeSemester', { detail: newViewMode }));
                }}
                className="p-2 rounded-lg text-sm font-bold transition-all duration-200 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105"
                title="Semestre successivo"
              >
                →
              </button>
            </div>
          </div>
          
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex gap-4">
          {/* Tabella principale */}
          <div className="flex-1">
            <div className="rounded-xl border" style={{ borderColor: cardBorder }}>
              {/* Vista Desktop - Tabella compatta */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: headBg }}>
                    <tr>
                      <th className="text-left p-2" style={{ color }}>Fonte di Reddito</th>
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
                                  await upsertBudget('income', `${sc.name}:${i}`, newValue);
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
                            main: 'income',
                            keyWithMonth: `${sc.name}:${monthIdx}`,
                            value
                          }));
                          batchUpsertBudgets(updates).catch(console.error);
                        } else {
                          MONTH_INDEXES.forEach(monthIdx => {
                            upsertBudget('income', `${sc.name}:${monthIdx}`, value).catch(console.error);
                          });
                        }
                      };
                      
                      const handleResetAll = async () => {
                        if (batchUpsertBudgets) {
                          const updates = MONTH_INDEXES.map(monthIdx => ({
                            main: 'income',
                            keyWithMonth: `${sc.name}:${monthIdx}`,
                            value: 0
                          }));
                          batchUpsertBudgets(updates).catch(console.error);
                        } else {
                          MONTH_INDEXES.forEach(monthIdx => {
                            upsertBudget('income', `${sc.name}:${monthIdx}`, 0).catch(console.error);
                          });
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
                  main: 'income',
                  keyWithMonth: `${sc.name}:${monthIdx}`,
                  value
                }));
                batchUpsertBudgets(updates).catch(console.error);
              } else {
                MONTH_INDEXES.forEach(monthIdx => {
                  upsertBudget('income', `${sc.name}:${monthIdx}`, value).catch(console.error);
                });
              }
            };
            
            const handleResetAll = async () => {
              if (batchUpsertBudgets) {
                const updates = MONTH_INDEXES.map(monthIdx => ({
                  main: 'income',
                  keyWithMonth: `${sc.name}:${monthIdx}`,
                  value: 0
                }));
                batchUpsertBudgets(updates).catch(console.error);
              } else {
                MONTH_INDEXES.forEach(monthIdx => {
                  upsertBudget('income', `${sc.name}:${monthIdx}`, 0).catch(console.error);
                });
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
                          await upsertBudget('income', `${sc.name}:${i}`, newValue);
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

        {/* Riepilogo totali */}
        <div className="mt-4 pt-4 border-t" style={{ borderColor: cardBorder }}>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-lg" style={{ color }}>
              Totale Reddito Annuale:
            </span>
            <span className="font-bold text-xl" style={{ color }}>
              {Math.round(yearTotal).toLocaleString('it-IT')}€
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
