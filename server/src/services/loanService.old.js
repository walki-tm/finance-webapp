/**
 * 📄 SERVICE: LoanService
 * 
 * 🎯 Scopo: Gestisce le operazioni CRUD per prestiti con integrazione
 * database, calcoli ammortamento e creazione planned transactions.
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-30 - Implementazione iniziale sistema prestiti
 */

import { PrismaClient } from '@prisma/client'
import {
  calculateMonthlyPayment,
  calculateAmortizationSchedule,
  simulateEarlyPayoff,
  recalculateAfterPayment,
  validateLoanParameters,
  validateCompleteLoanParameters
} from './loanCalculationService.js'
import {
  createLoanPaymentPlan,
  updateLoanPaymentPlan,
  deleteLoanPaymentPlan,
  syncLoanWithPaymentPlan
} from './loanBudgetingService.js'

const prisma = new PrismaClient()

/**
 * 🎯 CRUD: Crea nuovo prestito con piano ammortamento
 * 
 * Steps:
 * 1. Validazione parametri
 * 2. Calcolo rata e piano ammortamento  
 * 3. Creazione record Loan
 * 4. Creazione tutte le LoanPayment
 * 5. Creazione PlannedTransaction ricorrente
 * 6. Integrazione budgeting se richiesto
 */
async function createLoan(userId, loanData) {
  // 🔸 Validazione input
  const validation = validateCompleteLoanParameters(loanData)
  if (!validation.isValid) {
    throw new Error(`Invalid loan parameters: ${validation.errors.join(', ')}`)
  }

  const {
    name,
    loanType,
    lenderName,
    principalAmount,
    interestRate, // Già in decimale (es: 0.035 per 3.5%)
    effectiveRate,
    rateType,
    durationMonths,
    firstPaymentDate,
    paymentFrequency,
    additionalCosts,
    description,
    notes,
    categoryMain,
    subcategoryId,
    autoCreatePayments
  } = loanData

  // 🔸 Calcolo piano ammortamento
  const schedule = calculateAmortizationSchedule({
    principal: principalAmount,
    annualRate: interestRate,
    durationMonths,
    firstPaymentDate
  })

  // 🔸 Calcolo date prestito
  const startDate = new Date(firstPaymentDate)
  startDate.setDate(1) // Primo del mese
  
  const lastPaymentDate = new Date(firstPaymentDate)
  lastPaymentDate.setMonth(lastPaymentDate.getMonth() + durationMonths - 1)

  try {
    // 🔸 Transazione database atomica
    const result = await prisma.$transaction(async (tx) => {
      
      // 1️⃣ Crea record Loan principale
      const loan = await tx.loan.create({
        data: {
          userId,
          name,
          loanType,
          lenderName,
          principalAmount,
          currentBalance: principalAmount,
          interestRate,
          effectiveRate,
          rateType,
          durationMonths,
          remainingMonths: durationMonths,
          startDate,
          firstPaymentDate: new Date(firstPaymentDate),
          lastPaymentDate,
          paymentFrequency,
          monthlyPayment: schedule.monthlyPayment,
          additionalCosts,
          description,
          notes,
          categoryMain,
          subcategoryId,
          status: 'ACTIVE',
          autoCreatePayments
        }
      })

      // 2️⃣ Crea tutte le rate del piano ammortamento
      const loanPayments = schedule.schedule.map(payment => ({
        loanId: loan.id,
        paymentNumber: payment.paymentNumber,
        dueDate: new Date(payment.dueDate),
        scheduledAmount: payment.scheduledAmount,
        principalAmount: payment.principalAmount,
        interestAmount: payment.interestAmount,
        remainingBalance: payment.remainingBalance,
        status: 'PLANNED'
      }))

      await tx.loanPayment.createMany({
        data: loanPayments
      })

      return loan // Restituisci il loan per il budgeting service
    })

    // 3️⃣ Integrazione con budgeting system (fuori dalla transazione DB)
    if (autoCreatePayments) {
      try {
        await createLoanPaymentPlan(userId, result)
        console.log('✅ Loan payment plan created successfully')
      } catch (budgetingError) {
        console.warn('⚠️ Loan created but payment plan failed:', budgetingError.message)
        // Il prestito è già creato, solo il piano pagamenti ha fallito
      }
    }

    // 4️⃣ Costruisci risposta finale
    const finalResult = await prisma.$transaction(async (tx) => {

      return {
        loan: result,
        amortization: {
          monthlyPayment: schedule.monthlyPayment,
          totalInterest: schedule.totalInterest,
          totalPayments: durationMonths,
          totalCost: principalAmount + schedule.totalInterest
        },
        schedule: schedule.schedule
      }
    })

    return finalResult

  } catch (error) {
    console.error('❌ Error creating loan:', error)
    throw new Error(`Failed to create loan: ${error.message}`)
  }
}

/**
 * 🎯 READ: Lista prestiti utente con summary
 */
async function getUserLoans(userId) {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId },
      include: {
        subcategory: {
          include: {
            Category: true
          }
        },
        plannedTransactions: true,
        payments: {
          where: {
            status: 'PLANNED'
          },
          orderBy: {
            dueDate: 'asc'
          },
          take: 1 // Solo la prossima rata PLANNED (ordinata per data)
        },
        _count: {
          select: {
            payments: {
              where: {
                status: 'PAID'
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 🔸 Arricchimento dati con calcoli
    return loans.map(loan => {
      console.log(`🔧 DEBUG: Processing loan "${loan.name}":`)
      console.log(`   - payments (PLANNED):`, loan.payments)
      console.log(`   - plannedTransactions:`, loan.plannedTransactions)
      
      // Usa la prossima rata dal database invece dei plannedTransactions
      const nextPayment = loan.payments[0] // È già ordinata per dueDate ASC e filtrata per PLANNED
      
      console.log(`   - next payment from DB:`, nextPayment)
      
      return {
        ...loan,
        progress: {
          paidPayments: loan._count.payments,
          totalPayments: loan.durationMonths,
          percentageComplete: (loan._count.payments / loan.durationMonths) * 100,
          remainingAmount: loan.currentBalance,
          paidAmount: loan.principalAmount - loan.currentBalance
        },
        nextPayment: nextPayment ? {
          dueDate: nextPayment.dueDate,
          amount: nextPayment.scheduledAmount,
          paymentNumber: nextPayment.paymentNumber
        } : {
          dueDate: loan.plannedTransactions[0]?.nextDueDate, // Fallback
          amount: loan.monthlyPayment,
          paymentNumber: null
        }
      }
    })

  } catch (error) {
    console.error('❌ Error fetching user loans:', error)
    throw new Error('Failed to fetch loans')
  }
}

/**
 * 🎯 READ: Dettagli prestito singolo con piano ammortamento
 */
async function getLoanDetails(userId, loanId) {
  try {
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId
      },
      include: {
        subcategory: {
          include: {
            Category: true
          }
        },
        plannedTransactions: true,
        payments: {
          orderBy: {
            paymentNumber: 'asc'
          }
        }
      }
    })

    if (!loan) {
      throw new Error('Loan not found')
    }

    // 🔸 Calcolo statistiche
    const paidPayments = loan.payments.filter(p => p.status === 'PAID')
    const totalPaid = paidPayments.reduce((sum, p) => sum + parseFloat(p.actualAmount || 0), 0)
    const totalInterestPaid = paidPayments.reduce((sum, p) => sum + parseFloat(p.interestAmount), 0)

    return {
      ...loan,
      statistics: {
        totalPaid: totalPaid,
        principalPaid: loan.principalAmount - loan.currentBalance,
        interestPaid: totalInterestPaid,
        remainingPrincipal: loan.currentBalance,
        progressPercentage: ((loan.durationMonths - loan.remainingMonths) / loan.durationMonths) * 100
      },
      schedule: loan.payments
    }

  } catch (error) {
    console.error('❌ Error fetching loan details:', error)
    throw new Error('Failed to fetch loan details')
  }
}

/**
 * 🎯 SIMULAZIONE: Estinzione anticipata per mesi specifici
 */
async function simulateLoanPayoff(userId, loanId, targetMonths = []) {
  try {
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, userId }
    })

    if (!loan) {
      throw new Error('Loan not found')
    }

    const loanData = {
      principal: loan.currentBalance,
      annualRate: loan.interestRate,
      durationMonths: loan.remainingMonths,
      firstPaymentDate: new Date()
    }

    // 🔸 Se nessun mese specificato, simula prossimi 12 mesi
    const monthsToSimulate = targetMonths.length > 0 
      ? targetMonths 
      : Array.from({ length: Math.min(12, loan.remainingMonths) }, (_, i) => i + 1)

    const simulations = monthsToSimulate.map(month => {
      try {
        return simulateEarlyPayoff(loanData, month)
      } catch (error) {
        return {
          targetMonth: month,
          error: error.message
        }
      }
    })

    return {
      loanId,
      currentStatus: {
        remainingBalance: loan.currentBalance,
        remainingMonths: loan.remainingMonths,
        monthlyPayment: loan.monthlyPayment
      },
      simulations
    }

  } catch (error) {
    console.error('❌ Error simulating loan payoff:', error)
    throw new Error('Failed to simulate loan payoff')
  }
}

/**
 * 🎯 PAGAMENTO: Registra pagamento rata
 */
async function recordLoanPayment(userId, loanId, paymentData) {
  const {
    paymentNumber,
    actualAmount,
    paidDate,
    lateFee,
    notes
  } = paymentData

  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // 1️⃣ Trova prestito e rata
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId }
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      const payment = await tx.loanPayment.findFirst({
        where: {
          loanId,
          paymentNumber
        }
      })

      if (!payment) {
        throw new Error('Payment not found')
      }

      if (payment.status === 'PAID') {
        throw new Error('Payment already recorded')
      }

      // 2️⃣ Aggiorna stato pagamento
      const updatedPayment = await tx.loanPayment.update({
        where: { id: payment.id },
        data: {
          status: actualAmount >= payment.scheduledAmount ? 'PAID' : 'PARTIAL',
          actualAmount,
          paidDate: new Date(paidDate),
          lateFee,
          notes
        }
      })

      // 3️⃣ Ricalcola debito prestito se necessario
      console.log('📊 DEBUG: Before recalculation:', {
        currentBalance: loan.currentBalance,
        remainingMonths: loan.remainingMonths,
        actualAmount,
        paymentNumber
      })
      
      const recalculation = recalculateAfterPayment(
        {
          currentBalance: loan.currentBalance,
          annualRate: loan.interestRate,
          remainingMonths: loan.remainingMonths,
          monthlyPayment: loan.monthlyPayment
        },
        {
          actualAmount,
          paymentNumber
        }
      )
      
      console.log('📊 DEBUG: After recalculation:', recalculation)

      // 4️⃣ Aggiorna prestito
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          currentBalance: recalculation.newBalance,
          remainingMonths: recalculation.remainingMonths,
          monthlyPayment: recalculation.monthlyPayment,
          status: recalculation.status || loan.status
        }
      })


      return {
        payment: updatedPayment,
        loan: updatedLoan,
        recalculation
      }
    })

    // 🔸 Sincronizza piano pagamenti dopo la transazione DB
    try {
      await syncLoanWithPaymentPlan(userId, loanId)
      console.log('✅ Loan payment plan synced after payment recording')
    } catch (budgetingError) {
      console.warn('⚠️ Payment recorded but plan sync failed:', budgetingError.message)
    }

    return result

  } catch (error) {
    console.error('❌ Error recording loan payment:', error)
    throw new Error(`Failed to record payment: ${error.message}`)
  }
}

/**
 * 🎯 UPDATE: Modifica parametri prestito
 */
async function updateLoan(userId, loanId, updateData) {
  try {
    // Solo alcuni campi sono modificabili dopo la creazione
    const allowedUpdates = [
      'name',
      'description', 
      'notes',
      'categoryMain',
      'subcategoryId',
      'autoCreatePayments'
    ]

    const filteredData = Object.keys(updateData)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = updateData[key]
        return obj
      }, {})

    const updatedLoan = await prisma.loan.update({
      where: {
        id: loanId,
        userId
      },
      data: filteredData
    })

    // 🔸 Aggiorna piano pagamenti se necessario
    if (Object.keys(filteredData).length > 0) {
      try {
        await updateLoanPaymentPlan(userId, updatedLoan, filteredData)
        console.log('✅ Loan payment plan updated successfully')
      } catch (budgetingError) {
        console.warn('⚠️ Loan updated but payment plan sync failed:', budgetingError.message)
      }
    }

    return updatedLoan

  } catch (error) {
    console.error('❌ Error updating loan:', error)
    throw new Error('Failed to update loan')
  }
}

/**
 * 🎯 SKIP: Salta prossima rata del prestito
 */
async function skipLoanPayment(userId, loanId) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // 1️⃣ Verifica prestito
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId }
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      // 2️⃣ Trova la prossima rata PLANNED
      const nextPayment = await tx.loanPayment.findFirst({
        where: {
          loanId,
          status: 'PLANNED'
        },
        orderBy: {
          paymentNumber: 'asc'
        }
      })

      if (!nextPayment) {
        throw new Error('No payments available to skip')
      }

      // 3❗️ NON marchiamo come SKIPPED, ma spostiamo TUTTE le rate successive
      const currentDueDate = new Date(nextPayment.dueDate)
      
      console.log('🗓️ Skipping payment: shifting ALL subsequent payments by one month')
      console.log('Starting from payment:', nextPayment.paymentNumber)
      console.log('Current due date:', currentDueDate.toISOString())
      
      // 🆕 TROVA TUTTE le rate dalla corrente in poi (PLANNED)
      const subsequentPayments = await tx.loanPayment.findMany({
        where: {
          loanId,
          status: 'PLANNED',
          paymentNumber: { gte: nextPayment.paymentNumber } // Da questa rata in poi
        },
        orderBy: {
          paymentNumber: 'asc'
        }
      })
      
      console.log(`📊 Found ${subsequentPayments.length} payments to shift`)
      
      // 🆕 SPOSTA TUTTE le rate di un mese
      const updatePromises = subsequentPayments.map((payment, index) => {
        const newDueDate = new Date(payment.dueDate)
        newDueDate.setMonth(newDueDate.getMonth() + 1)
        
        console.log(`   R${payment.paymentNumber}: ${payment.dueDate} → ${newDueDate.toISOString()}`)
        
        return tx.loanPayment.update({
          where: { id: payment.id },
          data: {
            dueDate: newDueDate,
            // Lo status rimane 'PLANNED'
            // Il paymentNumber rimane lo stesso
            notes: payment.paymentNumber === nextPayment.paymentNumber 
              ? (payment.notes ? 
                  `${payment.notes} - Rata spostata al mese successivo` : 
                  'Rata spostata al mese successivo')
              : payment.notes // Non modificare le note delle altre rate
          }
        })
      })
      
      // Esegui tutti gli aggiornamenti
      const updatedPayments = await Promise.all(updatePromises)
      const skippedPayment = updatedPayments[0] // La prima è quella che abbiamo skippato
      
      console.log('✅ All payments shifted successfully')
      
      // La stessa rata è ora la "newNextPayment"
      const newNextPayment = skippedPayment

      // 5❗️ Aggiorna prestito (NON cambiamo remaining months - solo posizioniamo la prossima rata)
      const loanUpdate = await tx.loan.update({
        where: { id: loanId },
        data: {
          // NON modifichiamo currentBalance o remainingMonths
          // Le rate saltate NON riducono il debito
        }
      })

      return {
        skippedPayment,
        loan: loanUpdate,
        nextPayment: newNextPayment
      }
    })

    // 🔸 Sincronizza con planned transactions
    try {
      await syncLoanWithPaymentPlan(userId, loanId)
      console.log('✅ Loan payment plan synced after skipping payment')
    } catch (budgetingError) {
      console.warn('⚠️ Payment skipped but plan sync failed:', budgetingError.message)
    }

    return result

  } catch (error) {
    console.error('❌ Error skipping loan payment:', error)
    throw new Error(`Failed to skip payment: ${error.message}`)
  }
}

/**
 * 🎯 DELETE: Elimina prestito e cleanup
 */
async function deleteLoan(userId, loanId) {
  try {
    // 🔸 Prima elimina piano pagamenti dal budgeting system
    try {
      await deleteLoanPaymentPlan(userId, loanId)
      console.log('✅ Loan payment plan deleted successfully')
    } catch (budgetingError) {
      console.warn('⚠️ Payment plan deletion failed:', budgetingError.message)
      // Continua comunque con l'eliminazione del prestito
    }

    // 🔸 Poi elimina i record dal database
    await prisma.$transaction(async (tx) => {
      
      // 1️⃣ Verifica ownership
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId }
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      // 2️⃣ Elimina planned transactions collegati (cleanup sicurezza)
      await tx.plannedTransaction.deleteMany({
        where: { loanId }
      })

      // 3️⃣ Elimina payments (cascade automatico)
      // 4️⃣ Elimina loan (payments si cancellano automaticamente per cascade)
      await tx.loan.delete({
        where: { id: loanId }
      })
    })

    return { success: true }

  } catch (error) {
    console.error('❌ Error deleting loan:', error)
    throw new Error('Failed to delete loan')
  }
}

// 🔸 Export delle funzioni
export {
  createLoan,
  getUserLoans,
  getLoanDetails,
  simulateLoanPayoff,
  recordLoanPayment,
  updateLoan,
  deleteLoan,
  skipLoanPayment
}
