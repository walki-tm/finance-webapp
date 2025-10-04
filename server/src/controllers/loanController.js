/**
 * 📄 CONTROLLER: LoanController
 * 
 * 🎯 Scopo: Gestisce le richieste HTTP per il sistema prestiti/mutui
 * con validazione input, gestione errori e risposte standardizzate.
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale API prestiti
 */

import { z } from 'zod'
import {
  createLoan,
  getUserLoans,
  getLoanDetails,
  simulateLoanPayoff,
  payLoan, // Nuova funzione per pagamenti
  payoffLoan, // Funzione per estinzione anticipata
  updateLoan,
  deleteLoan,
  skipLoanPayment,
  cleanupCompletedLoanPlannedTransactions
} from '../services/loanService.js'

// =============================================================================
// 📋 VALIDATION SCHEMAS
// =============================================================================

const createLoanSchema = z.object({
  name: z.string().min(1, 'Loan name is required').max(100, 'Name too long'),
  loanType: z.enum(['MORTGAGE', 'PERSONAL_LOAN'], {
    errorMap: () => ({ message: 'Loan type must be MORTGAGE or PERSONAL_LOAN' })
  }),
  lenderName: z.string().min(1, 'Lender name is required').max(100, 'Lender name too long'),
  principalAmount: z.number()
    .min(1, 'Principal amount must be positive')
    .max(10000000, 'Principal amount exceeds maximum limit'),
  interestRate: z.number()
    .min(0, 'Interest rate cannot be negative')
    .max(1, 'Interest rate cannot exceed 100%'),
  effectiveRate: z.number().min(0).max(1).optional(),
  rateType: z.enum(['FIXED', 'VARIABLE']).default('FIXED'),
  durationMonths: z.number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 month')
    .max(600, 'Duration cannot exceed 600 months'),
  firstPaymentDate: z.string()
    .refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  startDate: z.string()
    .refine(date => !isNaN(Date.parse(date)), 'Invalid date format')
    .optional(),
  monthlyPayment: z.number()
    .min(1, 'Monthly payment must be positive'),
  paymentFrequency: z.enum(['MONTHLY', 'QUARTERLY', 'SEMIANNUAL']).default('MONTHLY'),
  additionalCosts: z.number().min(0).optional(),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  categoryMain: z.string().max(32).optional(),
  subcategoryId: z.string().optional(),
  accountId: z.string().optional(), // 🏦 Account associato al prestito
  autoCreatePayments: z.boolean().default(true)
})

const recordPaymentSchema = z.object({
  paymentNumber: z.number().int().min(1),
  actualAmount: z.number().min(0, 'Payment amount cannot be negative'),
  paidDate: z.string()
    .refine(date => !isNaN(Date.parse(date)), 'Invalid date format'),
  lateFee: z.number().min(0).optional(),
  notes: z.string().max(500).optional()
})

const updateLoanSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  categoryMain: z.string().max(32).optional(),
  subcategoryId: z.string().optional(),
  accountId: z.string().optional() // 🏦 Account associato al prestito
})

const simulatePayoffSchema = z.object({
  targetMonths: z.array(z.number().int().min(1)).optional()
})

const payoffLoanSchema = z.object({
  payoffType: z.enum(['TOTAL', 'PARTIAL'], {
    errorMap: () => ({ message: 'Payoff type must be TOTAL or PARTIAL' })
  }),
  payoffAmount: z.number().min(0, 'Payoff amount cannot be negative'),
  payoffDate: z.string()
    .refine(date => !isNaN(Date.parse(date)), 'Invalid date format')
    .optional()
    .default(() => new Date().toISOString().split('T')[0]),
  penaltyAmount: z.number().min(0, 'Penalty amount cannot be negative').optional().default(0),
  penaltyType: z.enum(['PERCENTAGE', 'FIXED']).optional().default('PERCENTAGE'),
  totalAmount: z.number().min(0, 'Total amount cannot be negative'),
  notes: z.string().max(500).optional(),
  paymentMethod: z.string().max(50).optional().default('BANK_TRANSFER'),
  recalculationType: z.enum(['RECALCULATE_PAYMENT', 'RECALCULATE_DURATION'], {
    errorMap: () => ({ message: 'Recalculation type must be RECALCULATE_PAYMENT or RECALCULATE_DURATION' })
  }).optional().default('RECALCULATE_PAYMENT')
})

// =============================================================================
// 🎯 CONTROLLER FUNCTIONS
// =============================================================================

/**
 * 🎯 POST /api/loans
 * Crea nuovo prestito/mutuo
 */
export async function createLoanController(req, res, next) {
  try {
    // 🔸 Validazione input
    const validatedData = createLoanSchema.parse(req.body)
    
    const userId = req.user.id

    // 🔸 Conversione date
    // Gestione mapping startDate -> firstPaymentDate se necessario
    if (validatedData.startDate && !validatedData.firstPaymentDate) {
      validatedData.firstPaymentDate = validatedData.startDate
    }
    validatedData.firstPaymentDate = new Date(validatedData.firstPaymentDate)
    
    // Rimuovi startDate dal payload se presente (non esiste nel database)
    delete validatedData.startDate

    // 🔸 Creazione prestito
    const result = await createLoan(userId, validatedData)

    // 🔸 Risposta successo
    res.status(201).json({
      success: true,
      message: 'Loan created successfully',
      data: {
        loan: result.loan,
        amortization: result.amortization,
        schedulePreview: result.schedule.slice(0, 12) // Prime 12 rate
      }
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }

    console.error('❌ Create loan error:', error)
    next(error)
  }
}

/**
 * 🎯 GET /api/loans
 * Lista tutti i prestiti dell'utente
 */
export async function getUserLoansController(req, res, next) {
  try {
    const userId = req.user.id
    
    // 🔸 Prima pulisce le planned transactions dei prestiti completati
    try {
      await cleanupCompletedLoanPlannedTransactions(userId)
    } catch (cleanupError) {
      console.warn('⚠️ Planned transaction cleanup failed:', cleanupError.message)
      // Non blocca l'operazione principale
    }
    
    const result = await getUserLoans(userId) // Il servizio ora restituisce { loans, summary }

    res.json({
      success: true,
      data: result // Usa direttamente il risultato del servizio
    })

  } catch (error) {
    console.error('❌ Get user loans error:', error)
    next(error)
  }
}

/**
 * 🎯 GET /api/loans/:id
 * Dettagli prestito specifico con piano ammortamento
 */
export async function getLoanDetailsController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      })
    }

    const loanDetails = await getLoanDetails(userId, loanId)

    res.json({
      success: true,
      data: loanDetails
    })

  } catch (error) {
    if (error.message === 'Loan not found') {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      })
    }

    console.error('❌ Get loan details error:', error)
    next(error)
  }
}

/**
 * 🎯 POST /api/loans/:id/simulate-payoff
 * Simulazione estinzione anticipata
 */
export async function simulateLoanPayoffController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id
    const validatedData = simulatePayoffSchema.parse(req.body)

    const simulation = await simulateLoanPayoff(
      userId, 
      loanId, 
      validatedData.targetMonths || []
    )

    res.json({
      success: true,
      data: simulation
    })

  } catch (error) {
    if (error.message === 'Loan not found') {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      })
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      })
    }

    console.error('❌ Simulate loan payoff error:', error)
    next(error)
  }
}

/**
 * 🎯 PUT /api/loans/:id/payments/:paymentNumber
 * Registra pagamento di una rata
 */
export async function recordLoanPaymentController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id
    const paymentNumber = parseInt(req.params.paymentNumber)
    
    // 🔸 Validazione parametri URL
    if (!loanId || isNaN(paymentNumber) || paymentNumber < 1) {
      return res.status(400).json({
        success: false,
        message: 'Invalid loan ID or payment number'
      })
    }

    // 🔸 Validazione body
    const validatedData = recordPaymentSchema.parse(req.body)
    validatedData.paymentNumber = paymentNumber

    // 🔸 Registrazione pagamento con nuova API ottimizzata
    const result = await payLoan(userId, loanId, validatedData)

    // 🔸 Risposta con dettagli aggiornamento
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment: result.payment,
        loanUpdate: {
          newBalance: result.loan.currentBalance,
          paidPayments: result.loan.paidPayments,
          nextPaymentDate: result.loan.nextPaymentDate,
          status: result.loan.status
        }
      }
    })

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    if (error.message === 'Payment already recorded') {
      return res.status(409).json({
        success: false,
        message: 'Payment has already been recorded'
      })
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      })
    }

    console.error('❌ Record loan payment error:', error)
    next(error)
  }
}

/**
 * 🎯 PUT /api/loans/:id
 * Aggiorna informazioni prestito
 */
export async function updateLoanController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id
    
    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      })
    }

    const validatedData = updateLoanSchema.parse(req.body)
    const updatedLoan = await updateLoan(userId, loanId, validatedData)

    res.json({
      success: true,
      message: 'Loan updated successfully',
      data: updatedLoan
    })

  } catch (error) {
    if (error.message === 'Loan not found') {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      })
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      })
    }

    console.error('❌ Update loan error:', error)
    next(error)
  }
}

/**
 * 🎯 DELETE /api/loans/:id
 * Elimina prestito e tutti i dati collegati
 */
export async function deleteLoanController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id

    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      })
    }

    await deleteLoan(userId, loanId)

    res.json({
      success: true,
      message: 'Loan deleted successfully'
    })

  } catch (error) {
    if (error.message === 'Loan not found') {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      })
    }

    console.error('❌ Delete loan error:', error)
    next(error)
  }
}

/**
 * 🎯 POST /api/loans/:id/skip-payment
 * Salta la prossima rata del prestito
 */
export async function skipLoanPaymentController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id
    
    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      })
    }

    // 🔸 Salta il pagamento
    const result = await skipLoanPayment(userId, loanId)

    // 🆕 NUOVO: Recupera la planned transaction aggiornata per confermare la sincronizzazione
    const { prisma } = await import('../lib/prisma.js')
    const updatedPlannedTx = await prisma.plannedTransaction.findFirst({
      where: { loanId, userId },
      include: { subcategory: true }
    })

    // 🔸 Risposta con dettagli aggiornamento
    res.json({
      success: true,
      message: 'Payment skipped successfully',
      data: {
        loan: result.loan,
        nextPayment: {
          dueDate: result.loan.nextPaymentDate,
          amount: result.loan.monthlyPayment,
          paymentNumber: result.loan.paidPayments + 1
        },
        updatedPlannedTransaction: updatedPlannedTx
      }
    })

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    if (error.message === 'No payments available to skip') {
      return res.status(400).json({
        success: false,
        message: 'No payments available to skip'
      })
    }

    console.error('❌ Skip loan payment error:', error)
    next(error)
  }
}

/**
 * 🎯 GET /api/loans/:id/payments
 * Piano di ammortamento completo (alias per dettagli prestito)
 */
/**
 * 🎯 POST /api/loans/:id/pay-next
 * Paga automaticamente la prossima rata del prestito
 * (Usato per materializzare Planned Transactions)
 */
export async function payNextLoanController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id
    
    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      })
    }

    // 🔸 Paga la prossima rata automaticamente (senza dati aggiuntivi)
    const result = await payLoan(userId, loanId, {})

    // 🔸 Risposta con dettagli aggiornamento
    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        payment: result.payment,
        loanUpdate: {
          newBalance: result.loan.currentBalance,
          paidPayments: result.loan.paidPayments,
          nextPaymentDate: result.loan.nextPaymentDate,
          status: result.loan.status
        }
      }
    })

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    if (error.message === 'Loan is already paid off') {
      return res.status(400).json({
        success: false,
        message: 'Loan is already paid off'
      })
    }

    console.error('❌ Pay next loan payment error:', error)
    next(error)
  }
}

/**
 * 🎯 POST /api/loans/:id/payoff
 * Estingue completamente un prestito
 */
export async function payoffLoanController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id
    
    if (!loanId) {
      return res.status(400).json({
        success: false,
        message: 'Loan ID is required'
      })
    }

    // 🔸 Validazione body
    const validatedData = payoffLoanSchema.parse(req.body)

    // 🔸 Estinzione prestito
    const result = await payoffLoan(userId, loanId, validatedData)

    // 🔸 Risposta con dettagli estinzione
    const isTotal = result.summary.type === 'TOTAL'
    res.json({
      success: true,
      message: `Loan ${isTotal ? 'paid off' : 'partially paid off'} successfully`,
      data: {
        loan: result.loan,
        loanTransaction: result.loanTransaction,
        payoffTransaction: result.payoffTransaction,
        summary: {
          type: result.summary.type,
          finalBalance: result.summary.newBalance,
          status: result.loan.status,
          payoffAmount: result.summary.payoffAmount,
          penaltyAmount: result.summary.penaltyAmount,
          totalAmount: result.summary.totalAmount,
          payoffDate: result.loanTransaction.paidDate,
          remainingPayments: result.summary.remainingPayments
        }
      }
    })

  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message
      })
    }

    if (error.message === 'Loan is already paid off') {
      return res.status(400).json({
        success: false,
        message: 'Loan is already paid off'
      })
    }

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      })
    }

    console.error('❌ Payoff loan error:', error)
    next(error)
  }
}

/**
 * 🎯 GET /api/loans/:id/payments
 * Piano di ammortamento completo (alias per dettagli prestito)
 */
export async function getLoanPaymentsController(req, res, next) {
  try {
    const userId = req.user.id
    const loanId = req.params.id

    const loanDetails = await getLoanDetails(userId, loanId)
    
    // 🔸 Restituisce solo il piano ammortamento
    res.json({
      success: true,
      data: {
        loanId: loanDetails.id,
        loanName: loanDetails.name,
        schedule: loanDetails.schedule,
        statistics: loanDetails.statistics
      }
    })

  } catch (error) {
    if (error.message === 'Loan not found') {
      return res.status(404).json({
        success: false,
        message: 'Loan not found'
      })
    }

    console.error('❌ Get loan payments error:', error)
    next(error)
  }
}
