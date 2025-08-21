import { isMonthKey, prorateAnnualToMonth, yearOf, monthOf } from './period.js';

/**
 * Compute allocated amount by style/period.
 * @param {number} pct
 * @param {number} income
 */
export function allocateByIncome(pct, income) { return (income || 0) * ((pct || 0) / 100); }

export function computeAvailable(allocated, spent, carryIn, rollover) {
  const available = (allocated || 0) + (carryIn || 0) - (spent || 0);
  const carryOut = rollover ? Math.max(0, available) : 0;
  return { available, carryOut };
}

export function distributeToSubs(total, subs, historicSpend) {
  const base = subs.map(k => Math.max(0, historicSpend[k] ?? 0));
  const sum = base.reduce((s,v)=>s+v,0);
  if (sum === 0 || subs.length === 0) {
    const each = subs.length ? (total / subs.length) : 0;
    return Object.fromEntries(subs.map(k => [k, each]));
  }
  return Object.fromEntries(subs.map((k,i)=>[k, total * (base[i]/sum)]));
}

/**
 * @param {Object} ctx
 * @param {import('./budgetModels.js').PeriodKey} ctx.period
 * @param {import('./budgetModels.js').BudgetsByPeriod} ctx.budgets
 * @param {import('./budgetModels.js').IncomeByPeriod} ctx.incomeByPeriod
 * @param {import('./budgetModels.js').SpentByPeriod} ctx.spentByPeriod
 * @param {import('./budgetModels.js').RolloversByPeriod} ctx.rollovers
 * @param {Record<string,string[]>} ctx.subsByMain
 * @param {Record<string,number>=} ctx.historicSpend
 * @param {import('./budgetModels.js').ProrataMode=} ctx.prorataMode
 * @returns {import('./budgetModels.js').BudgetComputedRow[]}
 */
export function selectBudgetRows(ctx) {
  const { period, budgets, incomeByPeriod, spentByPeriod, rollovers, subsByMain, historicSpend = {}, prorataMode = 'equal' } = ctx;
  const y = yearOf(period);
  const m = monthOf(period);

  const periodBudgets = budgets[period] || {};
  const yearKey = String(y);
  const yearBudgets = budgets[yearKey] || {};
  const spentMap = spentByPeriod[period] || {};
  const rolloverMap = rollovers[period] || {};

  const catKeys = new Set([
    ...Object.keys(periodBudgets),
    ...Object.keys(yearBudgets),
    ...Object.keys(spentMap),
    ...Object.keys(rolloverMap),
  ]);

  const incomeThisPeriod = incomeByPeriod[period] || 0;
  /** @type {import('./budgetModels.js').BudgetComputedRow[]} */
  const rows = [];

  for (const categoryKey of catKeys) {
    const cell = periodBudgets[categoryKey] || yearBudgets[categoryKey];
    if (!cell) continue;
    let allocated = 0;

    if (cell.style === 'PERCENT_OF_INCOME') {
      allocated = allocateByIncome(cell.pctOfIncome || 0, incomeThisPeriod);
    } else if (isMonthKey(period)) {
      if (periodBudgets[categoryKey]?.amount != null) {
        allocated = periodBudgets[categoryKey].amount || 0;
      } else {
        const annual = yearBudgets[categoryKey]?.amount || 0;
        allocated = annual > 0 ? prorateAnnualToMonth(annual, y, m, prorataMode) : 0;
      }
    } else {
      allocated = cell.amount || 0;
    }

    const spent = spentMap[categoryKey] || 0;
    const carryIn = rolloverMap[categoryKey]?.carryIn || 0;
    const { available, carryOut } = computeAvailable(allocated, spent, carryIn, !!cell.rollover);

    rows.push({
      categoryKey,
      allocated,
      spent,
      carryIn,
      available,
      carryOut,
      style: cell.style,
      pctOfIncome: cell.pctOfIncome,
      rollover: cell.rollover,
      capType: cell.capType,
    });
  }

  return rows;
}

/**
 * Compatibility builder from current app state schema to selector context.
 * - state.budgets[year][`${main}:${sub}:${i}`] where i=0..11 -> monthly BudgetsByPeriod in FIXED style
 * - transactions -> incomeByPeriod, spentByPeriod
 * - subcats -> subsByMain map
 * @param {Object} state
 * @param {number|string} year
 * @returns {{
 *   budgets: import('./budgetModels.js').BudgetsByPeriod,
 *   incomeByPeriod: import('./budgetModels.js').IncomeByPeriod,
 *   spentByPeriod: import('./budgetModels.js').SpentByPeriod,
 *   rollovers: import('./budgetModels.js').RolloversByPeriod,
 *   subsByMain: Record<string,string[]>
 * }}
 */
export function buildCtxFromState(state, year) {
  const y = Number(year);
  /** @type {import('./budgetModels.js').BudgetsByPeriod} */
  const budgets = {};
  /** @type {import('./budgetModels.js').IncomeByPeriod} */
  const incomeByPeriod = {};
  /** @type {import('./budgetModels.js').SpentByPeriod} */
  const spentByPeriod = {};
  /** @type {import('./budgetModels.js').RolloversByPeriod} */
  const rollovers = {};
  /** @type {Record<string,string[]>} */
  const subsByMain = {};

  // Build subs map
  const subcats = state.subcats || {};
  for (const main of Object.keys(subcats)) {
    subsByMain[main] = (subcats[main] || []).map(sc => `${main}:${sc.name}`);
  }

  // Budgets from legacy schema
  const legacy = state.budgets?.[y] || {};
  for (const key of Object.keys(legacy)) {
    // key format: "main:sub:i"
    const parts = String(key).split(':');
    if (parts.length < 3) continue;
    const main = parts[0];
    const sub = parts[1];
    const i = Number(parts[2]);
    if (Number.isNaN(i)) continue;
    const period = `${y}-${String(i+1).padStart(2,'0')}`;
    const catKey = `${main}:${sub}`;
    budgets[period] = budgets[period] || {};
    budgets[period][catKey] = { style: 'FIXED', amount: Number(legacy[key] || 0) };
  }

  // Transactions -> income & spent per period
  for (const t of (state.transactions || [])) {
    const d = new Date(t.date);
    const py = d.getFullYear();
    const pm = `${py}-${String(d.getMonth()+1).padStart(2,'0')}`;
    const periodKey = String(py); // annual aggregation
    const periodMonthKey = pm;

    const main = String(t.main || '').toLowerCase();
    const subName = t.sub || t.subName || t.subname || t.subcategory?.name || t.Subcategory?.name || '';
    const categoryKey = subName ? `${main}:${subName}` : main;
    const amt = Number(t.amount) || 0;

    // spent by month
    spentByPeriod[periodMonthKey] = spentByPeriod[periodMonthKey] || {};
    spentByPeriod[periodMonthKey][categoryKey] = (spentByPeriod[periodMonthKey][categoryKey] || 0) + amt;

    // annual spent aggregate
    spentByPeriod[periodKey] = spentByPeriod[periodKey] || {};
    spentByPeriod[periodKey][categoryKey] = (spentByPeriod[periodKey][categoryKey] || 0) + amt;

    // income
    if (main === 'income') {
      incomeByPeriod[periodMonthKey] = (incomeByPeriod[periodMonthKey] || 0) + amt;
      incomeByPeriod[periodKey] = (incomeByPeriod[periodKey] || 0) + amt;
    }
  }

  // Empty rollovers placeholder (integration later)
  // e.g., rollovers['2025-08']['spese:alimentari'] = { carryIn: 0, carryOut: 0 }

  return { budgets, incomeByPeriod, spentByPeriod, rollovers, subsByMain };
}
