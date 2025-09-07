/**
 * 📄 SAVINGS GOALS ROUTES: Route definitions per obiettivi di risparmio
 * 
 * 🎯 Scopo: Definisce tutti gli endpoint API per la gestione obiettivi
 * 
 * 🔧 Dipendenze principali:
 * - Express Router
 * - Auth middleware per protezione
 * - savingsGoalsController per logica
 * 
 * 📝 Note:
 * - Tutte le route protette da autenticazione JWT
 * - Pattern REST per consistency con altre API
 * - Validazione input delegata al controller
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-04 - Creazione routes
 */

import express from 'express'
import { authRequired } from '../middleware/auth.js'
import { savingsGoalsController } from '../controllers/savingsGoalsController.js'

const router = express.Router()

// 🔸 Applica middleware di autenticazione a tutte le routes
router.use(authRequired)

// =============================================================================
// 🔸 ROUTES CRUD OBIETTIVI
// =============================================================================

/**
 * GET /api/savings-goals
 * Recupera tutti gli obiettivi di risparmio dell'utente
 */
router.get('/', savingsGoalsController.getAllSavingsGoals)

/**
 * GET /api/savings-goals/:id
 * Recupera dettagli specifici di un obiettivo
 */
router.get('/:id', savingsGoalsController.getSavingsGoalById)

/**
 * POST /api/savings-goals
 * Crea nuovo obiettivo di risparmio
 */
router.post('/', savingsGoalsController.createSavingsGoal)

/**
 * PUT /api/savings-goals/:id
 * Aggiorna obiettivo esistente
 */
router.put('/:id', savingsGoalsController.updateSavingsGoal)

/**
 * DELETE /api/savings-goals/:id
 * Elimina obiettivo di risparmio
 */
router.delete('/:id', savingsGoalsController.deleteSavingsGoal)

// =============================================================================
// 🔸 ROUTES OPERAZIONI SALDO
// =============================================================================

/**
 * POST /api/savings-goals/:id/add
 * Aggiungi saldo all'obiettivo
 * 
 * Body: { amount: number, notes?: string }
 */
router.post('/:id/add', savingsGoalsController.addToSavingsGoal)

/**
 * POST /api/savings-goals/:id/withdraw
 * Preleva saldo dall'obiettivo
 * 
 * Body: { amount: number, notes?: string }
 */
router.post('/:id/withdraw', savingsGoalsController.withdrawFromSavingsGoal)

/**
 * POST /api/savings-goals/:id/repeat
 * Ripeti obiettivo completato (riporta a 0 e riattiva)
 */
router.post('/:id/repeat', savingsGoalsController.repeatCompletedSavingsGoal)

// =============================================================================
// 🔸 ROUTES STORICHE E ANALYTICS
// =============================================================================

/**
 * GET /api/savings-goals/:id/history
 * Ottieni storico completo operazioni obiettivo
 */
router.get('/:id/history', savingsGoalsController.getSavingsGoalHistory)

export default router
