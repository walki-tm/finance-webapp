/**
 * 📄 SAVINGS GOAL SERVICE: Gestione obiettivi di risparmio
 * 
 * 🎯 Scopo: Business logic per CRUD operazioni e gestione saldi obiettivi
 * 
 * 🔧 Dipendenze principali:
 * - Prisma ORM per database operations
 * - Transaction service per integrazione transazioni
 * 
 * 📝 Note:
 * - Gestisce operazioni ADD/WITHDRAW con validazioni business
 * - Integrazione completa con sistema transazioni globali
 * - Calcoli automatici percentuali progresso e stati
 * 
 * @author Finance WebApp Team
 * @modified 2025-09-04 - Creazione servizio
 */

import { prisma } from '../lib/prisma.js'
import { invalidateBalanceCache } from './balanceService.js'

/**
 * 🎯 SERVICE: Ottieni tutti gli obiettivi di risparmio dell'utente
 */
export async function getUserSavingsGoals(userId) {
  try {
    const goals = await prisma.savingsGoal.findMany({
      where: { 
        userId,
        // Esclude obiettivi scaduti completati automaticamente
        status: {
          not: 'EXPIRED'
        }
      },
      include: {
        subcategory: {
          include: {
            Category: true
          }
        },
        goalTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 5 // Ultime 5 operazioni per anteprima
        }
      },
      orderBy: [
        { status: 'asc' }, // ACTIVE prima di COMPLETED
        { targetDate: 'asc' } // Scadenza più vicina prima
      ]
    })

    // 🔸 Calcola metriche e stati per ogni obiettivo
    return goals.map(goal => ({
      ...goal,
      progressPercentage: calculateProgressPercentage(goal.currentAmount, goal.targetAmount),
      isOverdue: goal.targetDate ? (new Date() > new Date(goal.targetDate) && goal.status === 'ACTIVE') : false,
      daysRemaining: goal.targetDate ? calculateDaysRemaining(goal.targetDate) : null,
      monthlyTarget: goal.targetDate ? calculateMonthlyTarget(goal.targetAmount, goal.currentAmount, goal.targetDate) : null,
      status: determineGoalStatus(goal)
    }))
  } catch (error) {
    console.error('❌ Errore nel recupero obiettivi risparmio:', error)
    throw new Error('Impossibile recuperare gli obiettivi di risparmio')
  }
}

/**
 * 🎯 SERVICE: Ottieni dettagli specifici obiettivo
 */
export async function getSavingsGoalById(userId, goalId) {
  try {
    const goal = await prisma.savingsGoal.findFirst({
      where: { 
        id: goalId,
        userId 
      },
      include: {
        subcategory: {
          include: {
            Category: true
          }
        },
        goalTransactions: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!goal) {
      throw new Error('Obiettivo di risparmio non trovato')
    }

    // 🔸 Arricchisci con metriche calcolate
    return {
      ...goal,
      progressPercentage: calculateProgressPercentage(goal.currentAmount, goal.targetAmount),
      isOverdue: goal.targetDate ? (new Date() > new Date(goal.targetDate) && goal.status === 'ACTIVE') : false,
      daysRemaining: goal.targetDate ? calculateDaysRemaining(goal.targetDate) : null,
      monthlyTarget: goal.targetDate ? calculateMonthlyTarget(goal.targetAmount, goal.currentAmount, goal.targetDate) : null,
      totalDeposits: goal.goalTransactions.reduce((sum, t) => 
        t.type === 'ADD' ? sum + parseFloat(t.amount) : sum, 0),
      totalWithdrawals: goal.goalTransactions.reduce((sum, t) => 
        t.type === 'WITHDRAW' ? sum + parseFloat(t.amount) : sum, 0)
    }
  } catch (error) {
    console.error('❌ Errore nel recupero obiettivo:', error)
    throw new Error(error.message || 'Impossibile recuperare i dettagli dell\'obiettivo')
  }
}

/**
 * 🎯 SERVICE: Crea nuovo obiettivo di risparmio
 */
export async function createSavingsGoal(userId, goalData) {
  try {
    // 🔸 Validazione dati input
    validateGoalData(goalData)

    // 🔸 Verifica esistenza sottocategoria
    const subcategory = await prisma.subcategory.findFirst({
      where: {
        id: goalData.subcategoryId,
        userId
      },
      include: {
        Category: true
      }
    })

    if (!subcategory) {
      throw new Error('Sottocategoria non valida')
    }

    // 🔸 Crea obiettivo
    const newGoal = await prisma.savingsGoal.create({
      data: {
        userId,
        title: goalData.title.trim(),
        targetAmount: parseFloat(goalData.targetAmount),
        targetDate: goalData.targetDate && goalData.targetDate.trim() ? new Date(goalData.targetDate) : null,
        categoryMain: subcategory.Category.main,
        subcategoryId: goalData.subcategoryId,
        notes: goalData.notes?.trim() || null,
        iconKey: goalData.iconKey || null
      },
      include: {
        subcategory: {
          include: {
            Category: true
          }
        }
      }
    })

    return {
      ...newGoal,
      progressPercentage: 0,
      isOverdue: false,
      daysRemaining: newGoal.targetDate ? calculateDaysRemaining(newGoal.targetDate) : null,
      monthlyTarget: newGoal.targetDate ? calculateMonthlyTarget(newGoal.targetAmount, 0, newGoal.targetDate) : null
    }
  } catch (error) {
    console.error('❌ Errore nella creazione obiettivo:', error)
    throw new Error(error.message || 'Impossibile creare l\'obiettivo di risparmio')
  }
}

/**
 * 🎯 SERVICE: Aggiorna obiettivo esistente
 */
export async function updateSavingsGoal(userId, goalId, updateData) {
  try {
    // 🔸 Verifica esistenza e proprietà
    const existingGoal = await prisma.savingsGoal.findFirst({
      where: { id: goalId, userId }
    })

    if (!existingGoal) {
      throw new Error('Obiettivo non trovato')
    }

    if (existingGoal.status === 'COMPLETED') {
      throw new Error('Non è possibile modificare un obiettivo completato')
    }

    // 🔸 Validazione dati aggiornamento
    if (updateData.targetAmount) {
      validateGoalData({ ...existingGoal, ...updateData })
    }

    // 🔸 Aggiornamento
    const updatedGoal = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        title: updateData.title?.trim(),
        targetAmount: updateData.targetAmount ? parseFloat(updateData.targetAmount) : undefined,
        targetDate: updateData.targetDate !== undefined ? (updateData.targetDate && updateData.targetDate.trim() ? new Date(updateData.targetDate) : null) : undefined,
        subcategoryId: updateData.subcategoryId,
        notes: updateData.notes?.trim(),
        iconKey: updateData.iconKey,
        updatedAt: new Date()
      },
      include: {
        subcategory: {
          include: {
            Category: true
          }
        }
      }
    })

    // 🔸 Ricalcola stato se necessario
    const finalStatus = determineGoalStatus(updatedGoal)
    if (finalStatus !== updatedGoal.status) {
      await prisma.savingsGoal.update({
        where: { id: goalId },
        data: { status: finalStatus }
      })
    }

    return getSavingsGoalById(userId, goalId)
  } catch (error) {
    console.error('❌ Errore nell\'aggiornamento obiettivo:', error)
    throw new Error(error.message || 'Impossibile aggiornare l\'obiettivo')
  }
}

/**
 * 🎯 SERVICE: Aggiungi saldo all'obiettivo
 */
export async function addToGoal(userId, goalId, amount, notes = null) {
  return await prisma.$transaction(async (tx) => {
    try {
      // 🔸 Verifica obiettivo
      const goal = await tx.savingsGoal.findFirst({
        where: { id: goalId, userId },
        include: { subcategory: { include: { Category: true } } }
      })

      if (!goal) {
        throw new Error('Obiettivo non trovato')
      }

      if (goal.status !== 'ACTIVE') {
        throw new Error('Impossibile aggiungere saldo a un obiettivo non attivo')
      }

      const addAmount = parseFloat(amount)
      if (addAmount <= 0) {
        throw new Error('L\'importo deve essere positivo')
      }

      // 🔸 Verifica saldo disponibile globale
      // Questa verifica dovrebbe essere fatta chiamando il balance service
      // Per ora la saltiamo, ma dovrebbe essere implementata

      // 🔸 Calcola nuovo saldo
      const newCurrentAmount = parseFloat(goal.currentAmount) + addAmount

      // 🔸 Determina nuovo stato
      let newStatus = goal.status
      if (newCurrentAmount >= parseFloat(goal.targetAmount)) {
        newStatus = 'COMPLETED'
      }

      // 🔸 Aggiorna obiettivo
      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newCurrentAmount,
          status: newStatus,
          updatedAt: new Date()
        }
      })

      // 🔸 Crea transazione principale nel sistema
      // Nota: L'aggiunta di saldo all'obiettivo è un'uscita dal saldo principale
      const transaction = await tx.transaction.create({
        data: {
          userId,
          date: new Date(),
          amount: addAmount,
          main: goal.categoryMain,
          subId: goal.subcategoryId,
          note: `Aggiunto a obiettivo: ${goal.title}${notes ? ` - ${notes}` : ''}`,
          payee: null
        }
      })

      // 🔸 Registra operazione obiettivo
      await tx.goalTransaction.create({
        data: {
          userId,
          goalId,
          amount: addAmount,
          type: 'ADD',
          transactionId: transaction.id,
          notes: notes?.trim() || null
        }
      })

      // 🔸 Invalida cache saldo dopo operazione
      invalidateBalanceCache(userId)
      
      return {
        goal: updatedGoal,
        transaction,
        newProgressPercentage: calculateProgressPercentage(newCurrentAmount, goal.targetAmount)
      }
    } catch (error) {
      console.error('❌ Errore nell\'aggiunta saldo obiettivo:', error)
      throw new Error(error.message || 'Impossibile aggiungere saldo all\'obiettivo')
    }
  })
}

/**
 * 🎯 SERVICE: Preleva saldo dall'obiettivo
 */
export async function withdrawFromGoal(userId, goalId, amount, notes = null, subcategoryId = null) {
  return await prisma.$transaction(async (tx) => {
    try {
      // 🔸 Verifica obiettivo
      const goal = await tx.savingsGoal.findFirst({
        where: { id: goalId, userId },
        include: { subcategory: { include: { Category: true } } }
      })

      if (!goal) {
        throw new Error('Obiettivo non trovato')
      }

      // 🔸 Gli obiettivi completati ora permettono prelievi
      // Rimozione del controllo che bloccava prelievi da obiettivi completati

      const withdrawAmount = parseFloat(amount)
      if (withdrawAmount <= 0) {
        throw new Error('L\'importo deve essere positivo')
      }

      if (withdrawAmount > parseFloat(goal.currentAmount)) {
        throw new Error('Impossibile prelevare più del saldo disponibile nell\'obiettivo')
      }

      // 🔸 Calcola nuovo saldo
      const newCurrentAmount = parseFloat(goal.currentAmount) - withdrawAmount

      // 🔸 Determina nuovo stato
      let newStatus = 'ACTIVE'
      if (newCurrentAmount >= parseFloat(goal.targetAmount)) {
        newStatus = 'COMPLETED'
      }

      // 🔸 Aggiorna obiettivo
      const updatedGoal = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: newCurrentAmount,
          status: newStatus,
          updatedAt: new Date()
        }
      })

      // 🔸 Determina sottocategoria da utilizzare
      // Se l'utente ha specificato una subcategoryId, la usiamo
      // Altrimenti usiamo quella dell'obiettivo come fallback
      const effectiveSubcategoryId = subcategoryId || goal.subcategoryId
      
      // 🔸 Crea transazione principale nel sistema
      // Nota: Il prelievo dall'obiettivo è un'entrata nel saldo principale
      // Quindi la creiamo come 'income' (positiva) per integrarsi con la logica esistente
      const transaction = await tx.transaction.create({
        data: {
          userId,
          date: new Date(),
          amount: withdrawAmount, // POSITIVO come income
          main: 'INCOME', // Categoria INCOME in maiuscolo per consistenza
          subId: effectiveSubcategoryId, // Usa la sottocategoria scelta dall'utente
          note: `Prelevato da obiettivo: ${goal.title}${notes ? ` - ${notes}` : ''}`,
          payee: null
        }
      })

      // 🔸 Registra operazione obiettivo
      await tx.goalTransaction.create({
        data: {
          userId,
          goalId,
          amount: withdrawAmount,
          type: 'WITHDRAW',
          transactionId: transaction.id,
          notes: notes?.trim() || null
        }
      })

      // 🔸 Invalida cache saldo dopo operazione
      invalidateBalanceCache(userId)
      
      return {
        goal: updatedGoal,
        transaction,
        newProgressPercentage: calculateProgressPercentage(newCurrentAmount, goal.targetAmount)
      }
    } catch (error) {
      console.error('❌ Errore nel prelievo saldo obiettivo:', error)
      throw new Error(error.message || 'Impossibile prelevare saldo dall\'obiettivo')
    }
  })
}

/**
 * 🎯 SERVICE: Ripeti obiettivo completato (riporta a 0 e attiva)
 */
export async function repeatCompletedGoal(userId, goalId) {
  return await prisma.$transaction(async (tx) => {
    try {
      // 🔸 Verifica obiettivo
      const goal = await tx.savingsGoal.findFirst({
        where: { id: goalId, userId },
        include: { subcategory: { include: { Category: true } } }
      })

      if (!goal) {
        throw new Error('Obiettivo non trovato')
      }

      if (goal.status !== 'COMPLETED') {
        throw new Error('Solo gli obiettivi completati possono essere ripetuti')
      }

      const currentAmount = parseFloat(goal.currentAmount)

      // 🔸 Se ha saldo, restituiscilo al saldo principale
      if (currentAmount > 0) {
        const transaction = await tx.transaction.create({
          data: {
            userId,
            date: new Date(),
            amount: currentAmount, // POSITIVO come income
            main: 'INCOME',
            subId: goal.subcategoryId,
            note: `Prelevato da obiettivo ripetuto: ${goal.title}`,
            payee: null
          }
        })

        // 🔸 Registra operazione obiettivo
        await tx.goalTransaction.create({
          data: {
            userId,
            goalId,
            amount: currentAmount,
            type: 'WITHDRAW',
            transactionId: transaction.id,
            notes: 'Prelievo automatico per ripetizione obiettivo'
          }
        })
      }

      // 🔸 Ripristina obiettivo a zero e attivo
      const resetGoal = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: 0,
          status: 'ACTIVE',
          updatedAt: new Date()
        },
        include: {
          subcategory: {
            include: {
              Category: true
            }
          }
        }
      })

      // 🔸 Invalida cache saldo dopo operazione
      invalidateBalanceCache(userId)
      
      return {
        goal: resetGoal,
        refundedAmount: currentAmount
      }
    } catch (error) {
      console.error('❌ Errore nella ripetizione obiettivo:', error)
      throw new Error(error.message || 'Impossibile ripetere l\'obiettivo')
    }
  })
}

/**
 * 🎯 SERVICE: Elimina obiettivo
 */
export async function deleteSavingsGoal(userId, goalId) {
  return await prisma.$transaction(async (tx) => {
    try {
      // 🔸 Verifica obiettivo
      const goal = await tx.savingsGoal.findFirst({
        where: { id: goalId, userId }
      })

      if (!goal) {
        throw new Error('Obiettivo non trovato')
      }

      // 🔸 Se ha saldo residuo, restituiscilo al saldo principale
      if (parseFloat(goal.currentAmount) > 0) {
        await tx.transaction.create({
          data: {
            userId,
            date: new Date(),
            amount: parseFloat(goal.currentAmount), // POSITIVO come income
            main: 'income', // Categoria income per integrazione perfetta
            subId: goal.subcategoryId,
            note: `Restituzione da obiettivo eliminato: ${goal.title}`,
            payee: null
          }
        })
      }

      // 🔸 Elimina obiettivo (cascade eliminerà anche goal_transactions)
      await tx.savingsGoal.delete({
        where: { id: goalId }
      })

      // 🔸 Invalida cache saldo dopo eliminazione
      invalidateBalanceCache(userId)
      
      return { success: true, refundedAmount: goal.currentAmount }
    } catch (error) {
      console.error('❌ Errore nell\'eliminazione obiettivo:', error)
      throw new Error(error.message || 'Impossibile eliminare l\'obiettivo')
    }
  })
}

// =============================================================================
// 🔧 UTILITY FUNCTIONS
// =============================================================================

/**
 * 🔸 Validazione dati obiettivo
 */
function validateGoalData(goalData) {
  if (!goalData.title?.trim()) {
    throw new Error('Il titolo è obbligatorio')
  }
  
  if (!goalData.targetAmount || goalData.targetAmount <= 0) {
    throw new Error('L\'importo obiettivo deve essere maggiore di zero')
  }
  
  // La data scadenza è ora opzionale - solo valida se fornita
  if (goalData.targetDate && goalData.targetDate.trim()) {
    const targetDate = new Date(goalData.targetDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (targetDate <= today) {
      throw new Error('La data scadenza deve essere futura')
    }
  }
  
  if (!goalData.subcategoryId) {
    throw new Error('La sottocategoria è obbligatoria')
  }
}

/**
 * 🔸 Calcola percentuale progresso
 */
function calculateProgressPercentage(currentAmount, targetAmount) {
  if (!targetAmount || targetAmount <= 0) return 0
  const percentage = (parseFloat(currentAmount) / parseFloat(targetAmount)) * 100
  return Math.min(Math.max(percentage, 0), 100) // Clamp tra 0 e 100
}

/**
 * 🔸 Calcola giorni rimanenti
 */
function calculateDaysRemaining(targetDate) {
  if (!targetDate) return null
  const today = new Date()
  const target = new Date(targetDate)
  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(diffDays, 0)
}

/**
 * 🔸 Calcola target mensile consigliato
 */
function calculateMonthlyTarget(targetAmount, currentAmount, targetDate) {
  if (!targetDate) return null
  const remaining = parseFloat(targetAmount) - parseFloat(currentAmount)
  if (remaining <= 0) return 0
  
  const today = new Date()
  const target = new Date(targetDate)
  const monthsRemaining = Math.max((target.getFullYear() - today.getFullYear()) * 12 + 
                                   (target.getMonth() - today.getMonth()), 1)
  
  return remaining / monthsRemaining
}

/**
 * 🔸 Determina stato obiettivo basato su logiche business
 */
function determineGoalStatus(goal) {
  const progressPercentage = calculateProgressPercentage(goal.currentAmount, goal.targetAmount)
  
  // Completato
  if (progressPercentage >= 100) {
    return 'COMPLETED'
  }
  
  // Scaduto e non completato (solo se ha una data di scadenza)
  if (goal.targetDate) {
    const now = new Date()
    const targetDate = new Date(goal.targetDate)
    if (now > targetDate && goal.status === 'ACTIVE') {
      return 'EXPIRED'
    }
  }
  
  // Mantieni stato attuale se non ci sono cambiamenti automatici
  return goal.status || 'ACTIVE'
}

// Export del service
export const savingsGoalService = {
  getUserSavingsGoals,
  getSavingsGoalById,
  createSavingsGoal,
  updateSavingsGoal,
  addToGoal,
  withdrawFromGoal,
  deleteSavingsGoal,
  repeatCompletedGoal
}
