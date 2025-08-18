// @vitest-environment node
import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  listCategories,
  createCategory,
  updateCategory,
  createSubcategory,
  updateSubcategory,
  deleteCategory,
  deleteSubcategory,
} from './categoriesController.js'
import {
  getCategories as getCategoriesService,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  createSubcategory as createSubcategoryService,
  updateSubcategory as updateSubcategoryService,
  deleteCategory as deleteCategoryService,
  deleteSubcategory as deleteSubcategoryService,
} from '../services/categoryService.js'

vi.mock('../services/categoryService.js', () => ({
  getCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  createSubcategory: vi.fn(),
  updateSubcategory: vi.fn(),
  deleteCategory: vi.fn(),
  deleteSubcategory: vi.fn(),
}))

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  }
}

const userReq = { user: { id: 'u1' } }

describe('categoriesController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('listCategories returns data', async () => {
    getCategoriesService.mockResolvedValue([{ id: 1 }])
    const req = { ...userReq }
    const res = mockRes()
    const next = vi.fn()
    await listCategories(req, res, next)
    expect(getCategoriesService).toHaveBeenCalledWith('u1')
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }])
  })

  test('createCategory invalid body', async () => {
    const req = { ...userReq, body: { name: '' } }
    const res = mockRes()
    await createCategory(req, res, vi.fn())
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('createCategory success', async () => {
    createCategoryService.mockResolvedValue({ id: 1 })
    const req = { ...userReq, body: { main: 'A', name: 'Cat' } }
    const res = mockRes()
    await createCategory(req, res, vi.fn())
    expect(createCategoryService).toHaveBeenCalledWith('u1', { main: 'A', name: 'Cat' })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('updateCategory success', async () => {
    updateCategoryService.mockResolvedValue({ id: 1 })
    const req = { ...userReq, params: { id: '1' }, body: { name: 'New' } }
    const res = mockRes()
    await updateCategory(req, res, vi.fn())
    expect(updateCategoryService).toHaveBeenCalledWith('u1', '1', { name: 'New' })
  })

  test('createSubcategory success', async () => {
    createSubcategoryService.mockResolvedValue({ id: 2 })
    const req = { ...userReq, body: { categoryId: '1', name: 'Sub' } }
    const res = mockRes()
    await createSubcategory(req, res, vi.fn())
    expect(createSubcategoryService).toHaveBeenCalledWith('u1', '1', { name: 'Sub' })
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('updateSubcategory success', async () => {
    updateSubcategoryService.mockResolvedValue({ id: 2 })
    const req = { ...userReq, params: { id: '2' }, body: { name: 'Sub2' } }
    const res = mockRes()
    await updateSubcategory(req, res, vi.fn())
    expect(updateSubcategoryService).toHaveBeenCalledWith('u1', '2', { name: 'Sub2' })
  })

  test('deleteCategory success', async () => {
    const req = { ...userReq, params: { id: '1' } }
    const res = mockRes()
    await deleteCategory(req, res, vi.fn())
    expect(deleteCategoryService).toHaveBeenCalledWith('u1', '1')
    expect(res.status).toHaveBeenCalledWith(204)
  })

  test('deleteSubcategory success', async () => {
    const req = { ...userReq, params: { id: '2' } }
    const res = mockRes()
    await deleteSubcategory(req, res, vi.fn())
    expect(deleteSubcategoryService).toHaveBeenCalledWith('u1', '2')
    expect(res.status).toHaveBeenCalledWith(204)
  })
})