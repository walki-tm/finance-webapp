import { prisma } from '../lib/prisma.js'
import { invalidateBalanceCache } from './balanceService.js'

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
  
  // Priorità: se ci sono fromDate/toDate, usa quelli (per range custom e settimane)
  if (fromDate && toDate) {
    const from = new Date(fromDate)
    const to = new Date(toDate)
    // Assicurati che 'to' includa l'intera giornata
    to.setHours(23, 59, 59, 999)
    
    where.date = { gte: from, lte: to }
    
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
    where.date = { gte: from, lt: to }
    
    console.log('🔍 Using year/month filter:')
    console.log('  - Year:', y, 'Month:', m + 1)
    console.log('  - From:', from.toISOString())
    console.log('  - To:', to.toISOString())
  }
  const results = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'desc' },
    take: Number(limit),
    include: { subcategory: true }
  })
  
  // 🔍 DEBUG: Log risultati query
  if (year && month) {
    console.log('🔍 Query results:')
    console.log('  - Found', results.length, 'transactions')
    if (results.length > 0) {
      console.log('  - First transaction date:', results[0]?.date?.toISOString())
      console.log('  - Last transaction date:', results[results.length - 1]?.date?.toISOString())
    }
  }
  
  return results
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
  const { date, amount, main, subId, subName, note, payee } = data
  const finalSubId = await resolveSubId(userId, subId, subName)
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      date: new Date(date),
      amount,
      main,
      subId: finalSubId,
      note: note || null,
      payee: payee || null
    },
    include: { subcategory: true }
  })
  
  // Invalida cache saldo dopo creazione
  invalidateBalanceCache(userId)
  
  return transaction
}

export async function updateTransaction(userId, id, data) {
  const exists = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!exists) throw httpError(404, 'Not found')

  let { date, amount, main, subId, subName, note, payee } = data
  const finalSubId = await resolveSubId(userId, subId, subName)

  const transaction = await prisma.transaction.update({
    where: { id },
    data: {
      ...(date ? { date: new Date(date) } : {}),
      ...(typeof amount === 'number' ? { amount } : {}),
      ...(main ? { main } : {}),
      ...(finalSubId !== undefined ? { subId: finalSubId } : {}),
      ...(note !== undefined ? { note } : {}),
      ...(payee !== undefined ? { payee } : {}),
    },
    include: { subcategory: true }
  })
  
  // Invalida cache saldo dopo modifica
  invalidateBalanceCache(userId)
  
  return transaction
}

export async function deleteTransaction(userId, id) {
  const tx = await prisma.transaction.findFirst({ where: { id, userId } })
  if (!tx) throw httpError(404, 'Not found')
  await prisma.transaction.delete({ where: { id } })
  
  // Invalida cache saldo dopo cancellazione
  invalidateBalanceCache(userId)
}
