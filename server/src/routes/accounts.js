/**
 * 📄 ACCOUNTS ROUTES: Route definizioni per API accounts
 * 
 * 🎯 Scopo: Definisce gli endpoint HTTP per gestione conti
 * 
 * 🔧 Dipendenze principali:
 * - Express Router
 * - Auth middleware per protezione JWT
 * - Account controller per handling requests
 * 
 * 📝 Note:
 * - Tutti gli endpoint richiedono autenticazione JWT
 * - Validazione input gestita nel controller
 * - Supporto completo REST API pattern
 * 
 * @author Finance WebApp Team
 * @modified 14 Settembre 2025 - Creazione routes accounts
 */

// 🔸 Import dependencies
import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  getAccounts,
  getAccountById,
  createAccount,
  updateAccount,
  deleteAccount,
  getAccountsStats,
  recalculateAccountBalance
} from '../controllers/accountsController.js'

const router = Router()

// 🔸 Applica middleware auth a tutte le route
router.use(authRequired)

/**
 * 🎯 ROUTES: CRUD Accounts
 */

// GET /api/accounts - Ottieni tutti i conti dell'utente
router.get('/', getAccounts)

// GET /api/accounts/stats - Ottieni statistiche conti
router.get('/stats', getAccountsStats)

// GET /api/accounts/:id - Ottieni conto specifico
router.get('/:id', getAccountById)

// POST /api/accounts - Crea nuovo conto
router.post('/', createAccount)

// PUT /api/accounts/:id - Aggiorna conto esistente
router.put('/:id', updateAccount)

// DELETE /api/accounts/:id - Elimina conto
router.delete('/:id', deleteAccount)

// POST /api/accounts/:id/recalculate-balance - Ricalcola balance conto
router.post('/:id/recalculate-balance', recalculateAccountBalance)

export default router
