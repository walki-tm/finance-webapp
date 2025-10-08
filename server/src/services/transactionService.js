import { prisma } from '../lib/prisma.js'
import { invalidateBalanceCache } from './balanceService.js'
import { 
  updateAccountBalance,
  handleTransactionUpdate,
  revertAccountBalance 
} from './accountBalanceService.js'
import { createTransfer } from './transferService.js'

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

export async function listTransactions(userId, query) {
  const { year, month, fromDate, toDate, limit = 200 } = query
  const where = { userId }
  
  // 🔍 DEBUG: Log dei parametri ricevuti
  console.log('🔍 Transaction API parameters:')
  console.log('  - Year:', year)
  console.log('  - Month:', month) 
  console.log('  - FromDate:', fromDate)
  console.log('  - ToDate:', toDate)
  console.log('  - Limit:', limit)
  
  // Prepara filtri data per entrambe le query
  let dateFilter = {}
  
  // Priorità: se ci sono fromDate/toDate, usa quelli (per range custom e settimane)
  if (fromDate && toDate) {
    const from = new Date(fromDate)
    const to = new Date(toDate)
    // Assicurati che 'to' includa l'intera giornata
    to.setHours(23, 59, 59, 999)
    
    dateFilter = { gte: from, lte: to }
    where.date = dateFilter
    
    console.log('🔍 Using date range filter:')
    console.log('  - From:', from.toISOString())
    console.log('  - To:', to.toISOString())
  }
  // Altrimenti usa year/month per compatibilità
  else if (year && month) {
    const y = Number(year)
    const m = Number(month) - 1
    const from = new Date(Date.UTC(y, m, 1))
    const to = new Date(Date.UTC(y, m + 1, 1))
    dateFilter = { gte: from, lt: to }
    where.date = dateFilter
    
    console.log('🔍 Using year/month filter:')
    console.log('  - Year:', y, 'Month:', m + 1)
    console.log('  - From:', from.toISOString())
    console.log('  - To:', to.toISOString())
  }
  
  // 1. Recupera le transazioni normali
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: Number(limit),
    include: { 
      subcategory: true,
      account: true
    }
  })
  
  // 🔍 DEBUG: Log risultati query (solo transazioni, i transfers sono ora separati)
  console.log('🔍 Query results:')
  console.log('  - Found', transactions.length, 'transactions')
  console.log('  - Transfers are now handled separately in TransfersTab')
  
  return transactions
}

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

export async function createTransaction(userId, data) {
  const { date, amount, main, subId, subName, accountId, destinationAccountId, note, payee } = data
  
  console.log(`🚀 DEBUG createTransaction called:`)
  console.log(`  - userId: ${userId}`)
  console.log(`  - data:`, data)
  console.log(`  - main category: "${main}"`)
  console.log(`  - accountId: ${accountId}`)
  console.log(`  - amount: ${amount}`)
  
  // Se è un trasferimento, delega al transferService
  if (main === 'TRANSFER' && accountId && destinationAccountId) {
    console.log(`➡️ Delegating transfer to transferService`)
    const transferData = {
      date,
      amount,
      fromAccountId: accountId,
      toAccountId: destinationAccountId,
      note
    }
    return await createTransfer(userId, transferData)
  }
  
  const finalSubId = await resolveSubId(userId, subId, subName)
  
  // Valida accountId se fornito
  if (accountId) {
    const accountExists = await prisma.account.findFirst({ 
      where: { id: accountId, userId } 
    })
    if (!accountExists) throw httpError(400, 'Invalid accountId')
  }
  
  // Crea la transazione e aggiorna il saldo in una transazione atomica
  const result = await prisma.$transaction(async (tx) => {
    // 1. Crea la transazione (solo per transazioni normali, i trasferimenti sono gestiti separatamente)
    const transaction = await tx.transaction.create({
      data: {
        userId,
        date: new Date(date),
        amount,
        main,
        subId: finalSubId,
        accountId: accountId || null,
        note: note || null,
        payee: payee || null
      },
      include: { 
        subcategory: true,
        account: true
      }
    })
    
    // 2. Aggiorna il saldo del conto per transazioni normali
    if (accountId) {
      await updateAccountBalance(accountId, amount, main, { transaction: tx })
    }
    
    return transaction
  })
  
  // Invalida cache saldo dopo creazione
  invalidateBalanceCache(userId)
  
  return result
}

export async function updateTransaction(userId, id, data) {
  // Gestione per transazioni normali (i transfers sono ora gestiti separatamente)
  const exists = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!exists) throw httpError(404, 'Not found')

  let { date, amount, main, subId, subName, accountId, destinationAccountId, note, payee } = data
  const finalSubId = await resolveSubId(userId, subId, subName)
  
  // Valida accountId se fornito
  if (accountId !== undefined && accountId !== null) {
    const accountExists = await prisma.account.findFirst({ 
      where: { id: accountId, userId } 
    })
    if (!accountExists) throw httpError(400, 'Invalid accountId')
  }
  
  // Prepara i dati della nuova transazione (solo campi validi del modello Transaction)
  const newTransactionData = {
    ...(date ? { date: date instanceof Date ? date : new Date(date) } : {}),
    ...(typeof amount === 'number' ? { amount } : {}),
    ...(main ? { main } : {}),
    ...(finalSubId !== undefined ? { subId: finalSubId } : {}),
    ...(accountId !== undefined ? { accountId } : {}),
    ...(note !== undefined ? { note } : {}),
    ...(payee !== undefined ? { payee } : {}),
  }
  
  // Aggiorna la transazione e i saldi in una transazione atomica
  const result = await prisma.$transaction(async (tx) => {
    // 1. Gestisce l'aggiornamento dei saldi (reverte vecchio + applica nuovo)
    const oldData = {
      accountId: exists.accountId,
      amount: exists.amount,
      main: exists.main
    }
    
    const newData = {
      accountId: accountId !== undefined ? accountId : exists.accountId,
      amount: typeof amount === 'number' ? amount : exists.amount,
      main: main || exists.main
    }
    
    await handleTransactionUpdate(oldData, newData, { transaction: tx })
    
    // 2. Aggiorna la transazione
    const transaction = await tx.transaction.update({
      where: { id },
      data: newTransactionData,
      include: { 
        subcategory: true,
        account: true
      }
    })
    
    return transaction
  })
  
  // Invalida cache saldo dopo modifica
  invalidateBalanceCache(userId)
  
  return result
}

export async function deleteTransaction(userId, id) {
  // Gestione per transazioni normali (i transfers sono ora gestiti separatamente)
  const tx = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!tx) throw httpError(404, 'Not found')
  
  // Elimina la transazione e reverte il saldo in una transazione atomica
  await prisma.$transaction(async (txClient) => {
    // 1. Reverte il saldo del conto se esiste
    // Nota: I trasferimenti vengono gestiti tramite il modello Transfer separato
    if (tx.accountId) {
      await revertAccountBalance(tx.accountId, tx.amount, tx.main, { transaction: txClient })
    }
    
    // 2. Elimina la transazione
    await txClient.transaction.delete({ where: { id } })
  })
  
  // Invalida cache saldo dopo cancellazione
  invalidateBalanceCache(userId)
}
