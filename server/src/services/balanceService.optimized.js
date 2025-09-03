import { prisma } from '../lib/prisma.js'

// Cache in memoria per il saldo (in produzione usa Redis)
const balanceCache = new Map()
const CACHE_TTL = 30 * 1000 // 30 secondi

export async function getCurrentBalance(userId) {
  const now = new Date()
  const cacheKey = `balance_${userId}`
  
  // Controlla cache
  const cached = balanceCache.get(cacheKey)
  if (cached && (now.getTime() - cached.timestamp) < CACHE_TTL) {
    return { balance: cached.balance, asOf: cached.asOf, fromCache: true }
  }

  // Query database - versione ottimizzata singola
  const totalAgg = await prisma.transaction.aggregate({
    where: { userId, date: { lte: now } },
    _sum: { amount: true }
  })

  const balance = Number(totalAgg._sum.amount || 0)
  
  // Salva in cache
  balanceCache.set(cacheKey, {
    balance,
    asOf: now,
    timestamp: now.getTime()
  })

  return { balance, asOf: now }
}

// Invalida cache quando si aggiungono/modificano transazioni
export function invalidateBalanceCache(userId) {
  balanceCache.delete(`balance_${userId}`)
}

// Per scenari ad altissimo volume: pre-calcolo del saldo
export async function precomputeBalance(userId) {
  console.log('🔄 Pre-computing balance for user:', userId)
  
  const result = await getCurrentBalance(userId)
  
  // Opzionale: salva in una tabella dedicata per saldi
  // await prisma.userBalance.upsert({
  //   where: { userId },
  //   update: { balance: result.balance, updatedAt: result.asOf },
  //   create: { userId, balance: result.balance, updatedAt: result.asOf }
  // })
  
  return result
}
