import { useState, useCallback } from 'react';

export default function useBudgets(year, initial = {}) {
  const [budgets, setBudgets] = useState(initial);

  const upsertBudget = useCallback((main, sub, value) => {
    setBudgets(b => ({
      ...b,
      [year]: { ...(b[year] || {}), [`${main}:${sub}`]: value },
    }));
  }, [year]);

  return { budgets, upsertBudget };
}