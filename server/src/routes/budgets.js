// routes/budgets.js
import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  listBudgets,
  upsertBudget,
  batchUpsertBudgets,
  deleteBudget,
  getBudgetsByCategory,
} from '../controllers/budgetsController.js'

const router = Router()
router.use(authRequired)

// GET /api/budgets - Lista tutti i budget dell'utente per anno
router.get('/', listBudgets)

// POST /api/budgets - Upsert singolo budget
router.post('/', upsertBudget)

// POST /api/budgets/batch - Batch upsert di budget
router.post('/batch', batchUpsertBudgets)

// GET /api/budgets/category/:main - Budget per categoria specifica
router.get('/category/:main', getBudgetsByCategory)

// DELETE /api/budgets/:id - Elimina budget specifico
router.delete('/:id', deleteBudget)

export default router
