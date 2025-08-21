// src/features/budgeting/pages/Budgeting.jsx
import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '../../ui';
import { MAIN_CATS, months } from '../../../lib/constants.js';
import { nice } from '../../../lib/utils.js';
import SvgIcon from '../../icons/components/SvgIcon.jsx';
import BudgetTable from '../components/BudgetTable.jsx';
import { buildCtxFromState, selectBudgetRows } from '../lib';

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

export default function Budgeting({ state, year, upsertBudget }) {
  const [selMain, setSelMain] = useState('expense');
  const [mode, setMode] = useState('year'); // 'year' | 'month'
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

  // 1) STATISTICHE MENSILI (in base alle transazioni reali)
  const monthlyStats = useMemo(() => {
    const stats = {};
    for (const mi of MONTH_INDEXES) {
      const key = `${year}-${String(mi + 1).padStart(2, '0')}`;
      stats[key] = { income: 0, expense: 0, debt: 0, saving: 0, customs: {} };
    }
    state.transactions.forEach(t => {
      const d = new Date(t.date);
      if (d.getFullYear() !== Number(year)) return;
      const k = `${year}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const main = String(t.main);
      const amount = Number(t.amount) || 0;
      if (CORE.has(main)) stats[k][main] += amount; else {
        stats[k].customs[main] = (stats[k].customs[main] || 0) + amount;
      }
    });
    // calcola "da allocare" e percentuali per visualizzazione
    for (const mi of MONTH_INDEXES) {
      const key = `${year}-${String(mi + 1).padStart(2, '0')}`;
      const s = stats[key];
      const income = s.income > 0 ? s.income : 0;
      const outAbs = Math.abs(s.expense) + Math.abs(s.debt) + Math.abs(s.saving) +
        Object.values(s.customs).reduce((a, v) => a + Math.abs(v), 0);
      s.toAllocate = Math.max(0, income - outAbs);
      const pct = (x) => income > 0 ? Math.round((Math.abs(x) / income) * 100) : 0;
      s.pct = {
        expense: pct(s.expense),
        debt: pct(s.debt),
        saving: pct(s.saving),
      };
      // percentuali per singole custom main
      s.customPct = Object.fromEntries(
        Object.entries(s.customs).map(([k, v]) => [k, pct(v)])
      );
    }
    return stats;
  }, [state.transactions, year]);

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
    <div className="space-y-6">


      {/* SEZIONE ALTA: RIEPILOGO MENSILE (vista Anno) */}
      <Card>
        <CardContent>
          <div className="font-semibold mb-2">Riepilogo mese per mese</div>
          <div className="overflow-auto rounded-xl border border-slate-200/20">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="p-2 text-left">Voce</th>
                  {MONTH_INDEXES.map(i => (
                    <th key={i} className="p-2 text-center whitespace-nowrap">{months[i].toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Da allocare: solo etichetta, colorata come reddito */}
                <tr className="border-t border-slate-200/10">
                  <td className="p-2 font-semibold" style={{ color: (state.customMainCats || []).find(c => c.key === 'income')?.color || MAIN_CATS.find(m => m.key === 'income')?.color }}>Da allocare</td>
                  {MONTH_INDEXES.map(i => (
                    <td key={i} className="p-2 text-center">{/* nessun numero, solo cella */}</td>
                  ))}
                </tr>
                {/* Percentuali per ogni main presente */}
                {customMains
                  .filter(key => state.mainEnabled?.[key] !== false) // usa lo stato di abilitazione reale
                  .filter(key => key !== 'income') // escludi income
                  .map(key => (
                    <tr key={key} className="border-t border-slate-200/10">
                      <td
                        className="p-2"
                        style={{
                          color:
                            state.customMainCats.find(c => c.key === key)?.color || '#64748b',
                        }}
                      >
                        % {state.customMainCats.find(c => c.key === key)?.name?.toLowerCase()} sul reddito
                      </td>
                      {MONTH_INDEXES.map(i => (
                        <td key={i} className="p-2 text-center">{/* empty */}</td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

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
        return (
          <Card key={mainKey} style={{ borderColor: cardBorder, backgroundColor: cardBg }} className="border">
            <CardContent>
              <div className="font-semibold mb-3" style={{ color }}>{name}</div>
              <div className="overflow-auto rounded-xl border" style={{ borderColor: cardBorder }}>
                <table className="w-full text-sm">
                  <thead style={{ backgroundColor: headBg }}>
                    <tr>
                      <th className="text-left p-2" style={{ color }}>Sottocategoria</th>
                      {MONTH_INDEXES.map(i => (
                        <th key={i} className="text-center p-2 whitespace-nowrap" style={{ color }}>{months[i].toUpperCase()}</th>
                      ))}
                      <th className="text-center p-2" style={{ color }}>Totale</th>
                    </tr>
                  </thead>
                  	<tbody>
                    {subs.map((sc, idx) => {
                      const totalPlanned = MONTH_INDEXES.reduce((a, i) => a + planFor(sc.name, i), 0);
                      const rowBg = hexToRgba(color, isDark() ? 0.22 : 0.12);
                      const rowAltBg = hexToRgba(color, isDark() ? 0.14 : 0.08);
                      return (
                        <tr key={sc.id || sc.name} className="border-t" style={{ borderColor: cardBorder, backgroundColor: (idx % 2 === 0) ? rowBg : rowAltBg }}>
                          <td className="p-2" style={{ color }}>
                            <div className="flex items-center gap-2">
                              <SvgIcon name={sc.iconKey} color={color} size={18} />
                              <span className="font-semibold">{sc.name}</span>
                            </div>
                          </td>
                          {MONTH_INDEXES.map(i => (
                            <td key={i} className="p-2 text-center">
                              <span>{nice(planFor(sc.name, i))}</span>
                            </td>
                          ))}
                          <td className="p-2 text-center font-semibold">{nice(totalPlanned)}</td>
                        </tr>
                      );
                    })}
                  	</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
