// @vitest-environment node
import { describe, expect, test, vi, beforeEach } from 'vitest'
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from './transactionsController.js'
import {
  listTransactions as listTransactionsService,
  createTransaction as createTransactionService,
  updateTransaction as updateTransactionService,
  deleteTransaction as deleteTransactionService,
} from '../services/transactionService.js'

vi.mock('../services/transactionService.js', () => ({
  listTransactions: vi.fn(),
  createTransaction: vi.fn(),
  updateTransaction: vi.fn(),
  deleteTransaction: vi.fn(),
}))

function mockRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
  }
}

const userReq = { user: { id: 'u1' } }

describe('transactionsController', () => {
  beforeEach(() => vi.clearAllMocks())

  test('listTransactions returns data', async () => {
    listTransactionsService.mockResolvedValue([{ id: 1 }])
    const req = { ...userReq, query: { page: 1 } }
    const res = mockRes()
    await listTransactions(req, res, vi.fn())
    expect(listTransactionsService).toHaveBeenCalledWith('u1', { page: 1 })
    expect(res.json).toHaveBeenCalledWith([{ id: 1 }])
  })

  test('createTransaction invalid body', async () => {
    const req = { ...userReq, body: { amount: 'x' } }
    const res = mockRes()
    await createTransaction(req, res, vi.fn())
    expect(res.status).toHaveBeenCalledWith(400)
  })

  test('createTransaction success', async () => {
    createTransactionService.mockResolvedValue({ id: 1 })
    const req = { ...userReq, body: { date: new Date(), amount: 1, main: 'A' } }
    const res = mockRes()
    await createTransaction(req, res, vi.fn())
    expect(createTransactionService).toHaveBeenCalledWith('u1', expect.objectContaining({ main: 'A' }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('updateTransaction success', async () => {
    updateTransactionService.mockResolvedValue({ id: 1 })
    const req = { ...userReq, params: { id: '1' }, body: { amount: 2 } }
    const res = mockRes()
    await updateTransaction(req, res, vi.fn())
    expect(updateTransactionService).toHaveBeenCalledWith('u1', '1', { amount: 2 })
  })

  test('deleteTransaction success', async () => {
    const req = { ...userReq, params: { id: '1' } }
    const res = mockRes()
    await deleteTransaction(req, res, vi.fn())
    expect(deleteTransactionService).toHaveBeenCalledWith('u1', '1')
    expect(res.status).toHaveBeenCalledWith(204)
  })
})