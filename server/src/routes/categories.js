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
router.post('/', async (req, res, next) => {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  const userId = req.user.id

  try {
    const created = await prisma.category.create({ data: { userId, ...parsed.data } })
    return res.status(201).json(created)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Category already exists' })
    return next(e)
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

// DELETE categoria (cascade sulle sub + setNull transazioni collegate)
router.delete('/:id', async (req, res, next) => {
  const userId = req.user.id
  const id = req.params.id

  const cat = await prisma.category.findFirst({
    where: { id, userId },
    include: { subcats: { select: { id: true } } }
  })
  if (!cat) return res.status(404).json({ error: 'Not found' })

  const subIds = cat.subcats.map(s => s.id)

  try {
    await prisma.$transaction(async (tx) => {
      if (subIds.length) {
        // azzera subId nelle transazioni dell’utente collegate alle sub che stiamo togliendo
        await tx.transaction.updateMany({
          where: { userId, subId: { in: subIds } },
          data: { subId: null }
        })
        // elimina le sub dell’utente per quella categoria
        await tx.subcategory.deleteMany({
          where: { userId, id: { in: subIds } }
        })
      }
      // elimina la categoria
      await tx.category.delete({ where: { id } })
    })

    return res.status(204).end()
  } catch (e) {
    return next(e)
  }
})

// DELETE sottocategoria (setNull transazioni collegate)
router.delete('/sub/:id', async (req, res, next) => {
  const userId = req.user.id
  const id = req.params.id

  const sub = await prisma.subcategory.findFirst({ where: { id, userId } })
  if (!sub) return res.status(404).json({ error: 'Not found' })

  try {
    await prisma.$transaction(async (tx) => {
      // prima nullo nelle transazioni dell’utente
      await tx.transaction.updateMany({
        where: { userId, subId: id },
        data: { subId: null }
      })
      // poi elimina la sub
      await tx.subcategory.delete({ where: { id } })
    })
    return res.status(204).end()
  } catch (e) {
    return next(e)
  }
})

export default router
