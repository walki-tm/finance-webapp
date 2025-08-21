/** JSDoc models used across budgeting */

/** @typedef {string} PeriodKey */
/** @typedef {string} CategoryKey */ // e.g. "spese:alimentari" or "spese"

/** @typedef {('FIXED'|'PERCENT_OF_INCOME'|'ENVELOPE'|'ONE_OFF')} BudgetStyle */
/** @typedef {('equal'|'byDays')} ProrataMode */
/** @typedef {('SOFT'|'HARD')} CapType */

/**
 * @typedef {Object} BudgetCell
 * @property {BudgetStyle} style
 * @property {number=} amount
 * @property {number=} pctOfIncome
 * @property {boolean=} rollover
 * @property {CapType=} capType
 * @property {string=} notes
 * @property {boolean=} overrideChildren
 */

/** @typedef {Record<PeriodKey, Record<CategoryKey, BudgetCell>>} BudgetsByPeriod */
/** @typedef {{carryIn:number, carryOut:number}} RolloverCell */
/** @typedef {Record<PeriodKey, Record<CategoryKey, RolloverCell>>} RolloversByPeriod */
/** @typedef {Record<PeriodKey, Record<CategoryKey, number>>} SpentByPeriod */
/** @typedef {Record<PeriodKey, number>} IncomeByPeriod */

/**
 * @typedef {Object} BudgetComputedRow
 * @property {CategoryKey} categoryKey
 * @property {number} allocated
 * @property {number} spent
 * @property {number} carryIn
 * @property {number} available
 * @property {number} carryOut
 * @property {BudgetStyle} style
 * @property {number=} pctOfIncome
 * @property {boolean=} rollover
 * @property {CapType=} capType
 */
