/**
 * 📄 PLANNED TRANSACTION SERVICE: Business logic transazioni pianificate
 * 
 * 🎯 Scopo: Gestisce la logica di business per transazioni pianificate e gruppi
 * 
 * 🔧 Dipendenze principali:
 * - Prisma per accesso database
 * - Date utilities per calcoli schedulazione
 * 
 * 📝 Note:
 * - Calcola automaticamente nextDueDate basandosi su frequency
 * - Gestisce materializzazione automatica delle transazioni
 * - Supporta raggruppamento e organizzazione
 * 
 * @author Finance WebApp Team
 * @modified 23 Agosto 2025 - Creazione iniziale
 */

import { prisma } from '../lib/prisma.js'
import { invalidateBalanceCache } from './balanceService.js'
import { updateAccountBalance } from './accountBalanceService.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

// 🔸 Utility per calcolo prossima data di scadenza
function calculateNextDueDate(startDate, frequency, currentDate = new Date(), repeatData = null) {
  const start = new Date(startDate)
  const now = new Date(currentDate)
  
  // 🔸 DEBUG per troubleshooting
  console.log('📅 calculateNextDueDate DEBUG:')
  console.log('  - startDate:', start.toISOString())
  console.log('  - currentDate:', now.toISOString())
  console.log('  - frequency:', frequency)
  console.log('  - repeatData:', repeatData)
  
  if (frequency === 'ONE_TIME') {
    console.log('  - ONE_TIME: returning startDate as-is')
    return start
  }
  
  let nextDue = new Date(start)
  
  // 🔸 Per date odierne o passate, la prima scadenza è la data di inizio stessa
  // Solo se è nel futuro, saltiamo alla prossima occorrenza
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfStartDate = new Date(start.getFullYear(), start.getMonth(), start.getDate())
  
  console.log('  - startOfToday:', startOfToday.toISOString())
  console.log('  - startOfStartDate:', startOfStartDate.toISOString())
  console.log('  - startOfStartDate <= startOfToday:', startOfStartDate <= startOfToday)
  
  if (startOfStartDate <= startOfToday) {
    // La data di inizio è oggi o nel passato, quindi questa è la prima scadenza
    console.log('  - Start date is today or in past, using as first due date')
    return nextDue
  }
  
  // Data nel futuro: calcola normalmente
  if (frequency === 'WEEKLY') {
    // Trova la prossima settimana (stesso giorno della settimana)
    while (nextDue <= now) {
      nextDue.setDate(nextDue.getDate() + 7)
    }
    console.log('  - WEEKLY future date, calculated nextDue:', nextDue.toISOString())
  } else if (frequency === 'MONTHLY' || frequency === 'REPEAT') {
    // Trova il prossimo mese con lo stesso giorno (REPEAT funziona come MONTHLY per il calcolo)
    while (nextDue <= now) {
      nextDue.setMonth(nextDue.getMonth() + 1)
    }
    console.log('  - MONTHLY/REPEAT future date, calculated nextDue:', nextDue.toISOString())
  } else if (frequency === 'QUARTERLY') {
    // Trova il prossimo trimestre (ogni 3 mesi)
    while (nextDue <= now) {
      nextDue.setMonth(nextDue.getMonth() + 3)
    }
    console.log('  - QUARTERLY future date, calculated nextDue:', nextDue.toISOString())
  } else if (frequency === 'SEMIANNUAL') {
    // Trova il prossimo semestre (ogni 6 mesi)
    while (nextDue <= now) {
      nextDue.setMonth(nextDue.getMonth() + 6)
    }
    console.log('  - SEMIANNUAL future date, calculated nextDue:', nextDue.toISOString())
  } else if (frequency === 'YEARLY') {
    // Trova il prossimo anno con la stessa data
    while (nextDue <= now) {
      nextDue.setFullYear(nextDue.getFullYear() + 1)
    }
    console.log('  - YEARLY future date, calculated nextDue:', nextDue.toISOString())
  }
  
  return nextDue
}

// 🔸 Utility SPECIFICA per calcolo prossima occorrenza dopo materializzazione
function calculateNextOccurrenceAfterMaterialization(startDate, frequency, lastDueDate) {
  console.log('🔄 calculateNextOccurrenceAfterMaterialization DEBUG:')
  console.log('  - startDate:', startDate)
  console.log('  - frequency:', frequency)
  console.log('  - lastDueDate:', lastDueDate)
  
  if (frequency === 'ONE_TIME') {
    console.log('  - ONE_TIME: should not be called for one-time transactions')
    return null
  }
  
  const lastDue = new Date(lastDueDate)
  let nextDue = new Date(lastDue)
  
  if (frequency === 'WEEKLY') {
    // Aggiungi 7 giorni alla data di ultima scadenza
    nextDue.setDate(nextDue.getDate() + 7)
    console.log('  - WEEKLY: Added 7 days to lastDueDate, result:', nextDue.toISOString())
  } else if (frequency === 'MONTHLY') {
    // Gestisci correttamente i mesi con numero diverso di giorni
    const originalDay = lastDue.getDate()
    const currentMonth = lastDue.getMonth()
    const currentYear = lastDue.getFullYear()
    
    console.log('  - Original day of month:', originalDay)
    console.log('  - Current month:', currentMonth)
    
    // Vai al primo giorno del mese successivo
    nextDue.setMonth(currentMonth + 1, 1)
    
    // Trova l'ultimo giorno del mese successivo
    const lastDayOfNextMonth = new Date(nextDue.getFullYear(), nextDue.getMonth() + 1, 0).getDate()
    console.log('  - Last day of next month:', lastDayOfNextMonth)
    
    // Imposta il giorno: usa il giorno originale o l'ultimo giorno del mese se quello originale non esiste
    const targetDay = Math.min(originalDay, lastDayOfNextMonth)
    nextDue.setDate(targetDay)
    
    console.log('  - MONTHLY: Original day', originalDay, '-> Target day', targetDay, 'Result:', nextDue.toISOString())
    
  } else if (frequency === 'QUARTERLY') {
    // Aggiungi 3 mesi alla data di ultima scadenza
    nextDue.setMonth(nextDue.getMonth() + 3)
    console.log('  - QUARTERLY: Added 3 months to lastDueDate, result:', nextDue.toISOString())
  } else if (frequency === 'SEMIANNUAL') {
    // Aggiungi 6 mesi alla data di ultima scadenza
    nextDue.setMonth(nextDue.getMonth() + 6)
    console.log('  - SEMIANNUAL: Added 6 months to lastDueDate, result:', nextDue.toISOString())
  } else if (frequency === 'YEARLY') {
    // Aggiungi un anno alla data di ultima scadenza
    nextDue.setFullYear(nextDue.getFullYear() + 1)
    console.log('  - YEARLY: Added 1 year to lastDueDate, result:', nextDue.toISOString())
  }
  
  return nextDue
}

// 🔸 Utility per calcolo prossime N occorrenze
function calculateNextOccurrences(startDate, frequency, count = 5, fromDate = new Date()) {
  const occurrences = []
  const start = new Date(startDate)
  
  if (frequency === 'ONE_TIME') {
    return [start]
  }
  
  let current = calculateNextDueDate(startDate, frequency, fromDate)
  
  for (let i = 0; i < count; i++) {
    occurrences.push(new Date(current))
    
    if (frequency === 'WEEKLY') {
      // Aggiungi 7 giorni
      current.setDate(current.getDate() + 7)
    } else if (frequency === 'MONTHLY') {
      // Usa la stessa logica corretta per gestire i mesi con diverso numero di giorni
      const originalDay = current.getDate()
      const currentMonth = current.getMonth()
      
      // Vai al primo giorno del mese successivo
      current.setMonth(currentMonth + 1, 1)
      
      // Trova l'ultimo giorno del mese successivo
      const lastDayOfNextMonth = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate()
      
      // Imposta il giorno: usa il giorno originale o l'ultimo giorno del mese se quello originale non esiste
      const targetDay = Math.min(originalDay, lastDayOfNextMonth)
      current.setDate(targetDay)
      
    } else if (frequency === 'QUARTERLY') {
      // Aggiungi 3 mesi
      current.setMonth(current.getMonth() + 3)
    } else if (frequency === 'SEMIANNUAL') {
      // Aggiungi 6 mesi
      current.setMonth(current.getMonth() + 6)
    } else if (frequency === 'YEARLY') {
      current.setFullYear(current.getFullYear() + 1)
    }
  }
  
  return occurrences
}

// 🔸 Risoluzione subId come nel service esistente
async function resolveSubId(userId, subId, subName) {
  if (!subId && subName) {
    const found = await prisma.subcategory.findFirst({
      where: { userId, name: { equals: subName, mode: 'insensitive' } },
      select: { id: true }
    })
    if (found) subId = found.id
  }
  if (subId) {
    const ok = await prisma.subcategory.findFirst({ where: { id: subId, userId } })
    if (!ok) throw httpError(400, 'Invalid subId')
  }
  return subId || null
}

/**
 * 🎯 SERVICE: Lista transazioni pianificate
 */
export async function listPlannedTransactions(userId, { groupId } = {}) {
  const where = { userId }
  if (groupId) {
    where.groupId = groupId
  }
  
  // 🔧 FIX: Simplified orderBy to prevent infinite loop with NULL groups
  return prisma.plannedTransaction.findMany({
    where,
    orderBy: [
      { createdAt: 'asc' }  // 🔧 FIXED: Removed group.sortOrder that caused loops with NULL groupId
    ],
    include: { 
      subcategory: true,
      group: true,
      account: true
    }
  })
}

/**
 * 🎯 SERVICE: Crea transazione pianificata
 */
export async function createPlannedTransaction(userId, data) {
  const { title, main, subId, subName, accountId, amount, note, payee, frequency, startDate, confirmationMode, groupId, appliedToBudget, loanId, repeatCount } = data
  
  // 🔸 DEBUG: Log nel service
  console.log('🐛 DEBUG plannedTransactionService - createPlannedTransaction:')
  console.log('- data.startDate (from controller):', startDate)
  console.log('- startDate instanceof Date:', startDate instanceof Date)
  console.log('- startDate.getTimezoneOffset():', startDate instanceof Date ? startDate.getTimezoneOffset() : 'N/A')
  console.log('- loanId:', loanId)
  console.log('- frequency:', frequency)
  console.log('- repeatCount:', repeatCount)
  
  const finalSubId = await resolveSubId(userId, subId, subName)
  
  // Calcola nextDueDate basandosi su frequency e startDate
  console.log('- Before calculateNextDueDate:', startDate)
  const nextDueDate = calculateNextDueDate(startDate, frequency)
  console.log('- After calculateNextDueDate:', nextDueDate)
  
  // Verifica che il gruppo appartenga all'utente se specificato
  if (groupId) {
    const groupExists = await prisma.transactionGroup.findFirst({ where: { id: groupId, userId } })
    if (!groupExists) throw httpError(400, 'Invalid groupId')
  }
  
  // Verifica che il prestito appartenga all'utente se specificato
  if (loanId) {
    const loanExists = await prisma.loan.findFirst({ where: { id: loanId, userId } })
    if (!loanExists) throw httpError(400, 'Invalid loanId')
  }
  
  // Verifica che l'account appartenga all'utente se specificato
  if (accountId) {
    const accountExists = await prisma.account.findFirst({ where: { id: accountId, userId } })
    if (!accountExists) throw httpError(400, 'Invalid accountId')
  }
  
  // 🔸 Le transazioni provenienti da loan devono essere sempre AUTOMATIC
  let finalConfirmationMode = confirmationMode
  if (loanId) {
    console.log('- Forcing AUTOMATIC confirmation mode for loan transaction')
    finalConfirmationMode = 'AUTOMATIC'
  }
  
  const prismaData = {
    userId,
    title: title || null,  // ✅ Aggiungi title mancante
    main,
    subId: finalSubId,
    accountId: accountId || null,  // 🏦 Aggiungi accountId mancante
    amount,
    note: note || null,
    payee: payee || null,
    frequency,
    startDate: new Date(startDate),
    confirmationMode: finalConfirmationMode,
    groupId: groupId || null,
    appliedToBudget: appliedToBudget || false,
    loanId: loanId || null, // ✅ Aggiungi loanId mancante
    nextDueDate,
  }
  
  // 🔄 Aggiungi campi REPEAT se specificati
  if (frequency === 'REPEAT' && repeatCount) {
    prismaData.repeatCount = repeatCount
    prismaData.remainingRepeats = repeatCount // All'inizio, ripetizioni rimanenti = ripetizioni totali
    console.log('- Added REPEAT fields: repeatCount:', repeatCount, 'remainingRepeats:', repeatCount)
  }
  
  // 🔸 DEBUG: Log dei dati che vanno a Prisma
  console.log('- Before Prisma create:')
  console.log('  - prismaData.startDate:', prismaData.startDate)
  console.log('  - prismaData.startDate.toISOString():', prismaData.startDate.toISOString())
  
  const result = await prisma.plannedTransaction.create({
    data: prismaData,
    include: { 
      subcategory: true,
      group: true,
      account: true  // 🏦 Includi account per vedere il conto associato
    }
  })
  
  // 🔸 DEBUG: Log del risultato da Prisma
  console.log('- After Prisma create:')
  console.log('  - result.startDate:', result.startDate)
  console.log('  - result.startDate.toISOString():', result.startDate?.toISOString())
  
  // 🔸 RIMOSSA materializzazione automatica alla creazione per evitare confusione
  // Le transazioni AUTOMATIC vengono materializzate solo da:
  // 1. Chiamata manuale dell'endpoint "paga"
  // 2. Cron job automatico (autoMaterializeDueTransactions)
  console.log('- Transazione creata. Materializzazione differita per controllo utente o cron job.')
  
  return result
}

/**
 * 🎯 SERVICE: Aggiorna transazione pianificata
 */
export async function updatePlannedTransaction(userId, id, data) {
  const exists = await prisma.plannedTransaction.findFirst({ where: { id, userId } })
  if (!exists) throw httpError(404, 'Not found')

  const { title, main, subId, subName, accountId, amount, note, payee, frequency, startDate, confirmationMode, groupId, isActive, appliedToBudget, budgetApplicationMode, budgetTargetMonth } = data
  
  let finalSubId = undefined
  if (subId !== undefined || subName !== undefined) {
    finalSubId = await resolveSubId(userId, subId, subName)
  }
  
  // Verifica gruppo se specificato
  if (groupId !== undefined && groupId !== null) {
    const groupExists = await prisma.transactionGroup.findFirst({ where: { id: groupId, userId } })
    if (!groupExists) throw httpError(400, 'Invalid groupId')
  }
  
  // Verifica account se specificato
  if (accountId !== undefined && accountId !== null) {
    const accountExists = await prisma.account.findFirst({ where: { id: accountId, userId } })
    if (!accountExists) throw httpError(400, 'Invalid accountId')
  }
  
  // Ricalcola nextDueDate se cambiano frequency o startDate
  let nextDueDate = undefined
  if (frequency !== undefined || startDate !== undefined) {
    const newFreq = frequency || exists.frequency
    const newStart = startDate || exists.startDate
    nextDueDate = calculateNextDueDate(newStart, newFreq)
  }

  return prisma.plannedTransaction.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),  // ✅ Aggiungi title per update
      ...(main !== undefined ? { main } : {}),
      ...(finalSubId !== undefined ? { subId: finalSubId } : {}),
      ...(accountId !== undefined ? { accountId } : {}),  // 🏦 Aggiungi accountId per update
      ...(amount !== undefined ? { amount } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(payee !== undefined ? { payee } : {}),
      ...(frequency !== undefined ? { frequency } : {}),
      ...(startDate !== undefined ? { startDate: new Date(startDate) } : {}),
      ...(confirmationMode !== undefined ? { confirmationMode } : {}),
      ...(groupId !== undefined ? { groupId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(appliedToBudget !== undefined ? { appliedToBudget } : {}),
      ...(budgetApplicationMode !== undefined ? { budgetApplicationMode } : {}),
      ...(budgetTargetMonth !== undefined ? { budgetTargetMonth } : {}),
      ...(nextDueDate !== undefined ? { nextDueDate } : {}),
    },
    include: { 
      subcategory: true,
      group: true,
      account: true  // 🏦 Includi account per vedere il conto associato
    }
  })
}

/**
 * 🎯 SERVICE: Elimina transazione pianificata
 */
export async function deletePlannedTransaction(userId, id) {
  const exists = await prisma.plannedTransaction.findFirst({ 
    where: { id, userId },
    include: { subcategory: true }
  })
  if (!exists) throw httpError(404, 'Not found')
  
  // 🔸 Se la transazione era applicata al budgeting, la rimuoviamo automaticamente
  if (exists.appliedToBudget) {
    const { removeTransactionFromBudget } = await import('../lib/budgetingIntegration.js')
    const { batchAccumulateBudgets } = await import('./budgetService.js')
    
    try {
      // Funzione per controllare se ci sono altre transazioni attive per la stessa sottocategoria/mese
      const checkOtherActiveTransactions = async (main, subcategoryName, monthIndex, excludeTransactionId) => {
        try {
          // Trova la sottocategoria by nome
          const subcategory = await prisma.subcategory.findFirst({
            where: {
              userId,
              name: { equals: subcategoryName, mode: 'insensitive' }
            }
          })
          
          if (!subcategory) return false
          
          // Cerca altre transazioni pianificate attive per la stessa sottocategoria
          const otherTransactions = await prisma.plannedTransaction.findMany({
            where: {
              userId,
              subId: subcategory.id,
              main: main.toUpperCase(),
              isActive: true,
              appliedToBudget: true,
              id: { not: excludeTransactionId } // Escludi la transazione che stiamo eliminando
            }
          })
          
          // Verifica se qualcuna di queste transazioni contribuisce al mese specificato
          const currentYear = new Date().getFullYear()
          
          for (const tx of otherTransactions) {
            if (tx.frequency === 'MONTHLY') {
              // Transazioni mensili contribuiscono a tutti i mesi
              return true
            } else if (tx.frequency === 'YEARLY') {
              if (tx.budgetApplicationMode === 'divide') {
                // Transazioni annuali divise contribuiscono a tutti i mesi
                return true
              } else if (tx.budgetApplicationMode === 'specific') {
                // Verifica se il mese target corrisponde
                if (tx.budgetTargetMonth === monthIndex) {
                  return true
                }
              } else {
                // Fallback: verifica il mese della startDate
                const startDate = new Date(tx.startDate)
                if (startDate.getMonth() === monthIndex) {
                  return true
                }
              }
            } else if (tx.frequency === 'ONE_TIME') {
              // Verifica se la one-time è nello stesso mese
              const startDate = new Date(tx.startDate)
              if (startDate.getMonth() === monthIndex && startDate.getFullYear() === currentYear) {
                return true
              }
            }
          }
          
          return false
        } catch (error) {
          console.error('Errore nel controllo altre transazioni:', error)
          return false
        }
      }
      
      // Calcola i budget da sottrarre
      const currentYear = new Date().getFullYear()
      const budgetsToRemove = await removeTransactionFromBudget(exists, {
        mode: exists.budgetApplicationMode || 'divide',
        targetMonth: exists.budgetTargetMonth,
        year: currentYear
      }, {}, checkOtherActiveTransactions)
      
      // Sottrai dal budgeting
      await batchAccumulateBudgets(userId, budgetsToRemove)
    } catch (error) {
      console.error('Errore rimuovendo transazione dal budgeting:', error)
      // Non blocchiamo l'eliminazione della transazione per questo errore
    }
  }
  
  await prisma.plannedTransaction.delete({ where: { id } })
}

/**
 * 🎯 SERVICE: Lista gruppi di transazioni
 */
export async function listTransactionGroups(userId) {
  return prisma.transactionGroup.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
    include: { 
      plannedTransactions: {
        include: { subcategory: true }
      }
    }
  })
}

/**
 * 🎯 SERVICE: Crea gruppo transazioni
 */
export async function createTransactionGroup(userId, data) {
  const { name, color, sortOrder } = data
  
  // Se non specificato sortOrder, metti alla fine
  let finalSortOrder = sortOrder
  if (finalSortOrder === undefined) {
    const lastGroup = await prisma.transactionGroup.findFirst({
      where: { userId },
      orderBy: { sortOrder: 'desc' }
    })
    finalSortOrder = lastGroup ? lastGroup.sortOrder + 1 : 0
  }
  
  return prisma.transactionGroup.create({
    data: {
      userId,
      name,
      color,
      sortOrder: finalSortOrder,
    },
    include: { 
      plannedTransactions: {
        include: { subcategory: true }
      }
    }
  })
}

/**
 * 🎯 SERVICE: Aggiorna gruppo transazioni
 */
export async function updateTransactionGroup(userId, id, data) {
  const exists = await prisma.transactionGroup.findFirst({ where: { id, userId } })
  if (!exists) throw httpError(404, 'Not found')

  return prisma.transactionGroup.update({
    where: { id },
    data,
    include: { 
      plannedTransactions: {
        include: { subcategory: true }
      }
    }
  })
}

/**
 * 🎯 SERVICE: Elimina gruppo transazioni
 */
export async function deleteTransactionGroup(userId, id) {
  const exists = await prisma.transactionGroup.findFirst({ where: { id, userId } })
  if (!exists) throw httpError(404, 'Not found')
  
  // Prima sposta tutte le transazioni pianificate fuori dal gruppo
  await prisma.plannedTransaction.updateMany({
    where: { groupId: id },
    data: { groupId: null }
  })
  
  await prisma.transactionGroup.delete({ where: { id } })
}

/**
 * 🎯 SERVICE: Riordina gruppi transazioni
 */
export async function reorderTransactionGroups(userId, groupIds) {
  const groups = await prisma.transactionGroup.findMany({
    where: { userId, id: { in: groupIds } }
  })
  
  if (groups.length !== groupIds.length) {
    throw httpError(400, 'Some group IDs are invalid')
  }
  
  // Aggiorna sortOrder per ogni gruppo
  const updates = groupIds.map((groupId, index) => 
    prisma.transactionGroup.update({
      where: { id: groupId },
      data: { sortOrder: index }
    })
  )
  
  await Promise.all(updates)
}

/**
 * 🎯 SERVICE: Sposta transazione pianificata in gruppo
 */
export async function movePlannedTransaction(userId, plannedTxId, groupId) {
  const exists = await prisma.plannedTransaction.findFirst({ where: { id: plannedTxId, userId } })
  if (!exists) throw httpError(404, 'Planned transaction not found')
  
  // Verifica gruppo se specificato
  if (groupId) {
    const groupExists = await prisma.transactionGroup.findFirst({ where: { id: groupId, userId } })
    if (!groupExists) throw httpError(400, 'Invalid groupId')
  }
  
  return prisma.plannedTransaction.update({
    where: { id: plannedTxId },
    data: { groupId: groupId || null },
    include: { 
      subcategory: true,
      group: true
    }
  })
}

/**
 * 🎯 SERVICE: Materializza transazione pianificata
 */
export async function materializePlannedTransaction(userId, plannedTxId) {
  const plannedTx = await prisma.plannedTransaction.findFirst({ 
    where: { id: plannedTxId, userId },
    include: { subcategory: true }
  })
  if (!plannedTx) throw httpError(404, 'Planned transaction not found')
  
  // 🛡️ PROTEZIONE: Verifica se la transazione è già stata materializzata oggi
  const today = new Date()
  const startOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  const endOfToday = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999))
  // Usa la data odierna (inizio giornata) in UTC per evitare problemi di timezone
  const transactionDate = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()))
  
  const existingToday = await prisma.transaction.findFirst({
    where: {
      userId,
      main: plannedTx.main,
      subId: plannedTx.subId,
      amount: plannedTx.main.toUpperCase() === 'INCOME' 
        ? Math.abs(plannedTx.amount) 
        : -Math.abs(plannedTx.amount),
      date: {
        gte: startOfToday,
        lte: endOfToday
      },
      note: {
        contains: plannedTx.loanId ? 'Rata prestito' : (plannedTx.title || plannedTx.note?.substring(0, 20) || '')
      }
    }
  })
  
  if (existingToday) {
    console.log('⚠️ DUPLICATE PROTECTION: Transaction already materialized today:', {
      plannedTxId,
      existingTransactionId: existingToday.id,
      date: existingToday.date
    })
    throw httpError(409, 'Questa transazione pianificata è già stata materializzata oggi')
  }
  
  // Se è una transazione collegata a un loan, registra il pagamento nel loan
  if (plannedTx.loanId) {
    const { payLoan } = await import('./loanService.js')
    const { syncLoanWithPaymentPlan } = await import('./loanBudgetingService.js')
    
    // Usa il nuovo servizio ottimizzato payLoan che gestisce automaticamente la prossima rata
    console.log('💰 DEBUG: Processing loan payment for planned transaction:', plannedTx.id, 'loan:', plannedTx.loanId)
    
    try {
      // Registra il pagamento usando il nuovo servizio ottimizzato
      const loanPaymentResult = await payLoan(
        userId,
        plannedTx.loanId,
        {
          actualAmount: Math.abs(plannedTx.amount),
          paidDate: new Date().toISOString(),
          notes: `Pagamento rata (${new Date().toLocaleDateString('it-IT')}) - ${plannedTx.title || 'Rata'}`
        }
      )
      
      console.log('💰 DEBUG: Loan payment completed:', loanPaymentResult)
      
      // 🔄 Sincronizza la transazione pianificata con il loan aggiornato
      try {
        console.log('🔄 DEBUG: Starting sync for planned transaction with loan payment plan...')
        
        await syncLoanWithPaymentPlan(userId, plannedTx.loanId)
        
        console.log('✅ Planned transaction synced with loan payment plan')
      } catch (syncError) {
        console.error('❌ Failed to sync planned transaction:', syncError.message)
        // Non bloccare l'operazione, ma logga l'errore
      }
      
      // Recupera il loan per ottenere il numero di rata appena pagata
      const updatedLoan = await prisma.loan.findFirst({
        where: { id: plannedTx.loanId, userId }
      })
      
      const paymentNumber = updatedLoan?.paidPayments || 'N/A'
      
      // Crea la transazione reale con i dati del loan payment (usa transactionDate già definito)
      console.log('📊 DEBUG: Creating loan transaction in register with date:', transactionDate, 'ISO:', transactionDate.toISOString())
      console.log('📅 DEBUG: Today is:', today.toISOString(), 'but using date:', transactionDate.toISOString())
      
      // 💰 CORREZIONE: Solo INCOME ha importo positivo, tutte le altre categorie sono negative
      const finalAmount = plannedTx.main.toUpperCase() === 'INCOME' 
        ? Math.abs(plannedTx.amount) 
        : -Math.abs(plannedTx.amount)
      
      console.log('🔧 DEBUG: Preparing loan transaction data:', {
        userId,
        date: transactionDate,
        amount: finalAmount,
        originalAmount: plannedTx.amount,
        main: plannedTx.main,
        subId: plannedTx.subId,
        payee: plannedTx.payee
      })
      
      // Crea la transazione e aggiorna il saldo in una transazione atomica
      const transaction = await prisma.$transaction(async (tx) => {
        // 1. Crea la transazione
        const newTransaction = await tx.transaction.create({
          data: {
            userId,
            date: transactionDate,
            amount: finalAmount, // Usa l'importo corretto
            main: plannedTx.main,
            subId: plannedTx.subId,
            accountId: plannedTx.accountId, // Usa il conto dalla planned transaction
            note: `Rata prestito #${paymentNumber} - ${plannedTx.title || 'Rata'} - Capitale: €${loanPaymentResult.payment.principalAmount?.toFixed(2) || '0.00'}, Interessi: €${loanPaymentResult.payment.interestAmount?.toFixed(2) || '0.00'}`,
            payee: plannedTx.payee,
          },
          include: { subcategory: true, account: true }
        })
        
        // 2. NON aggiornare il saldo del conto per transazioni loan
        // Il saldo è già stato aggiornato dalla funzione payLoan() chiamata sopra
        console.log('💰 DEBUG: Skipping account balance update for loan transaction - already handled by payLoan()')
        
        return newTransaction
      })
      
      // Invalida cache saldo dopo creazione transazione da loan
      invalidateBalanceCache(userId)
      
      console.log('✅ Transaction created successfully in database:')
      console.log('  - ID:', transaction.id)
      console.log('  - Date:', transaction.date?.toISOString())
      console.log('  - Amount:', transaction.amount)
      console.log('  - Note:', transaction.note)
      
      // 🔍 Verifica immediata: rileggi la transazione dal database per assicurarci che sia stata salvata
      try {
        const verifyTransaction = await prisma.transaction.findUnique({
          where: { id: transaction.id },
          include: { subcategory: true }
        })
        
        if (verifyTransaction) {
          console.log('✅ VERIFICATION: Transaction successfully found in database:')
          console.log('  - Verified ID:', verifyTransaction.id)
          console.log('  - Verified Date:', verifyTransaction.date?.toISOString())
          console.log('  - Verified Amount:', verifyTransaction.amount)
        } else {
          console.error('❌ VERIFICATION FAILED: Transaction not found in database after creation!')
        }
      } catch (verifyError) {
        console.error('❌ VERIFICATION ERROR:', verifyError.message)
      }
      
      console.log('✅ Loan payment recorded and transaction created')
      
      // 📝 Per transazioni loan ricorrenti, aggiorna nextDueDate per allinearsi con il loan
      if (plannedTx.frequency !== 'ONE_TIME') {
        // Recupera il loan aggiornato per ottenere la prossima data di pagamento
        const updatedLoan = await prisma.loan.findFirst({
          where: { id: plannedTx.loanId, userId }
        })
        
        if (updatedLoan) {
          console.log('🔄 DEBUG: Updating loan planned transaction nextDueDate to match loan nextPaymentDate:', {
            current: plannedTx.nextDueDate,
            new: updatedLoan.nextPaymentDate
          })
          
          await prisma.plannedTransaction.update({
            where: { id: plannedTxId },
            data: {
              nextDueDate: updatedLoan.nextPaymentDate
            }
          })
          
          console.log('✅ Loan planned transaction nextDueDate synced with loan')
        }
      }
      
      return transaction
      
    } catch (loanError) {
      console.error('❌ Error processing loan payment:', loanError.message)
      throw httpError(500, `Failed to process loan payment: ${loanError.message}`)
    }
  }
  
  // Comportamento normale per transazioni non-loan (usa transactionDate già definito)
  console.log('📊 DEBUG: Creating non-loan transaction with date:', transactionDate, 'ISO:', transactionDate.toISOString())
  
  // 💰 CORREZIONE: Solo INCOME ha importo positivo, tutte le altre categorie sono negative
  const finalAmount = plannedTx.main.toUpperCase() === 'INCOME' 
    ? Math.abs(plannedTx.amount) 
    : -Math.abs(plannedTx.amount)
  
  console.log('🔧 DEBUG: Preparing non-loan transaction data:', {
    userId,
    date: transactionDate,
    amount: finalAmount,
    originalAmount: plannedTx.amount,
    main: plannedTx.main,
    subId: plannedTx.subId,
    payee: plannedTx.payee
  })
  
  // Crea la transazione e aggiorna il saldo in una transazione atomica
  const transaction = await prisma.$transaction(async (tx) => {
    // 1. Crea la transazione
    const newTransaction = await tx.transaction.create({
      data: {
        userId,
        date: transactionDate,
        amount: finalAmount,
        main: plannedTx.main,
        subId: plannedTx.subId,
        accountId: plannedTx.accountId, // Usa il conto dalla planned transaction
        note: plannedTx.note,
        payee: plannedTx.payee,
      },
      include: { subcategory: true, account: true }
    })
    
    // 2. Aggiorna il saldo del conto se presente
    if (plannedTx.accountId) {
      await updateAccountBalance(plannedTx.accountId, Math.abs(plannedTx.amount), plannedTx.main, { transaction: tx })
    }
    
    return newTransaction
  })
  
  // Invalida cache saldo dopo creazione transazione pianificata
  invalidateBalanceCache(userId)
  
  // 🔄 Gestione speciale per frequenza REPEAT
  if (plannedTx.frequency === 'REPEAT') {
    console.log('🔄 Processing REPEAT transaction:')
    console.log('  - Current remainingRepeats:', plannedTx.remainingRepeats)
    console.log('  - Total repeatCount:', plannedTx.repeatCount)
    
    // Decrementa le ripetizioni rimanenti
    const newRemainingRepeats = (plannedTx.remainingRepeats || 1) - 1
    console.log('  - New remainingRepeats after decrement:', newRemainingRepeats)
    
    if (newRemainingRepeats <= 0) {
      // Nessuna ripetizione rimanente: disattiva la transazione
      console.log('  - No more repeats left, deactivating transaction')
      
      await prisma.plannedTransaction.update({
        where: { id: plannedTxId },
        data: {
          remainingRepeats: 0,
          isActive: false // Disattiva completamente
        }
      })
      
      console.log('✅ REPEAT transaction completed and deactivated')
    } else {
      // Ci sono ancora ripetizioni: calcola prossima data
      const newNextDueDate = calculateNextOccurrenceAfterMaterialization(
        plannedTx.startDate,
        'MONTHLY', // REPEAT usa logica MONTHLY per il calcolo
        plannedTx.nextDueDate
      )
      
      console.log('  - More repeats remaining, updating to next due date:', newNextDueDate?.toISOString())
      
      await prisma.plannedTransaction.update({
        where: { id: plannedTxId },
        data: {
          remainingRepeats: newRemainingRepeats,
          nextDueDate: newNextDueDate
        }
      })
      
      console.log('✅ REPEAT transaction updated with remaining repeats:', newRemainingRepeats)
    }
  } else if (plannedTx.frequency !== 'ONE_TIME') {
    // Comportamento normale per MONTHLY e YEARLY
    const newNextDueDate = calculateNextOccurrenceAfterMaterialization(
      plannedTx.startDate,
      plannedTx.frequency,
      plannedTx.nextDueDate
    )
    
    await prisma.plannedTransaction.update({
      where: { id: plannedTxId },
      data: {
        nextDueDate: newNextDueDate
      }
    })
    
  } else {
    // One-time: disattiva dopo materializzazione
    await prisma.plannedTransaction.update({
      where: { id: plannedTxId },
      data: { isActive: false }
    })
  }
  
  return transaction
}

/**
 * 🎯 SERVICE: Ottieni transazioni pianificate in scadenza
 */
export async function getPlannedTransactionsDue(userId, daysAhead = 7) {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // 00:00:00 di oggi
  const futureDate = new Date(todayStart)
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  return prisma.plannedTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextDueDate: {
        gte: todayStart, // 🔄 FIXED: Include solo da oggi in poi
        lte: futureDate  // Fino a daysAhead giorni nel futuro
      }
    },
    orderBy: { nextDueDate: 'asc' },
    include: { 
      subcategory: true,
      group: true
    }
  })
}

/**
 * 🎯 SERVICE: Calcola prossime occorrenze per una transazione
 */
export function getNextOccurrences(startDate, frequency, count = 5) {
  return calculateNextOccurrences(startDate, frequency, count)
}

/**
 * 🎯 SERVICE: Auto-materializza transazioni in scadenza (per cron jobs)
 */
export async function autoMaterializeDueTransactions() {
  const now = new Date()
  
  console.log(`🎯 [AutoMaterialize] Controllo transazioni pianificate scadute alle ${now.toISOString()}`)
  
  // Trova tutte le transazioni pianificate in scadenza con AUTO confirmation
  const dueTransactions = await prisma.plannedTransaction.findMany({
    where: {
      isActive: true,
      confirmationMode: 'AUTOMATIC',
      nextDueDate: {
        lte: now
      }
    },
    include: { subcategory: true }
  })
  
  console.log(`🔍 [AutoMaterialize] Trovate ${dueTransactions.length} transazioni automatiche scadute`)
  
  if (dueTransactions.length > 0) {
    dueTransactions.forEach(tx => {
      console.log(`  📅 ${tx.title || 'Untitled'} - Scadenza: ${tx.nextDueDate?.toISOString()} - User: ${tx.userId}`)
    })
  }
  
  const results = []
  
  for (const plannedTx of dueTransactions) {
    try {
      const materialized = await materializePlannedTransaction(plannedTx.userId, plannedTx.id)
      results.push({ success: true, plannedTxId: plannedTx.id, transactionId: materialized.id })
    } catch (error) {
      results.push({ success: false, plannedTxId: plannedTx.id, error: error.message })
    }
  }
  
  return results
}

/**
 * 🎯 SERVICE: Attiva/Disattiva transazione pianificata con gestione budgeting automatica
 */
export async function togglePlannedTransactionActive(userId, id, isActive) {
  const exists = await prisma.plannedTransaction.findFirst({ 
    where: { id, userId },
    include: { subcategory: true }
  })
  if (!exists) throw httpError(404, 'Not found')
  
  // 🔸 Se la transazione era applicata al budgeting, gestiamo automaticamente la rimozione/applicazione
  if (exists.appliedToBudget && exists.frequency === 'MONTHLY') {
    const { removeTransactionFromBudget, applyTransactionToBudget } = await import('../lib/budgetingIntegration.js')
    const { batchAccumulateBudgets } = await import('./budgetService.js')
    
    try {
      const currentYear = new Date().getFullYear()
      const budgetOptions = {
        mode: exists.budgetApplicationMode || 'divide',
        targetMonth: exists.budgetTargetMonth,
        year: currentYear
      }
      
      if (!isActive && exists.isActive) {
        // 🔸 Disattivazione: rimuovi dal budgeting con controllo altre transazioni
        // Funzione per controllare se ci sono altre transazioni attive per la stessa sottocategoria/mese
        const checkOtherActiveTransactions = async (main, subcategoryName, monthIndex, excludeTransactionId) => {
          try {
            // Trova la sottocategoria by nome
            const subcategory = await prisma.subcategory.findFirst({
              where: {
                userId,
                name: { equals: subcategoryName, mode: 'insensitive' }
              }
            })
            
            if (!subcategory) return false
            
            // Cerca altre transazioni pianificate attive per la stessa sottocategoria
            const otherTransactions = await prisma.plannedTransaction.findMany({
              where: {
                userId,
                subId: subcategory.id,
                main: main.toUpperCase(),
                isActive: true,
                appliedToBudget: true,
                id: { not: excludeTransactionId } // Escludi la transazione che stiamo disattivando
              }
            })
            
            // Verifica se qualcuna di queste transazioni contribuisce al mese specificato
            const currentYear = new Date().getFullYear()
            
            for (const tx of otherTransactions) {
              if (tx.frequency === 'MONTHLY') {
                // Transazioni mensili contribuiscono a tutti i mesi
                return true
              } else if (tx.frequency === 'YEARLY') {
                if (tx.budgetApplicationMode === 'divide') {
                  // Transazioni annuali divise contribuiscono a tutti i mesi
                  return true
                } else if (tx.budgetApplicationMode === 'specific') {
                  // Verifica se il mese target corrisponde
                  if (tx.budgetTargetMonth === monthIndex) {
                    return true
                  }
                } else {
                  // Fallback: verifica il mese della startDate
                  const startDate = new Date(tx.startDate)
                  if (startDate.getMonth() === monthIndex) {
                    return true
                  }
                }
              } else if (tx.frequency === 'ONE_TIME') {
                // Verifica se la one-time è nello stesso mese
                const startDate = new Date(tx.startDate)
                if (startDate.getMonth() === monthIndex && startDate.getFullYear() === currentYear) {
                  return true
                }
              }
            }
            
            return false
          } catch (error) {
            console.error('Errore nel controllo altre transazioni:', error)
            return false
          }
        }
        
        const budgetsToRemove = await removeTransactionFromBudget(exists, budgetOptions, {}, checkOtherActiveTransactions)
        await batchAccumulateBudgets(userId, budgetsToRemove)
      } else if (isActive && !exists.isActive) {
        // 🔸 Attivazione: NON riapplica automaticamente al budgeting
        // L'utente dovrà farlo manualmente tramite il pulsante
        console.log('Transazione riattivata. L\'utente dovrà riapplicarla manualmente al budgeting.')
      }
    } catch (error) {
      console.error('Errore gestendo budgeting per attivazione/disattivazione:', error)
      // Non blocchiamo l'operazione per questo errore
    }
  }
  
  return prisma.plannedTransaction.update({
    where: { id },
    data: { 
      isActive,
      // Se viene disattivata e era applicata al budgeting, rimuoviamo il flag
      ...((!isActive && exists.appliedToBudget) ? { appliedToBudget: false } : {})
    },
    include: { 
      subcategory: true,
      group: true
    }
  })
}
