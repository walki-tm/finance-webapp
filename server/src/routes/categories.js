import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { z } from 'zod'

const router = Router()

router.use(authRequired)

const categorySchema = z.object({
  main: z.enum(['INCOME', 'EXPENSE', 'DEBT', 'SAVINGS']),
  name: z.string().min(1).max(80),
  iconKey: z.string().optional().nullable(),
  colorHex: z.string().optional().nullable()
})

const subSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(80),
  iconKey: z.string().optional().nullable()
})

router.get('/', async (req, res) => {
  const userId = req.user.id
  const categories = await prisma.category.findMany({
    where: { userId },
    include: { subcats: true },
    orderBy: [{ main: 'asc' }, { name: 'asc' }]
  })
  res.json(categories)
})

router.post('/', async (req, res) => {
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  const userId = req.user.id
  const data = parsed.data
  try {
    const created = await prisma.category.create({ data: { userId, ...data } })
    res.status(201).json(created)
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Category already exists' })
    throw e
  }
})

router.post('/sub', async (req, res) => {
  const parsed = subSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  const userId = req.user.id
  const { categoryId, ...rest } = parsed.data
  // Ensure category belongs to user
  const cat = await prisma.category.findFirst({ where: { id: categoryId, userId } })
  if (!cat) return res.status(404).json({ error: 'Category not found' })
  const created = await prisma.subcategory.create({ data: { userId, categoryId, ...rest } })
  res.status(201).json(created)
})

router.delete('/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id
  // Ensure ownership
  const cat = await prisma.category.findFirst({ where: { id, userId } })
  if (!cat) return res.status(404).json({ error: 'Not found' })
  await prisma.category.delete({ where: { id } })
  res.status(204).end()
})

router.delete('/sub/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id
  const sub = await prisma.subcategory.findFirst({ where: { id, userId } })
  if (!sub) return res.status(404).json({ error: 'Not found' })
  await prisma.subcategory.delete({ where: { id } })
  res.status(204).end()
})

export default router
