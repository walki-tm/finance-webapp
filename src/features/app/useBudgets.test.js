import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useBudgets from './useBudgets.js';

describe('useBudgets', () => {
  it('adds and updates budgets for given year', () => {
    const { result } = renderHook(() => useBudgets('2024'));
    act(() => result.current.upsertBudget('food', 'groceries', 100));
    expect(result.current.budgets['2024']['food:groceries']).toBe(100);
    act(() => result.current.upsertBudget('food', 'groceries', 150));
    expect(result.current.budgets['2024']['food:groceries']).toBe(150);
  });
});