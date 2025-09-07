/**
 * 📄 SAVINGS GOALS CONTROLLER: Gestione endpoint API obiettivi risparmio
 * 
 * 🎯 Scopo: Gestisce le richieste HTTP per obiettivi di risparmio
 * 
 * 🔧 Dipendenze principali:
 * - Zod per validazione input
 * - savingsGoalService per business logic
 * 
 * 📝 Note:
 * - Validazione completa input con Zod schemas
 * - Gestione errori centralizzata
 * - Risposte JSON standardizzate
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-04 - Creazione controller
 */

import { z } from 'zod'
import { savingsGoalService } from '../services/savingsGoalService.js'

// =============================================================================
// 🔸 VALIDATION SCHEMAS
// =============================================================================

const createGoalSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio').max(100, 'Titolo troppo lungo'),
  targetAmount: z.number().positive('L\'importo deve essere positivo').max(999999999, 'Importo troppo alto'),
  targetDate: z.string().refine(date => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed > new Date()
  }, 'Data scadenza non valida o non futura').optional().or(z.literal('')),
  subcategoryId: z.string().min(1, 'La sottocategoria è obbligatoria'),
  notes: z.string().max(500, 'Note troppo lunghe').optional(),
  iconKey: z.string().max(50).optional()
})

const updateGoalSchema = z.object({
  title: z.string().min(1, 'Il titolo è obbligatorio').max(100, 'Titolo troppo lungo').optional(),
  targetAmount: z.number().positive('L\'importo deve essere positivo').max(999999999, 'Importo troppo alto').optional(),
  targetDate: z.string().refine(date => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime()) && parsed > new Date()
  }, 'Data scadenza non valida o non futura').optional().or(z.literal('')),
  subcategoryId: z.string().min(1).optional(),
  notes: z.string().max(500, 'Note troppo lunghe').optional(),
  iconKey: z.string().max(50).optional()
})

const balanceOperationSchema = z.object({
  amount: z.number().positive('L\'importo deve essere positivo').max(999999999, 'Importo troppo alto'),
  notes: z.string().max(200, 'Note troppo lunghe').optional(),
  subcategoryId: z.string().optional().nullable()
})

// =============================================================================
// 🔸 CONTROLLER FUNCTIONS
// =============================================================================

/**
 * 🎯 GET /api/savings-goals
 * Recupera tutti gli obiettivi di risparmio dell'utente
 */
export async function getAllSavingsGoals(req, res, next) {
  try {
    const userId = req.user.id
    
    const goals = await savingsGoalService.getUserSavingsGoals(userId)
    
    res.status(200).json(goals)
  } catch (error) {
    console.error('❌ Errore nel recupero obiettivi:', error)
    next(error)
  }
}

/**
 * 🎯 GET /api/savings-goals/:id
 * Recupera dettagli specifici di un obiettivo
 */
export async function getSavingsGoalById(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID obiettivo richiesto'
      })
    }
    
    const goal = await savingsGoalService.getSavingsGoalById(userId, id)
    
    res.status(200).json(goal)
  } catch (error) {
    console.error('❌ Errore nel recupero obiettivo:', error)
    if (error.message.includes('non trovato')) {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }
    next(error)
  }
}

/**
 * 🎯 POST /api/savings-goals
 * Crea nuovo obiettivo di risparmio
 */
export async function createSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id
    
    // 🔸 Validazione input
    const validatedData = createGoalSchema.parse({
      ...req.body,
      targetAmount: parseFloat(req.body.targetAmount)
    })
    
    const newGoal = await savingsGoalService.createSavingsGoal(userId, validatedData)
    
    res.status(201).json(newGoal)
  } catch (error) {
    console.error('❌ Errore nella creazione obiettivo:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dati non validi',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }
    
    if (error.message.includes('Sottocategoria non valida')) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }
    
    next(error)
  }
}

/**
 * 🎯 PUT /api/savings-goals/:id
 * Aggiorna obiettivo esistente
 */
export async function updateSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID obiettivo richiesto'
      })
    }
    
    // 🔸 Validazione input
    const updateData = { ...req.body }
    if (updateData.targetAmount) {
      updateData.targetAmount = parseFloat(updateData.targetAmount)
    }
    
    const validatedData = updateGoalSchema.parse(updateData)
    
    const updatedGoal = await savingsGoalService.updateSavingsGoal(userId, id, validatedData)
    
    res.status(200).json(updatedGoal)
  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento obiettivo:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dati non validi',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }
    
    if (error.message.includes('non trovato')) {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }
    
    if (error.message.includes('completato')) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }
    
    next(error)
  }
}

/**
 * 🎯 POST /api/savings-goals/:id/add
 * Aggiungi saldo all'obiettivo
 */
export async function addToSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID obiettivo richiesto'
      })
    }
    
    // 🔸 Validazione input
    const validatedData = balanceOperationSchema.parse({
      ...req.body,
      amount: parseFloat(req.body.amount)
    })
    
    const result = await savingsGoalService.addToGoal(
      userId, 
      id, 
      validatedData.amount, 
      validatedData.notes
    )
    
    res.status(200).json({
      goal: result.goal,
      progressPercentage: result.newProgressPercentage,
      transactionId: result.transaction.id
    })
  } catch (error) {
    console.error('❌ Errore nell\'aggiunta saldo:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dati non validi',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }
    
    if (error.message.includes('non trovato') || error.message.includes('non attivo')) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }
    
    next(error)
  }
}

/**
 * 🎯 POST /api/savings-goals/:id/withdraw
 * Preleva saldo dall'obiettivo
 */
export async function withdrawFromSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID obiettivo richiesto'
      })
    }
    
    // 🔸 Validazione input
    const validatedData = balanceOperationSchema.parse({
      ...req.body,
      amount: parseFloat(req.body.amount)
    })
    
    const result = await savingsGoalService.withdrawFromGoal(
      userId, 
      id, 
      validatedData.amount, 
      validatedData.notes,
      validatedData.subcategoryId
    )
    
    res.status(200).json({
      goal: result.goal,
      progressPercentage: result.newProgressPercentage,
      transactionId: result.transaction.id
    })
  } catch (error) {
    console.error('❌ Errore nel prelievo saldo:', error)
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Dati non validi',
        details: error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      })
    }
    
    if (error.message.includes('non trovato') || 
        error.message.includes('completato') ||
        error.message.includes('saldo disponibile')) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }
    
    next(error)
  }
}

/**
 * 🎯 DELETE /api/savings-goals/:id
 * Elimina obiettivo di risparmio
 */
export async function deleteSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID obiettivo richiesto'
      })
    }
    
    const result = await savingsGoalService.deleteSavingsGoal(userId, id)
    
    res.status(204).send() // 204 No Content per delete operations
  } catch (error) {
    console.error('❌ Errore nell\'eliminazione obiettivo:', error)
    
    if (error.message.includes('non trovato')) {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }
    
    next(error)
  }
}

/**
 * 🎯 POST /api/savings-goals/:id/repeat
 * Ripeti obiettivo completato (riporta a 0 e attiva)
 */
export async function repeatCompletedSavingsGoal(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID obiettivo richiesto'
      })
    }
    
    const result = await savingsGoalService.repeatCompletedGoal(userId, id)
    
    res.status(200).json({
      goal: result.goal,
      refundedAmount: result.refundedAmount
    })
  } catch (error) {
    console.error('❌ Errore nella ripetizione obiettivo:', error)
    
    if (error.message.includes('non trovato') || 
        error.message.includes('completati')) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }
    
    next(error)
  }
}

/**
 * 🎯 GET /api/savings-goals/:id/history
 * Ottieni storico operazioni obiettivo
 */
export async function getSavingsGoalHistory(req, res, next) {
  try {
    const userId = req.user.id
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID obiettivo richiesto'
      })
    }
    
    // 🔸 Verifica esistenza obiettivo e recupera dettagli con storico completo
    const goal = await savingsGoalService.getSavingsGoalById(userId, id)
    
    res.status(200).json({
      goalId: id,
      title: goal.title,
      transactions: goal.goalTransactions,
      totalDeposits: goal.totalDeposits,
      totalWithdrawals: goal.totalWithdrawals,
      netAmount: goal.currentAmount
    })
  } catch (error) {
    console.error('❌ Errore nel recupero storico:', error)
    
    if (error.message.includes('non trovato')) {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }
    
    next(error)
  }
}

// Export delle funzioni del controller
export const savingsGoalsController = {
  getAllSavingsGoals,
  getSavingsGoalById,
  createSavingsGoal,
  updateSavingsGoal,
  addToSavingsGoal,
  withdrawFromSavingsGoal,
  deleteSavingsGoal,
  repeatCompletedSavingsGoal,
  getSavingsGoalHistory
}
