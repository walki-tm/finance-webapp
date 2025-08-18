import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import useTabState from './useTabState.js';

describe('useTabState', () => {
  it('manages tab-related state', () => {
    const { result } = renderHook(() => useTabState());
    expect(result.current.activeTab).toBe('dashboard');
    act(() => result.current.setActiveTab('transactions'));
    expect(result.current.activeTab).toBe('transactions');

    expect(result.current.menuOpen).toBe(false);
    act(() => result.current.setMenuOpen(true));
    expect(result.current.menuOpen).toBe(true);

    expect(result.current.dashDetail).toBe(null);
    act(() => result.current.setDashDetail('main'));
    expect(result.current.dashDetail).toBe('main');
  });
});