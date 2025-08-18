import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import useTheme from './useTheme.js';

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('toggles theme and document class', () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    act(() => result.current.toggleTheme());
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});