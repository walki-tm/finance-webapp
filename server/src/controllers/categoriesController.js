import { z } from 'zod'
import {
  getCategories as getCategoriesService,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  createSubcategory as createSubcategoryService,
  updateSubcategory as updateSubcategoryService,
  deleteCategory as deleteCategoryService,
  deleteSubcategory as deleteSubcategoryService,
} from '../services/categoryService.js'

const categorySchema = z.object({
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()),
  name: z.string().min(1).max(80),
  iconKey: z.string().optional().nullable(),
  colorHex: z.string().optional().nullable(),
  visible: z.boolean().optional(),
})

const categoryPatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  iconKey: z.string().nullable().optional(),
  colorHex: z.string().nullable().optional(),
  visible: z.boolean().optional(),
})

const subSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(80),
  iconKey: z.string().optional().nullable()
})

const subPatchSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  iconKey: z.string().nullable().optional(),
})

export async function listCategories(req, res, next) {
  try {
    const categories = await getCategoriesService(req.user.id)
    res.json(categories)
  } catch (e) { next(e) }
}

export async function createCategory(req, res, next) {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const created = await createCategoryService(req.user.id, parsed.data)
    res.status(201).json(created)
  } catch (e) { next(e) }
}

export async function updateCategory(req, res, next) {
  const parsed = categoryPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const updated = await updateCategoryService(req.user.id, req.params.id, parsed.data)
    res.json(updated)
  } catch (e) { next(e) }
}

export async function createSubcategory(req, res, next) {
  const parsed = subSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const { categoryId, ...rest } = parsed.data
    const created = await createSubcategoryService(req.user.id, categoryId, rest)
    res.status(201).json(created)
  } catch (e) { next(e) }
}

export async function updateSubcategory(req, res, next) {
  const parsed = subPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const updated = await updateSubcategoryService(req.user.id, req.params.id, parsed.data)
    res.json(updated)
  } catch (e) { next(e) }
}

export async function deleteCategory(req, res, next) {
  try {
    await deleteCategoryService(req.user.id, req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
}

export async function deleteSubcategory(req, res, next) {
  try {
    await deleteSubcategoryService(req.user.id, req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
}