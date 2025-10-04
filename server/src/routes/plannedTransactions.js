/**
 * 📄 PLANNED TRANSACTIONS ROUTES: Route definitions per transazioni pianificate
 * 
 * 🎯 Scopo: Definisce gli endpoint REST per transazioni pianificate e gruppi
 * 
 * 🔧 Dipendenze principali:
 * - Express Router
 * - Auth middleware
 * - plannedTransactionsController
 * 
 * @author Finance WebApp Team
 * @modified 23 Agosto 2025 - Creazione iniziale
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  listPlannedTransactions,
  createPlannedTransaction,
  updatePlannedTransaction,
  deletePlannedTransaction,
  listTransactionGroups,
  createTransactionGroup,
  updateTransactionGroup,
  deleteTransactionGroup,
  reorderTransactionGroups,
  movePlannedTransaction,
  materializePlannedTransaction,
  getPlannedTransactionsDue,
  getUpcomingPlannedTransactions,
  getNextOccurrences,
  applyToBudgeting,
  removeFromBudgeting,
  toggleActive,
} from '../controllers/plannedTransactionsController.js'

const router = Router()
router.use(authRequired)

// 🔸 Routes per transazioni pianificate
router.get('/', listPlannedTransactions)
router.post('/', createPlannedTransaction)
router.put('/:id', updatePlannedTransaction)
router.delete('/:id', deletePlannedTransaction)

// 🔸 Routes per materializzazione
router.post('/:id/materialize', materializePlannedTransaction)
router.get('/due', getPlannedTransactionsDue)
router.get('/upcoming', getUpcomingPlannedTransactions)

// 🔸 Route per materializzazione automatica manuale (admin/testing)
router.post('/auto-materialize-today', async (req, res, next) => {
  try {
    const { runManualMaterialization } = await import('../services/schedulerService.js')
    console.log('🎯 Manual auto-materialization triggered via API')
    await runManualMaterialization()
    res.json({ 
      message: 'Auto-materialization executed successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    next(error)
  }
})

// 🔸 Routes per spostamento tra gruppi
router.patch('/:id/move', movePlannedTransaction)

// 🔸 Route per calcolo prossime occorrenze
router.get('/next-occurrences', getNextOccurrences)

// 🔸 Routes per integrazione budgeting
router.post('/:id/apply-to-budgeting', applyToBudgeting)
router.delete('/:id/apply-to-budgeting', removeFromBudgeting)

// 🔸 Route per attivazione/disattivazione
router.patch('/:id/toggle-active', toggleActive)

// 🔸 Routes per gruppi di transazioni
router.get('/groups', listTransactionGroups)
router.post('/groups', createTransactionGroup)
router.put('/groups/:id', updateTransactionGroup)
router.delete('/groups/:id', deleteTransactionGroup)
router.patch('/groups/reorder', reorderTransactionGroups)

export default router
