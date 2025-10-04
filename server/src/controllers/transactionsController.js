import { z } from 'zod'
import {
  listTransactions as listTransactionsService,
  createTransaction as createTransactionService,
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService,
} from '../services/transactionService.js'
import { invalidateBalanceCache } from '../services/balanceService.js'

const txSchema = z.object({
  date: z.coerce.date(),
  amount: z.coerce.number(),
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()),
  subId: z.string().optional().nullable(),
  subName: z.string().optional().nullable(),
  accountId: z.string().optional().nullable(),
  destinationAccountId: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  payee: z.string().optional().nullable(),
})

const txPatchSchema = z.object({
  date: z.coerce.date().optional(),
  amount: z.number().optional(),
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()).optional(),
  subId: z.string().nullable().optional(),
  subName: z.string().nullable().optional(),
  accountId: z.string().nullable().optional(),
  destinationAccountId: z.string().nullable().optional(),
  note: z.string().nullable().optional(),
  payee: z.string().nullable().optional(),
})

export async function listTransactions(req, res, next) {
  try {
    // 🔍 DEBUG: Log ogni chiamata API
    console.log('🚀 API Call: GET /api/transactions')
    console.log('  - User ID:', req.user.id)
    console.log('  - Query params:', req.query)
    console.log('  - URL completa:', req.url)
    
    const data = await listTransactionsService(req.user.id, req.query)
    
    console.log('  - Risultato: trovate', data.length, 'transazioni')
    res.json(data)
  } catch (e) { next(e) }
}

export async function createTransaction(req, res, next) {
  const parsed = txSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body' })
  try {
    const created = await createTransactionService(req.user.id, parsed.data)
    invalidateBalanceCache(req.user.id) // Invalida cache saldo
    res.status(201).json(created)
  } catch (e) { next(e) }
}

export async function updateTransaction(req, res, next) {
  console.log('🔄 UPDATE TRANSACTION API CALL')
  console.log('  - Transaction ID:', req.params.id)
  console.log('  - User ID:', req.user.id)
  console.log('  - Request Body:', JSON.stringify(req.body, null, 2))
  
  const parsed = txPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    console.log('❌ Validation failed:', parsed.error.issues)
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.issues })
  }
  
  console.log('✅ Validation successful:', JSON.stringify(parsed.data, null, 2))
  
  try {
    const updated = await updateTransactionService(req.user.id, req.params.id, parsed.data)
    console.log('✅ Transaction updated successfully')
    invalidateBalanceCache(req.user.id) // Invalida cache saldo
    res.json(updated)
  } catch (e) { 
    console.log('❌ Error updating transaction:', e.message)
    next(e) 
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    await deleteTransactionService(req.user.id, req.params.id)
    invalidateBalanceCache(req.user.id) // Invalida cache saldo
    res.status(204).end()
  } catch (e) { next(e) }
}
