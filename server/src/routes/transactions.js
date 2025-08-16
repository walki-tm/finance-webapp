import { Router } from 'express'
import { prisma } from '../lib/prisma.js'
import { authRequired } from '../middleware/auth.js'
import { z } from 'zod'

const router = Router()
router.use(authRequired)

const txSchema = z.object({
  date: z.string(), // ISO string o 'YYYY-MM-DD'
  amount: z.number(),
  main: z.enum(['INCOME', 'EXPENSE', 'DEBT', 'SAVINGS']),
  subId: z.string().optional().nullable(),
  subName: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  payee: z.string().optional().nullable()
})

// PATCH/PUT schema: tutti opzionali
const txPatchSchema = z.object({
  date: z.string().optional(),
  amount: z.number().optional(),
  main: z.enum(['INCOME', 'EXPENSE', 'DEBT', 'SAVINGS']).optional(),
  subId: z.string().nullable().optional(),
  subName: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  payee: z.string().nullable().optional()
})

router.get('/', async (req, res) => {
  const userId = req.user.id
  const { year, month, limit = 200 } = req.query

  const where = { userId }
  if (year && month) {
    const y = Number(year), m = Number(month) - 1
    const from = new Date(Date.UTC(y, m, 1))
    const to = new Date(Date.UTC(y, m + 1, 1))
    where.date = { gte: from, lt: to }
  }

  const data = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: Number(limit),
    include: { subcategory: true }
  })

  res.json(data)
})

router.post('/', async (req, res) => {
  const userId = req.user.id
  const parsed = txSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })

  let { date, amount, main, subId, subName, note, payee } = parsed.data

  // Risolvi subId da nome se serve
  if (!subId && subName) {
    const found = await prisma.subcategory.findFirst({
      where: { userId, name: { equals: subName, mode: 'insensitive' } },
      select: { id: true }
    })
    if (found) subId = found.id
  }

  // Valida eventuale subId
  if (subId) {
    const ok = await prisma.subcategory.findFirst({ where: { id: subId, userId } })
    if (!ok) return res.status(400).json({ error: 'Invalid subId' })
  }

  const created = await prisma.transaction.create({
    data: {
      userId,
      date: new Date(date),
      amount,
      main,
      subId: subId || null,
      note: note || null,
      payee: payee || null
    },
    include: { subcategory: true }
  })
  res.status(201).json(created)
})

router.put('/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id

  const exists = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!exists) return res.status(404).json({ error: 'Not found' })

  const parsed = txPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })

  let { date, amount, main, subId, subName, note, payee } = parsed.data

  // Risolvi subId da nome se serve
  if (!subId && subName) {
    const found = await prisma.subcategory.findFirst({
      where: { userId, name: { equals: subName, mode: 'insensitive' } },
      select: { id: true }
    })
    if (found) subId = found.id
    else subId = null // se nome non trovato, azzero il link
  }

  // Valida eventuale subId
  if (subId) {
    const ok = await prisma.subcategory.findFirst({ where: { id: subId, userId } })
    if (!ok) return res.status(400).json({ error: 'Invalid subId' })
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      ...(typeof amount === 'number' ? { amount } : {}),
      ...(main ? { main } : {}),
      ...(subId !== undefined ? { subId } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(payee !== undefined ? { payee } : {}),
    },
    include: { subcategory: true }
  })
  res.json(updated)
})

router.delete('/:id', async (req, res) => {
  const userId = req.user.id
  const id = req.params.id
  const tx = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!tx) return res.status(404).json({ error: 'Not found' })
  await prisma.transaction.delete({ where: { id } })
  res.status(204).end()
})

export default router
