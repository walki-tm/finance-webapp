// routes/categories.js
import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { z } from 'zod'

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
  // NB: NON permettiamo di cambiare la MAIN con una PATCH (opzionale: abilitalo se ti serve)
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
router.get('/', async (req, res) => {
  const userId = req.user.id
  const categories = await prisma.category.findMany({
    where: { userId },
    include: { subcats: true },
    orderBy: [{ main: 'asc' }, { name: 'asc' }]
  })
  res.json(categories)
})

// POST nuova categoria
router.post('/', async (req, res) => {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  const userId = req.user.id

  try {
    const created = await prisma.category.create({ data: { userId, ...parsed.data } })
    res.status(201).json(created)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Category already exists' })
    throw e
  }
})

// PUT update categoria
router.put('/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id
  const parsed = categoryPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })

  const cat = await prisma.category.findFirst({ where: { id, userId } })
  if (!cat) return res.status(404).json({ error: 'Not found' })

  const updated = await prisma.category.update({
    where: { id },
    data: parsed.data
  })
  res.json(updated)
})

// POST nuova sottocategoria
router.post('/sub', async (req, res) => {
  const parsed = subSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  const userId = req.user.id
  const { categoryId, ...rest } = parsed.data

  const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } })
  if (!cat) return res.status(404).json({ error: 'Category not found' })

  const created = await prisma.subcategory.create({ data: { userId, categoryId, ...rest } })
  res.status(201).json(created)
})

// PUT update sottocategoria
router.put('/sub/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id
  const parsed = subPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })

  const sub = await prisma.subcategory.findFirst({ where: { id, userId } })
  if (!sub) return res.status(404).json({ error: 'Not found' })

  const updated = await prisma.subcategory.update({
    where: { id },
    data: parsed.data
  })
  res.json(updated)
})

// DELETE categoria
router.delete('/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id
  const cat = await prisma.category.findFirst({ where: { id, userId } })
  if (!cat) return res.status(404).json({ error: 'Not found' })
  await prisma.category.delete({ where: { id } })
  res.status(204).end()
})

// DELETE sottocategoria
router.delete('/sub/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id
  const sub = await prisma.subcategory.findFirst({ where: { id, userId } })
  if (!sub) return res.status(404).json({ error: 'Not found' })
  await prisma.subcategory.delete({ where: { id } })
  res.status(204).end()
})

export default router
