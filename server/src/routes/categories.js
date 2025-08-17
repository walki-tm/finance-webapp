// routes/categories.js
import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { z } from 'zod'
import {
  getCategories,
  createCategory,
  updateCategory,
  createSubcategory,
  updateSubcategory,
  deleteCategory,
  deleteSubcategory,
} from '../services/categoryService.js'

const router = Router()
router.use(authRequired)

// ===== Schemi =====
const categorySchema = z.object({
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()),
  name: z.string().min(1).max(80),
  iconKey: z.string().optional().nullable(),
  colorHex: z.string().optional().nullable(),
  visible: z.boolean().optional(),
})

const categoryPatchSchema = z.object({
  // NB: non permettiamo di cambiare la MAIN con una PATCH
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

// ===== Endpoints =====

// GET tutte le categorie + sottocategorie
router.get('/', async (req, res, next) => {
  try {
    const categories = await getCategories(req.user.id)
    res.json(categories)
  } catch (e) { next(e) }
})

// POST nuova categoria
router.post('/', async (req, res, next) => {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const created = await createCategory(req.user.id, parsed.data)
    res.status(201).json(created)
  } catch (e) { next(e) }
})

// PUT update categoria
router.put('/:id', async (req, res, next) => {
  const parsed = categoryPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const updated = await updateCategory(req.user.id, req.params.id, parsed.data)
    res.json(updated)
  } catch (e) { next(e) }
})

// POST nuova sottocategoria
router.post('/sub', async (req, res, next) => {
  const parsed = subSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const { categoryId, ...rest } = parsed.data
    const created = await createSubcategory(req.user.id, categoryId, rest)
    res.status(201).json(created)
  } catch (e) { next(e) }
})

// PUT update sottocategoria
router.put('/sub/:id', async (req, res, next) => {
  const parsed = subPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const updated = await updateSubcategory(req.user.id, req.params.id, parsed.data)
    res.json(updated)
  } catch (e) { next(e) }
})

// DELETE categoria (cascade sulle sub + setNull transazioni collegate)
router.delete('/:id', async (req, res, next) => {
  try {
    await deleteCategory(req.user.id, req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
})

// DELETE sottocategoria (setNull transazioni collegate)
router.delete('/sub/:id', async (req, res, next) => {
  try {
    await deleteSubcategory(req.user.id, req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
})

export default router
