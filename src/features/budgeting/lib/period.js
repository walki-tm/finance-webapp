/**
 * Period utilities and prorata helpers (plain JS)
 * All dates are expected as ISO strings (YYYY-MM-DD) when needed.
 */

/** @typedef {string} PeriodKey */ // "2025" | "2025-08"

export const isYearKey = (k) => /^\d{4}$/.test(String(k));
export const isMonthKey = (k) => /^\d{4}-\d{2}$/.test(String(k));

/**
 * @param {number} year
 * @param {number} month1to12
 */
export function daysInMonth(year, month1to12) {
  return new Date(year, month1to12, 0).getDate();
}

export function isLeapYear(year) {
  return new Date(year, 2, 29).getMonth() === 1;
}

/**
 * Prorate annual budget to a month.
 * @param {number} annual
 * @param {number} year
 * @param {number} month1to12
 * @param {('equal'|'byDays')} mode
 */
export function prorateAnnualToMonth(annual, year, month1to12, mode = 'equal') {
  if (mode === 'equal') return annual / 12;
  const dim = daysInMonth(year, month1to12);
  const diy = isLeapYear(year) ? 366 : 365;
  return annual * (dim / diy);
}

/** @param {PeriodKey} period */
export function yearOf(period) { return Number(String(period).slice(0,4)); }

/** @param {PeriodKey} period */
export function monthOf(period) { return isMonthKey(period) ? Number(String(period).slice(5,7)) : undefined; }

/**
 * Formats YYYY-MM from a date object
 */
export function monthKeyFromDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  return `${y}-${m}`;
}
