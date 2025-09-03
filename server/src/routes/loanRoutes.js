/**
 * 📄 ROUTES: LoanRoutes
 * 
 * 🎯 Scopo: Definisce tutte le rotte HTTP per il sistema prestiti/mutui
 * con middleware di autenticazione e validazione.
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale routes prestiti
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  createLoanController,
  getUserLoansController,
  getLoanDetailsController,
  simulateLoanPayoffController,
  recordLoanPaymentController,
  updateLoanController,
  deleteLoanController,
  getLoanPaymentsController,
  skipLoanPaymentController,
  payNextLoanController,
  payoffLoanController
} from '../controllers/loanController.js'

const router = Router()

// =============================================================================
// 🔒 MIDDLEWARE: Tutte le routes richiedono autenticazione
// =============================================================================
router.use(authRequired)

// =============================================================================
// 📍 LOAN ROUTES
// =============================================================================

/**
 * 🎯 POST /api/loans
 * Crea nuovo prestito/mutuo
 * 
 * Body: {
 *   name: string,
 *   loanType: "MORTGAGE" | "PERSONAL_LOAN",
 *   lenderName: string,
 *   principalAmount: number,
 *   interestRate: number (decimale: 0.035 = 3.5%),
 *   durationMonths: number,
 *   firstPaymentDate: string (ISO),
 *   ...altri parametri opzionali
 * }
 */
router.post('/', createLoanController)

/**
 * 🎯 GET /api/loans
 * Lista tutti i prestiti dell'utente con summary
 * 
 * Response: {
 *   loans: [...],
 *   summary: { totalLoans, activeLoans, totalDebt, monthlyPayments }
 * }
 */
router.get('/', getUserLoansController)

/**
 * 🎯 GET /api/loans/:id
 * Dettagli prestito specifico con statistiche e piano completo
 * 
 * Params: id = loanId
 */
router.get('/:id', getLoanDetailsController)

/**
 * 🎯 PUT /api/loans/:id
 * Aggiorna informazioni prestito (solo campi modificabili)
 * 
 * Body: { name?, description?, notes?, categoryMain?, subcategoryId? }
 */
router.put('/:id', updateLoanController)

/**
 * 🎯 DELETE /api/loans/:id
 * Elimina prestito e tutti i dati collegati
 * ⚠️ Operazione irreversibile
 */
router.delete('/:id', deleteLoanController)

// =============================================================================
// 📍 LOAN PAYMENT ROUTES
// =============================================================================

/**
 * 🎯 GET /api/loans/:id/payments
 * Piano di ammortamento completo del prestito
 * 
 * Response: { schedule: [...], statistics: {...} }
 */
router.get('/:id/payments', getLoanPaymentsController)

/**
 * 🎯 PUT /api/loans/:id/payments/:paymentNumber
 * Registra pagamento di una rata specifica
 * 
 * Params: 
 *   - id = loanId
 *   - paymentNumber = numero rata (1, 2, 3, ...)
 * 
 * Body: {
 *   actualAmount: number,
 *   paidDate: string (ISO),
 *   lateFee?: number,
 *   notes?: string
 * }
 */
router.put('/:id/payments/:paymentNumber', recordLoanPaymentController)

/**
 * 🎯 POST /api/loans/:id/skip-payment
 * Salta la prossima rata del prestito
 * 
 * Params: id = loanId
 * 
 * Response: {
 *   skippedPayment: {...},
 *   loanUpdate: {...},
 *   nextPayment: {...}
 * }
 */
router.post('/:id/skip-payment', skipLoanPaymentController)

/**
 * 🎯 POST /api/loans/:id/pay-next
 * Paga automaticamente la prossima rata del prestito
 * (Usato per materializzare Planned Transactions)
 * 
 * Params: id = loanId
 * 
 * Response: {
 *   payment: {...},
 *   loanUpdate: {...}
 * }
 */
router.post('/:id/pay-next', payNextLoanController)

/**
 * 🎯 POST /api/loans/:id/payoff
 * Estingue completamente un prestito
 * 
 * Params: id = loanId
 * 
 * Body: {
 *   payoffAmount?: number,  // Se non fornito, usa il debito residuo
 *   payoffDate?: string (ISO),  // Se non fornita, usa data corrente
 *   notes?: string,
 *   paymentMethod?: string
 * }
 * 
 * Response: {
 *   loan: {...},
 *   payoffTransaction: {...},
 *   summary: { finalBalance: 0, status: 'PAID_OFF', ... }
 * }
 */
router.post('/:id/payoff', payoffLoanController)

// =============================================================================
// 📍 SIMULATION ROUTES
// =============================================================================

/**
 * 🎯 POST /api/loans/:id/simulate-payoff
 * Simulazione estinzione anticipata per mesi specifici
 * 
 * Body: { targetMonths?: number[] }  // Se vuoto, simula prossimi 12 mesi
 * 
 * Response: {
 *   currentStatus: {...},
 *   simulations: [
 *     {
 *       targetMonth: number,
 *       currentBalance: number,
 *       interestSaved: number,
 *       totalPaymentsSaved: number,
 *       ...
 *     }
 *   ]
 * }
 */
router.post('/:id/simulate-payoff', simulateLoanPayoffController)

export default router
