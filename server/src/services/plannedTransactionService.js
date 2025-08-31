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

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

// 🔸 Utility per calcolo prossima data di scadenza
function calculateNextDueDate(startDate, frequency, currentDate = new Date()) {
  const start = new Date(startDate)
  const now = new Date(currentDate)
  
  if (frequency === 'ONE_TIME') {
    return start
  }
  
  let nextDue = new Date(start)
  
  if (frequency === 'MONTHLY') {
    // Trova il prossimo mese con lo stesso giorno
    while (nextDue <= now) {
      nextDue.setMonth(nextDue.getMonth() + 1)
    }
  } else if (frequency === 'YEARLY') {
    // Trova il prossimo anno con la stessa data
    while (nextDue <= now) {
      nextDue.setFullYear(nextDue.getFullYear() + 1)
    }
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
    
    if (frequency === 'MONTHLY') {
      current.setMonth(current.getMonth() + 1)
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
  
  return prisma.plannedTransaction.findMany({
    where,
    orderBy: [
      { group: { sortOrder: 'asc' } },
      { createdAt: 'asc' }
    ],
    include: { 
      subcategory: true,
      group: true
    }
  })
}

/**
 * 🎯 SERVICE: Crea transazione pianificata
 */
export async function createPlannedTransaction(userId, data) {
  const { title, main, subId, subName, amount, note, payee, frequency, startDate, confirmationMode, groupId, appliedToBudget, loanId } = data
  const finalSubId = await resolveSubId(userId, subId, subName)
  
  // Calcola nextDueDate basandosi su frequency e startDate
  const nextDueDate = calculateNextDueDate(startDate, frequency)
  
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
  
  return prisma.plannedTransaction.create({
    data: {
      userId,
      title: title || null,  // ✅ Aggiungi title mancante
      main,
      subId: finalSubId,
      amount,
      note: note || null,
      payee: payee || null,
      frequency,
      startDate: new Date(startDate),
      confirmationMode,
      groupId: groupId || null,
      appliedToBudget: appliedToBudget || false,
      loanId: loanId || null, // ✅ Aggiungi loanId mancante
      nextDueDate,
    },
    include: { 
      subcategory: true,
      group: true
    }
  })
}

/**
 * 🎯 SERVICE: Aggiorna transazione pianificata
 */
export async function updatePlannedTransaction(userId, id, data) {
  const exists = await prisma.plannedTransaction.findFirst({ where: { id, userId } })
  if (!exists) throw httpError(404, 'Not found')

  const { title, main, subId, subName, amount, note, payee, frequency, startDate, confirmationMode, groupId, isActive, appliedToBudget, budgetApplicationMode, budgetTargetMonth } = data
  
  let finalSubId = undefined
  if (subId !== undefined || subName !== undefined) {
    finalSubId = await resolveSubId(userId, subId, subName)
  }
  
  // Verifica gruppo se specificato
  if (groupId !== undefined && groupId !== null) {
    const groupExists = await prisma.transactionGroup.findFirst({ where: { id: groupId, userId } })
    if (!groupExists) throw httpError(400, 'Invalid groupId')
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
      group: true
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
  
  // Se è una transazione collegata a un loan, registra il pagamento nel loan
  if (plannedTx.loanId) {
    const { payLoan, syncLoanWithPaymentPlan } = await import('./loanService.js')
    
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
      
      // Crea la transazione reale con i dati del loan payment
      const transaction = await prisma.transaction.create({
        data: {
          userId,
          date: loanPaymentResult.payment.paidDate || new Date(),
          amount: plannedTx.amount, // Mantieni il segno negativo per le spese
          main: plannedTx.main,
          subId: plannedTx.subId,
          note: `Rata prestito #${paymentNumber} - ${plannedTx.title || 'Rata'} - Capitale: €${loanPaymentResult.payment.principalAmount?.toFixed(2) || '0.00'}, Interessi: €${loanPaymentResult.payment.interestAmount?.toFixed(2) || '0.00'}`,
          payee: plannedTx.payee,
        },
        include: { subcategory: true }
      })
      
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
  
  // Comportamento normale per transazioni non-loan
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      date: plannedTx.nextDueDate,
      amount: plannedTx.amount,
      main: plannedTx.main,
      subId: plannedTx.subId,
      note: plannedTx.note,
      payee: plannedTx.payee,
    },
    include: { subcategory: true }
  })
  
  // Aggiorna nextDueDate della transazione pianificata se ricorrente
  if (plannedTx.frequency !== 'ONE_TIME') {
    const newNextDueDate = calculateNextDueDate(plannedTx.startDate, plannedTx.frequency, plannedTx.nextDueDate)
    
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
  const futureDate = new Date(now)
  futureDate.setDate(futureDate.getDate() + daysAhead)
  
  return prisma.plannedTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextDueDate: {
        lte: futureDate
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
