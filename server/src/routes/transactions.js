import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  listTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionsController.js'

const router = Router()
router.use(authRequired)

router.get('/', listTransactions)
router.post('/', createTransaction)
router.put('/:id', updateTransaction)
router.delete('/:id', deleteTransaction)

export default router
