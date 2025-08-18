import { renderHook, act } from '@testing-library/react';
import useTransactions from './useTransactions.js';
import { api } from '../../lib/api.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../lib/api.js', () => ({
  api: {
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  }
}));

describe('useTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('adds a transaction', async () => {
    api.addTransaction.mockResolvedValue({ id: 1, main: 'EXPENSE', subcategory: { name: 'Food' } });
    const { result } = renderHook(() => useTransactions('token'));
    await act(async () => {
      await result.current.saveTx({ amount: 10, main: 'expense', sub: 'Food' });
    });
    expect(result.current.transactions).toHaveLength(1);
    expect(result.current.transactions[0].id).toBe(1);
  });

  it('deletes a transaction', async () => {
    api.addTransaction.mockResolvedValue({ id: 2, main: 'EXPENSE', subcategory: { name: '' } });
    api.deleteTransaction.mockResolvedValue();
    const { result } = renderHook(() => useTransactions('token'));
    await act(async () => {
      await result.current.saveTx({ amount: 5, main: 'expense' });
    });
    await act(async () => {
      await result.current.delTx(2);
    });
    expect(result.current.transactions).toHaveLength(0);
  });
});