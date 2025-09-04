/**
 * 📄 SERVICE: LoanService Ottimizzato
 * 
 * 🎯 Scopo: Gestisce prestiti con approccio dinamico senza pre-generazione delle rate
 * 
 * ✨ Vantaggi:
 * - Database più leggero (no pre-generazione rate)
 * - Logica più semplice e robusta  
 * - Calcoli dinamici al momento del bisogno
 * - Performance migliori
 * 
 * @author Finance WebApp Team
 * @modified 2025-08-31 - Refactoring completo con approccio ottimizzato
 */

import { PrismaClient } from '@prisma/client'
import {
  calculateMonthlyPayment,
  calculateAmortizationSchedule,
  simulateEarlyPayoff,
  validateLoanParameters,
  validateCompleteLoanParameters
} from './loanCalculationService.js'
import {
  createLoanPaymentPlan,
  updateLoanPaymentPlan,
  deleteLoanPaymentPlan,
  syncLoanWithPaymentPlan
} from './loanBudgetingService.js'
import { invalidateBalanceCache } from './balanceService.js'

const prisma = new PrismaClient()

// =============================================================================
// 🛠️ HELPER FUNCTIONS
// =============================================================================

/**
 * 🎯 Aggiunge mesi a una data (versione timezone-safe)
 * Evita completamente i problemi di timezone lavorando con UTC
 */
function addMonths(date, months) {
  const original = new Date(date)
  
  // Lavora interamente in UTC per evitare problemi di timezone
  const year = original.getUTCFullYear()
  const month = original.getUTCMonth()
  const day = original.getUTCDate()
  const hours = original.getUTCHours()
  const minutes = original.getUTCMinutes()
  const seconds = original.getUTCSeconds()
  const milliseconds = original.getUTCMilliseconds()
  
  // Calcola il nuovo mese e anno
  const newMonth = month + months
  const newYear = year + Math.floor(newMonth / 12)
  const finalMonth = ((newMonth % 12) + 12) % 12
  
  // Crea la nuova data mantenendo esattamente gli stessi componenti tempo
  const result = new Date(Date.UTC(newYear, finalMonth, day, hours, minutes, seconds, milliseconds))
  
  // Se il giorno è cambiato (es: 31 gen -> 28 feb), aggiusta
  if (result.getUTCDate() !== day) {
    // Vai all'ultimo giorno del mese target
    result.setUTCDate(0)
  }
  
  return result
}

/**
 * 🎯 Calcola quota capitale e interessi per una rata specifica
 */
function calculatePaymentBreakdown(currentBalance, monthlyPayment, monthlyRate) {
  const interestAmount = currentBalance * monthlyRate
  const principalAmount = monthlyPayment - interestAmount
  
  return {
    interestAmount: Math.max(0, interestAmount),
    principalAmount: Math.max(0, principalAmount),
    newBalance: Math.max(0, currentBalance - principalAmount)
  }
}

/**
 * 🎯 Genera piano ammortamento dinamico
 */
function generateDynamicAmortizationSchedule(loan, startFromPayment = 1) {
  const monthlyRate = loan.interestRate / 12
  const remainingPayments = loan.totalPayments - (startFromPayment - 1)
  
  let currentBalance = loan.currentBalance
  let currentDate = new Date(loan.nextPaymentDate)
  const schedule = []
  
  for (let i = 0; i < remainingPayments; i++) {
    const paymentNumber = startFromPayment + i
    const payment = calculatePaymentBreakdown(currentBalance, loan.monthlyPayment, monthlyRate)
    
    schedule.push({
      paymentNumber,
      dueDate: new Date(currentDate),
      scheduledAmount: loan.monthlyPayment,
      principalAmount: payment.principalAmount,
      interestAmount: payment.interestAmount,
      remainingBalance: payment.newBalance
    })
    
    currentBalance = payment.newBalance
    currentDate = addMonths(currentDate, 1)
    
    // Se il debito è saldato, fermiamo il calcolo
    if (currentBalance <= 0.01) break
  }
  
  return schedule
}

// =============================================================================
// 🎯 CRUD OPERATIONS
// =============================================================================

/**
 * 🎯 Crea nuovo prestito con gestione ottimizzata
 */
async function createLoan(userId, loanData) {
  const validation = validateCompleteLoanParameters(loanData)
  if (!validation.isValid) {
    throw new Error(`Invalid loan parameters: ${validation.errors.join(', ')}`)
  }

  const {
    name,
    loanType,
    lenderName,
    principalAmount,
    interestRate,
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

  // 🔸 Calcolo rata mensile
  const monthlyPayment = calculateMonthlyPayment(
    principalAmount,
    interestRate,
    durationMonths
  )

  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // 1️⃣ Crea record Loan ottimizzato
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
          totalPayments: durationMonths,
          paidPayments: 0,
          startDate: new Date(firstPaymentDate),
          nextPaymentDate: new Date(firstPaymentDate),
          paymentFrequency,
          monthlyPayment,
          additionalCosts,
          description,
          notes,
          categoryMain,
          subcategoryId,
          status: 'ACTIVE',
          autoCreatePayments
        }
      })

      return loan
    })

    // 2️⃣ Integrazione con budgeting system
    if (autoCreatePayments) {
      try {
        await createLoanPaymentPlan(userId, result)
        console.log('✅ Loan payment plan created successfully')
      } catch (budgetingError) {
        console.warn('⚠️ Loan created but payment plan failed:', budgetingError.message)
      }
    }

    // 3️⃣ Genera piano ammortamento dinamico per risposta
    const schedule = generateDynamicAmortizationSchedule(result)
    const totalInterest = schedule.reduce((sum, payment) => sum + payment.interestAmount, 0)

    return {
      loan: result,
      amortization: {
        monthlyPayment,
        totalInterest,
        totalPayments: durationMonths,
        totalCost: principalAmount + totalInterest
      },
      schedule
    }

  } catch (error) {
    console.error('❌ Error creating loan:', error)
    throw new Error(`Failed to create loan: ${error.message}`)
  }
}

/**
 * 🎯 Lista prestiti utente
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
        transactions: {
          orderBy: {
            paymentNumber: 'asc'
          }
        },
        _count: {
          select: {
            transactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // 🔸 Calcolo summary
    const summary = loans.reduce((acc, loan) => {
      if (loan.status === 'ACTIVE') {
        acc.activeLoans += 1
        acc.totalDebt += parseFloat(loan.currentBalance)
        acc.monthlyPayments += parseFloat(loan.monthlyPayment)
      }
      acc.totalLoans += 1
      return acc
    }, {
      totalLoans: 0,
      activeLoans: 0,
      totalDebt: 0,
      monthlyPayments: 0
    })

    // 🔸 Arricchimento dati con logica progresso coerente
    const enrichedLoans = loans.map(loan => {
      const totalAmount = parseFloat(loan.principalAmount)
      const remainingAmount = parseFloat(loan.currentBalance)
      const paidAmount = totalAmount - remainingAmount
      
      // Calcolo percentuale basato sul debito residuo (coerente con frontend)
      const percentageByAmount = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
      
      // Calcolo percentuale basato sulle rate pagate
      const percentageByPayments = loan.totalPayments > 0 ? (loan.paidPayments / loan.totalPayments) * 100 : 0
      
      // Usa la percentuale più alta (più accurata per il completamento)
      const finalPercentage = Math.max(percentageByAmount, percentageByPayments)
      
      // Considera completato se:
      // 1. Debito residuo <= 1 centesimo
      // 2. Tutte le rate sono state pagate
      // 3. Status è PAID_OFF
      // 4. Percentuale >= 100%
      const isCompleted = (
        remainingAmount <= 0.01 ||
        loan.paidPayments >= loan.totalPayments ||
        loan.status === 'PAID_OFF' ||
        finalPercentage >= 100
      )
      
      return {
        ...loan,
        progress: {
          paidPayments: loan.paidPayments,
          totalPayments: loan.totalPayments,
          percentageComplete: isCompleted ? 100 : Math.min(finalPercentage, 99.99),
          percentage: isCompleted ? 100 : Math.min(finalPercentage, 99.99), // Alias per compatibilità
          remainingAmount,
          paidAmount,
          isCompleted
        },
        nextPayment: {
          dueDate: loan.nextPaymentDate,
          amount: loan.monthlyPayment,
          paymentNumber: loan.paidPayments + 1
        }
      }
    })

    return { loans: enrichedLoans, summary }

  } catch (error) {
    console.error('❌ Error fetching user loans:', error)
    throw new Error('Failed to fetch loans')
  }
}

/**
 * 🎯 Dettagli prestito singolo
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
        transactions: {
          orderBy: {
            paymentNumber: 'asc'
          }
        },
        plannedTransactions: true
      }
    })

    if (!loan) {
      throw new Error('Loan not found')
    }

    // 🔸 Genera piano ammortamento dinamico
    const schedule = generateDynamicAmortizationSchedule(loan)
    
    // 🔸 Calcolo statistiche
    const totalPaid = loan.transactions.reduce((sum, t) => sum + parseFloat(t.totalAmount), 0)
    const totalInterestPaid = loan.transactions.reduce((sum, t) => sum + parseFloat(t.interestAmount), 0)
    
    const remainingPayments = loan.totalPayments - loan.paidPayments
    const progressPercentage = (loan.paidPayments / loan.totalPayments) * 100

    return {
      ...loan,
      statistics: {
        totalPaid,
        principalPaid: loan.principalAmount - loan.currentBalance,
        interestPaid: totalInterestPaid,
        remainingPrincipal: loan.currentBalance,
        remainingPayments,
        progressPercentage
      },
      schedule: [
        ...loan.transactions.map(t => ({
          paymentNumber: t.paymentNumber,
          dueDate: t.paidDate,
          scheduledAmount: t.totalAmount,
          principalAmount: t.principalAmount,
          interestAmount: t.interestAmount,
          remainingBalance: t.balanceAfterPayment,
          status: 'PAID',
          actualAmount: t.totalAmount,
          paidDate: t.paidDate,
          notes: t.notes
        })),
        ...schedule
      ]
    }

  } catch (error) {
    console.error('❌ Error fetching loan details:', error)
    throw new Error('Failed to fetch loan details')
  }
}

/**
 * 🎯 Paga rata (logica ottimizzata)
 */
async function payLoan(userId, loanId, paymentData = {}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // 1️⃣ Trova prestito
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId }
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      if (loan.paidPayments >= loan.totalPayments) {
        throw new Error('Loan is already paid off')
      }

      // 2️⃣ Trova il prossimo paymentNumber disponibile (strategia sicura)
      const lastTransaction = await tx.loanTransaction.findFirst({
        where: { loanId },
        select: { paymentNumber: true },
        orderBy: { paymentNumber: 'desc' }
      })
      
      const nextPaymentNumber = (lastTransaction?.paymentNumber || 0) + 1
      
      console.log(`💰 PayLoan: Using safe paymentNumber=${nextPaymentNumber} (last was ${lastTransaction?.paymentNumber || 0})`)
      
      // 3️⃣ Calcola breakdown pagamento
      const monthlyRate = loan.interestRate / 12
      const payment = calculatePaymentBreakdown(
        parseFloat(loan.currentBalance),
        parseFloat(loan.monthlyPayment),
        monthlyRate
      )

      const paidAmount = paymentData.actualAmount || loan.monthlyPayment
      
      // 4️⃣ Registra transazione
      await tx.loanTransaction.create({
        data: {
          loanId,
          paymentNumber: nextPaymentNumber,
          paidDate: paymentData.paidDate || new Date(),
          totalAmount: paidAmount,
          principalAmount: payment.principalAmount,
          interestAmount: payment.interestAmount,
          lateFee: paymentData.lateFee || 0,
          balanceAfterPayment: payment.newBalance,
          notes: paymentData.notes,
          paymentMethod: paymentData.paymentMethod
        }
      })

      // 5️⃣ Aggiorna prestito
      const currentNextPaymentDate = new Date(loan.nextPaymentDate)
      const newNextPaymentDate = payment.newBalance > 0.01 
        ? addMonths(loan.nextPaymentDate, 1)
        : loan.nextPaymentDate
      
      // 🔍 DEBUG: Log delle date
      console.log('💰 DEBUG: PayLoan date calculation:', {
        loanName: loan.name,
        currentNextPaymentDate: currentNextPaymentDate.toISOString(),
        newNextPaymentDate: newNextPaymentDate.toISOString(),
        addingOneMonth: payment.newBalance > 0.01
      })
      
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          paidPayments: nextPaymentNumber,
          currentBalance: payment.newBalance,
          nextPaymentDate: newNextPaymentDate,
          status: payment.newBalance <= 0.01 ? 'PAID_OFF' : loan.status
        }
      })

      // 6️⃣ Aggiorna anche la planned transaction collegata
      if (payment.newBalance > 0.01) {
        await tx.plannedTransaction.updateMany({
          where: { loanId, userId },
          data: {
            nextDueDate: newNextPaymentDate
          }
        })
        console.log(`✅ PlannedTransaction nextDueDate updated to: ${newNextPaymentDate.toISOString()}`)
      } else {
        // Se il prestito è pagato completamente, disattiva la planned transaction
        await tx.plannedTransaction.updateMany({
          where: { loanId, userId },
          data: {
            isActive: false
          }
        })
        console.log(`✅ PlannedTransaction deactivated - loan paid off`)
      }

      return { loan: updatedLoan, payment }
    })

    // 7️⃣ Sincronizza piano pagamenti
    try {
      await syncLoanWithPaymentPlan(userId, loanId)
      console.log('✅ Loan payment plan synced')
    } catch (budgetingError) {
      console.warn('⚠️ Payment recorded but plan sync failed:', budgetingError.message)
    }

    return result

  } catch (error) {
    console.error('❌ Error paying loan:', error)
    throw new Error(`Failed to pay loan: ${error.message}`)
  }
}

/**
 * 🎯 Salta rata (logica ottimizzata)
 */
async function skipLoanPayment(userId, loanId) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // 1️⃣ Trova prestito
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId }
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      if (loan.paidPayments >= loan.totalPayments) {
        throw new Error('No payments left to skip')
      }

      // 2️⃣ Sposta semplicemente la prossima data di pagamento
      const newNextPaymentDate = addMonths(loan.nextPaymentDate, 1)
      
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          nextPaymentDate: newNextPaymentDate
          // 📝 Il numero di rate pagate resta uguale
          // 📝 Il debito residuo resta uguale
          // 📝 Si sposta solo la data!
        }
      })

      // 3️⃣ Aggiorna anche la planned transaction collegata
      await tx.plannedTransaction.updateMany({
        where: { loanId, userId },
        data: {
          nextDueDate: newNextPaymentDate
        }
      })

      console.log(`✅ Loan payment skipped: ${loan.nextPaymentDate} → ${updatedLoan.nextPaymentDate}`)
      console.log(`✅ PlannedTransaction nextDueDate updated to: ${newNextPaymentDate.toISOString()}`)

      return { loan: updatedLoan }
    })

    // 3️⃣ Sincronizza piano pagamenti
    try {
      await syncLoanWithPaymentPlan(userId, loanId)
      console.log('✅ Loan payment plan synced after skip')
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
 * 🎯 Estingue prestito (totalmente o parzialmente)
 */
async function payoffLoan(userId, loanId, payoffData = {}) {
  try {
    const result = await prisma.$transaction(async (tx) => {
      
      // 1️⃣ Trova prestito
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId },
        include: { subcategory: true }
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      if (loan.status === 'PAID_OFF' || loan.currentBalance <= 0.01) {
        throw new Error('Loan is already paid off')
      }

      const currentBalance = parseFloat(loan.currentBalance)
      const payoffAmount = parseFloat(payoffData.payoffAmount) || currentBalance
      const penaltyAmount = parseFloat(payoffData.penaltyAmount) || 0
      const totalAmount = parseFloat(payoffData.totalAmount) || (payoffAmount + penaltyAmount)
      const payoffDate = payoffData.payoffDate ? new Date(payoffData.payoffDate) : new Date()
      const isTotal = payoffData.payoffType === 'TOTAL' || payoffAmount >= currentBalance
      
      // 2️⃣ Validazioni
      if (payoffData.payoffType === 'PARTIAL' && payoffAmount >= currentBalance) {
        throw new Error('For partial payoff, amount must be less than current balance')
      }
      
      if (payoffAmount <= 0) {
        throw new Error('Payoff amount must be positive')
      }
      
      // 3️⃣ Registra transazione di estinzione
      // Trova semplicemente il prossimo paymentNumber disponibile (sequenziale)
      const lastTransaction = await tx.loanTransaction.findFirst({
        where: { loanId },
        select: { paymentNumber: true },
        orderBy: { paymentNumber: 'desc' }
      })
      
      const paymentNumber = (lastTransaction?.paymentNumber || 0) + 1
      
      console.log(`💰 ${isTotal ? 'Estinzione totale' : 'Estinzione parziale'}: usando paymentNumber=${paymentNumber}`)
      
      const loanTransaction = await tx.loanTransaction.create({
        data: {
          loanId,
          paymentNumber: paymentNumber,
          paidDate: payoffDate,
          totalAmount: totalAmount,
          principalAmount: payoffAmount,
          interestAmount: penaltyAmount, // Le penali sono considerate interessi
          lateFee: 0,
          balanceAfterPayment: isTotal ? 0 : (currentBalance - payoffAmount),
          notes: payoffData.notes || `Estinzione ${isTotal ? 'totale' : 'parziale'}`,
          paymentMethod: payoffData.paymentMethod || 'BANK_TRANSFER'
        }
      })
      
      // 4️⃣ Calcola nuovo balance e status
      const newBalance = isTotal ? 0 : Math.max(0, currentBalance - payoffAmount)
      const newStatus = isTotal ? 'PAID_OFF' : 'ACTIVE'
      // 🔧 FIX: Per estinzioni totali, non incrementiamo più paidPayments
      // Questo evita race conditions e è concettualmente più corretto
      // Il progresso viene calcolato correttamente tramite currentBalance = 0 e status = PAID_OFF
      const newPaidPayments = loan.paidPayments // NON incrementa mai per estinzioni
      
      // 5️⃣ Aggiorna prestito
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: {
          paidPayments: newPaidPayments,
          currentBalance: newBalance,
          status: newStatus
          // nextPaymentDate resta invariato per riferimento storico
        }
      })
      
      // 6️⃣ Crea transazione finanziaria ereditando categoria/sottocategoria dal prestito
      let transaction = null
      if (loan.subcategoryId && loan.subcategory) {
        // Il prestito ha una sottocategoria specifica - usala
        transaction = await tx.transaction.create({
          data: {
            userId,
            subId: loan.subcategory.id,
            amount: totalAmount,
            date: payoffDate,
            note: payoffData.notes || `Estinzione ${isTotal ? 'totale' : 'parziale'} - ${loan.name}`,
            main: loan.categoryMain || loan.subcategory.Category?.main || 'EXPENSE'
          }
        })
      } else if (loan.categoryMain) {
        // Il prestito ha solo categoria principale - crea transazione senza sottocategoria
        transaction = await tx.transaction.create({
          data: {
            userId,
            subId: null, // Nessuna sottocategoria
            amount: totalAmount,
            date: payoffDate,
            note: payoffData.notes || `Estinzione ${isTotal ? 'totale' : 'parziale'} - ${loan.name}`,
            main: loan.categoryMain
          }
        })
      }
      
      // Invalida cache saldo se è stata creata una transazione
      if (transaction) {
        invalidateBalanceCache(userId)
      }
      
      console.log(`✅ ${transaction ? 'Transazione finanziaria creata' : 'Nessuna categoria impostata - transazione non creata'} per estinzione`)
      
      // 7️⃣ Gestisci planned transactions
      if (isTotal) {
        // Estinzione totale: disattiva tutte le planned transactions
        await tx.plannedTransaction.updateMany({
          where: { loanId, userId },
          data: { isActive: false }
        })
        console.log(`✅ PlannedTransactions deactivated for completed loan`)
      } else {
        // Estinzione parziale: applica il tipo di ricalcolo scelto
        const originalRemainingMonths = loan.totalPayments - loan.paidPayments
        const recalculationType = payoffData.recalculationType || 'RECALCULATE_PAYMENT'
        
        if (originalRemainingMonths > 0 && newBalance > 0) {
          // Definizioni per le formule matematiche
          const PV = newBalance // Capitale residuo dopo estinzione parziale
          const TAN = parseFloat(loan.interestRate) // Tasso Annuo Nominale
          const p = 12 // Periodi per anno (mensile)
          const i = TAN / p // Tasso periodale
          const originalA = parseFloat(loan.monthlyPayment) // Rata originale
          
          let newMonthlyPayment = originalA
          let newTotalPayments = loan.totalPayments
          
          if (recalculationType === 'RECALCULATE_PAYMENT') {
            // 🧮 RICALCOLA RATA: Mensilità invariate ⇒ ricalcola la rata
            // Formula: A = PV⋅i / (1-(1+i)^(-n))
            const n = originalRemainingMonths // Rate rimanenti invariate
            
            if (i === 0) {
              // Caso tasso zero: A = PV/n
              newMonthlyPayment = PV / n
            } else {
              // Formula ammortamento francese
              newMonthlyPayment = (PV * i) / (1 - Math.pow(1 + i, -n))
            }
            
            newTotalPayments = loan.totalPayments // Mensilità restano invariate
            
            console.log(`✅ Partial payoff (RECALCULATE_PAYMENT): Monthly payment reduced from ${originalA.toFixed(2)}€ to ${newMonthlyPayment.toFixed(2)}€`)
            
          } else if (recalculationType === 'RECALCULATE_DURATION') {
            // 🧮 RICALCOLA MENSILITÀ: Rata invariata ⇒ ricalcola le mensilità
            const A = originalA // Rata resta invariata
            
            // Condizione: A > i⋅PV (altrimenti non ammortizza)
            if (A <= i * PV && i > 0) {
              throw new Error('La rata attuale è troppo bassa per ammortizzare il debito residuo')
            }
            
            let n_exact
            if (i === 0) {
              // Caso tasso zero: n = PV/A
              n_exact = PV / A
            } else {
              // Formula: n = -ln(1 - i⋅PV/A) / ln(1+i)
              const numerator = -Math.log(1 - (i * PV) / A)
              const denominator = Math.log(1 + i)
              n_exact = numerator / denominator
            }
            
            const n_ceil = Math.ceil(n_exact) // Numero di rate intere
            newTotalPayments = loan.paidPayments + n_ceil // Nuovo totale rate (usa paidPayments originali)
            newMonthlyPayment = originalA // Rata resta invariata
            
            // Log per debug dell'ultima rata di aggiustamento
            if (n_ceil > n_exact) {
              let R // Residuo dopo n_ceil-1 rate standard
              if (i === 0) {
                R = PV - A * (n_ceil - 1)
              } else {
                R = PV * Math.pow(1 + i, n_ceil - 1) - A * (Math.pow(1 + i, n_ceil - 1) - 1) / i
              }
              const A_final = i === 0 ? R : R * (1 + i)
              console.log(`✅ Ultima rata di aggiustamento: ${A_final.toFixed(2)}€ (invece di ${A.toFixed(2)}€)`)
            }
            
            console.log(`✅ Partial payoff (RECALCULATE_DURATION): Duration reduced from ${originalRemainingMonths} to ${n_ceil} remaining payments`)
          }
          
          // Aggiorna il prestito con i nuovi valori calcolati
          await tx.loan.update({
            where: { id: loanId },
            data: {
              monthlyPayment: newMonthlyPayment,
              totalPayments: newTotalPayments
            }
          })
          
          // Aggiorna planned transaction con la nuova rata
          await tx.plannedTransaction.updateMany({
            where: { loanId, userId, isActive: true },
            data: {
              amount: newMonthlyPayment
            }
          })
          
          console.log(`✅ Partial payoff completed: PV=${PV.toFixed(2)}€, MonthlyPayment=${newMonthlyPayment.toFixed(2)}€, TotalPayments=${newTotalPayments}, TAN=${(TAN*100).toFixed(3)}%`)
        }
      }
      
      console.log(`✅ Loan ${isTotal ? 'paid off' : 'partially paid'}: ${loan.name} - Amount: ${totalAmount}€ (Principal: ${payoffAmount}€, Penalty: ${penaltyAmount}€)`)

      return { 
        loan: updatedLoan, 
        loanTransaction,
        payoffTransaction: transaction, // La transazione finanziaria
        summary: {
          type: isTotal ? 'TOTAL' : 'PARTIAL',
          payoffAmount,
          penaltyAmount,
          totalAmount,
          newBalance,
          remainingPayments: isTotal ? 0 : (updatedLoan.totalPayments - newPaidPayments),
          recalculationType: payoffData.recalculationType || 'RECALCULATE_PAYMENT'
        }
      }
    })

    // 8️⃣ Sincronizza piano pagamenti
    try {
      await syncLoanWithPaymentPlan(userId, loanId)
      console.log('✅ Loan payment plan synced after payoff')
    } catch (budgetingError) {
      console.warn('⚠️ Loan payoff completed but plan sync failed:', budgetingError.message)
    }

    return result

  } catch (error) {
    console.error('❌ Error paying off loan:', error)
    throw new Error(`Failed to pay off loan: ${error.message}`)
  }
}

/**
 * 🎯 Simula estinzione anticipata
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
      principal: parseFloat(loan.currentBalance),
      annualRate: parseFloat(loan.interestRate),
      durationMonths: loan.totalPayments - loan.paidPayments,
      firstPaymentDate: loan.nextPaymentDate
    }

    const monthsToSimulate = targetMonths.length > 0 
      ? targetMonths 
      : Array.from({ length: Math.min(12, loanData.durationMonths) }, (_, i) => i + 1)

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
        remainingPayments: loan.totalPayments - loan.paidPayments,
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
 * 🎯 Aggiorna prestito
 */
async function updateLoan(userId, loanId, updateData) {
  try {
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
 * 🎯 Verifica e pulisce planned transactions per prestiti completati
 */
async function cleanupCompletedLoanPlannedTransactions(userId, loanId = null) {
  try {
    const whereClause = loanId 
      ? { id: loanId, userId }
      : { userId }

    // Prima recuperiamo tutti i prestiti dell'utente
    const allLoans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        plannedTransactions: {
          where: {
            isActive: true // Solo quelle ancora attive
          }
        }
      }
    })

    // Filtriamo manualmente i prestiti completati usando logica coerente
    const completedLoans = allLoans.filter(loan => {
      const totalAmount = parseFloat(loan.principalAmount)
      const remainingAmount = parseFloat(loan.currentBalance)
      const paidAmount = totalAmount - remainingAmount
      
      // Calcolo percentuale basato sul debito residuo
      const percentageByAmount = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0
      
      // Calcolo percentuale basato sulle rate pagate
      const percentageByPayments = loan.totalPayments > 0 ? (loan.paidPayments / loan.totalPayments) * 100 : 0
      
      // Considera completato se una qualsiasi delle condizioni è vera
      return (
        remainingAmount <= 0.01 || // Debito residuo <= 1 centesimo
        loan.status === 'PAID_OFF' ||
        loan.paidPayments >= loan.totalPayments || // Tutte le rate pagate
        percentageByAmount >= 100 || // Progresso per importo al 100%
        percentageByPayments >= 100 // Progresso per rate al 100%
      )
    })

    let cleanedCount = 0

    for (const loan of completedLoans) {
      if (loan.plannedTransactions.length > 0) {
        // Disattiva le planned transactions del prestito completato
        await prisma.plannedTransaction.updateMany({
          where: {
            loanId: loan.id,
            userId,
            isActive: true
          },
          data: {
            isActive: false
          }
        })

        cleanedCount += loan.plannedTransactions.length
        console.log(`✅ Cleaned ${loan.plannedTransactions.length} planned transactions for completed loan: ${loan.name}`)
      }
    }

    if (cleanedCount > 0) {
      console.log(`✅ Total planned transactions cleaned: ${cleanedCount}`)
    }

    return { cleanedCount, completedLoans: completedLoans.length }

  } catch (error) {
    console.error('❌ Error cleaning completed loan planned transactions:', error)
    throw new Error(`Failed to cleanup planned transactions: ${error.message}`)
  }
}

/**
 * 🎯 Elimina prestito
 */
async function deleteLoan(userId, loanId) {
  try {
    // 🔸 Elimina piano pagamenti
    try {
      await deleteLoanPaymentPlan(userId, loanId)
      console.log('✅ Loan payment plan deleted successfully')
    } catch (budgetingError) {
      console.warn('⚠️ Payment plan deletion failed:', budgetingError.message)
    }

    // 🔸 Elimina prestito (le transazioni si cancellano per cascade)
    await prisma.$transaction(async (tx) => {
      
      const loan = await tx.loan.findFirst({
        where: { id: loanId, userId }
      })

      if (!loan) {
        throw new Error('Loan not found')
      }

      // Cleanup planned transactions
      await tx.plannedTransaction.deleteMany({
        where: { loanId }
      })

      // Delete loan (transactions will cascade)
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
  payLoan,
  payoffLoan,
  updateLoan,
  deleteLoan,
  skipLoanPayment,
  generateDynamicAmortizationSchedule,
  cleanupCompletedLoanPlannedTransactions
}
