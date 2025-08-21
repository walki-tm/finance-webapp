import React, { useMemo, useState } from 'react';

/**
 * Reusable budgeting table with inline editing and progress bar
 * Props:
 * - period: string (YYYY or YYYY-MM)
 * - rows: computed rows from selector
 * - onUpdateCell: (period, categoryKey, patch) => Promise|void
 * - hideZero: boolean
 */
export default function BudgetTable({ period, rows, onUpdateCell, hideZero }) {
  const [editing, setEditing] = useState({});

  const visible = useMemo(() => {
    return (rows || []).filter(r => !hideZero || r.allocated || r.spent || r.carryIn);
  }, [rows, hideZero]);

  return (
    <table className="w-full text-sm">
      <thead className="bg-slate-100 dark:bg-slate-800">
        <tr>
          <th className="p-2 text-left">Categoria</th>
          <th className="p-2 text-right">Allocato</th>
          <th className="p-2 text-right">Speso</th>
          <th className="p-2 text-right">Rimanente</th>
          <th className="p-2">Rollover</th>
          <th className="p-2">Cap</th>
        </tr>
      </thead>
      <tbody>
        {visible.map((r) => {
          const remaining = r.available || 0;
          const pct = r.allocated > 0 ? Math.min(100, Math.round((Math.abs(r.spent) / Math.abs(r.allocated)) * 100)) : 0;
          const barColor = pct < 70 ? 'bg-emerald-500' : pct <= 100 ? 'bg-amber-500' : 'bg-rose-600';

          return (
            <tr key={r.categoryKey} className="border-t border-slate-200/10">
              <td className="p-2">{r.categoryKey}</td>

              <td className="p-2 text-right">
                <input
                  className="w-24 text-right rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                  defaultValue={r.style === 'PERCENT_OF_INCOME' ? String(r.pctOfIncome ?? 0) : String(r.allocated ?? 0)}
                  onBlur={async (e) => {
                    const v = e.target.value.trim();
                    if (r.style === 'PERCENT_OF_INCOME') {
                      const pct = Math.max(0, Math.min(100, Number(v) || 0));
                      await onUpdateCell?.(period, r.categoryKey, { style: 'PERCENT_OF_INCOME', pctOfIncome: pct });
                    } else {
                      const amount = Number(v) || 0;
                      await onUpdateCell?.(period, r.categoryKey, { style: 'FIXED', amount });
                    }
                  }}
                />
              </td>

              <td className="p-2 text-right">{Math.round(r.spent).toLocaleString()}</td>

              <td className="p-2 text-right">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded">
                    <div className={`h-2 ${barColor} rounded`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className={remaining < 0 ? 'text-rose-600 font-semibold' : ''}>
                    {Math.round(remaining).toLocaleString()}
                  </span>
                </div>
              </td>

              <td className="p-2">{r.rollover ? 'On' : 'Off'}</td>
              <td className="p-2">{r.capType ?? '-'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
