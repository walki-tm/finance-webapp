import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import { z } from 'zod'
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../services/transactionService.js'

const router = Router()
router.use(authRequired)

const txSchema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number(),
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()),
  subId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  payee: z.string().optional().nullable(),
})

// PATCH/PUT schema: tutti opzionali
const txPatchSchema = z.object({
  date: z.string().optional(),
  amount: z.number().optional(),
  // main dinamica: accetta qualsiasi stringa e normalizza in UPPERCASE
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()).optional(),
  subId: z.string().nullable().optional(),
  subName: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  payee: z.string().nullable().optional(),
})

router.get('/', async (req, res, next) => {
  try {
    const data = await listTransactions(req.user.id, req.query)
    res.json(data)
  } catch (e) { next(e) }
})

router.post('/', async (req, res, next) => {
  const parsed = txSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const created = await createTransaction(req.user.id, parsed.data)
    res.status(201).json(created)
  } catch (e) { next(e) }
})

router.put('/:id', async (req, res, next) => {
  const parsed = txPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const updated = await updateTransaction(req.user.id, req.params.id, parsed.data)
    res.json(updated)
  } catch (e) { next(e) }
})

router.delete('/:id', async (req, res, next) => {
  try {
    await deleteTransaction(req.user.id, req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
})

export default router
