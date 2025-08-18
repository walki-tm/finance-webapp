import { renderHook, act } from '@testing-library/react';
import useCategories from './useCategories.js';
import { api } from '../../lib/api.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../../lib/api.js', () => ({
  api: {
    listCategories: vi.fn(),
    addCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
    addSubCategory: vi.fn(),
    updateSubCategory: vi.fn(),
    deleteSubCategory: vi.fn(),
  }
}));

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.listCategories.mockResolvedValue([]);
  });

  it('adds a main category', async () => {
    api.addCategory.mockResolvedValue({ id: 1 });
    const { result } = renderHook(() => useCategories('token')); 
    await act(async () => {}); // flush initial effect
    await act(async () => {
      await result.current.addMainCat({ key: 'custom_x', name: 'Test', color: '#fff' });
    });
    expect(result.current.customMainCats).toEqual([
      { key: 'custom_x', name: 'Test', color: '#fff', id: 1 }
    ]);
  });
});