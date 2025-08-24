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
  const { main, subId, subName, amount, note, payee, frequency, startDate, endDate, confirmationMode, groupId } = data
  const finalSubId = await resolveSubId(userId, subId, subName)
  
  // Calcola nextDueDate basandosi su frequency e startDate
  const nextDueDate = calculateNextDueDate(startDate, frequency)
  
  // Verifica che il gruppo appartenga all'utente se specificato
  if (groupId) {
    const groupExists = await prisma.transactionGroup.findFirst({ where: { id: groupId, userId } })
    if (!groupExists) throw httpError(400, 'Invalid groupId')
  }
  
  return prisma.plannedTransaction.create({
    data: {
      userId,
      main,
      subId: finalSubId,
      amount,
      note: note || null,
      payee: payee || null,
      frequency,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      confirmationMode,
      groupId: groupId || null,
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

  const { main, subId, subName, amount, note, payee, frequency, startDate, endDate, confirmationMode, groupId, isActive } = data
  
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
      ...(main !== undefined ? { main } : {}),
      ...(finalSubId !== undefined ? { subId: finalSubId } : {}),
      ...(amount !== undefined ? { amount } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(payee !== undefined ? { payee } : {}),
      ...(frequency !== undefined ? { frequency } : {}),
      ...(startDate !== undefined ? { startDate: new Date(startDate) } : {}),
      ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      ...(confirmationMode !== undefined ? { confirmationMode } : {}),
      ...(groupId !== undefined ? { groupId } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
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
  const exists = await prisma.plannedTransaction.findFirst({ where: { id, userId } })
  if (!exists) throw httpError(404, 'Not found')
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
  const { name, sortOrder } = data
  
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
  
  // Crea la transazione reale
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
    
    // Controlla se ha raggiunto endDate
    let shouldDeactivate = false
    if (plannedTx.endDate && newNextDueDate > plannedTx.endDate) {
      shouldDeactivate = true
    }
    
    await prisma.plannedTransaction.update({
      where: { id: plannedTxId },
      data: {
        nextDueDate: shouldDeactivate ? plannedTx.nextDueDate : newNextDueDate,
        isActive: !shouldDeactivate
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
