import { z } from 'zod'
import {
  listTransactions as listTransactionsService,
  createTransaction as createTransactionService,
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService,
} from '../services/transactionService.js'

const txSchema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number(),
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()),
  subId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  payee: z.string().optional().nullable(),
})

const txPatchSchema = z.object({
  date: z.string().optional(),
  amount: z.number().optional(),
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()).optional(),
  subId: z.string().nullable().optional(),
  subName: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  payee: z.string().nullable().optional(),
})

export async function listTransactions(req, res, next) {
  try {
    const data = await listTransactionsService(req.user.id, req.query)
    res.json(data)
  } catch (e) { next(e) }
}

export async function createTransaction(req, res, next) {
  const parsed = txSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const created = await createTransactionService(req.user.id, parsed.data)
    res.status(201).json(created)
  } catch (e) { next(e) }
}

export async function updateTransaction(req, res, next) {
  const parsed = txPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const updated = await updateTransactionService(req.user.id, req.params.id, parsed.data)
    res.json(updated)
  } catch (e) { next(e) }
}

export async function deleteTransaction(req, res, next) {
  try {
    await deleteTransactionService(req.user.id, req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
}