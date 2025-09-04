import { prisma } from '../lib/prisma.js'

// Cache semplice in memoria (per volume medio)
const balanceCache = new Map()
const CACHE_TTL = 30 * 1000 // 30 secondi

export async function getCurrentBalance(userId) {
  const now = new Date()
  const cacheKey = `balance_${userId}`
  
  // Controlla cache
  const cached = balanceCache.get(cacheKey)
  if (cached && (now.getTime() - cached.timestamp) < CACHE_TTL) {
    return { balance: cached.balance, asOf: cached.asOf }
  }

  // Query per calcolare il saldo correttamente:
  // PROBLEMA: Nel DB ci sono segni misti - alcune transazioni corrette, altre no
  // SOLUZIONE: Recuperiamo tutte le transazioni e applichiamo la logica corretta
  const allTransactions = await prisma.transaction.findMany({
    where: { 
      userId, 
      date: { lte: now }
    },
    select: {
      amount: true,
      main: true
    }
  })

  let balance = 0
  
  allTransactions.forEach(tx => {
    const amount = Number(tx.amount || 0)
    
    if (tx.main === 'INCOME') {
      // INCOME: sempre somma (anche se negativo nel DB, che è raro)
      balance += Math.abs(amount)
    } else {
      // TUTTO IL RESTO: sempre sottrae
      // Se è già negativo nel DB, lo rendiamo positivo e poi sottraiamo
      // Se è positivo nel DB, lo sottraiamo direttamente
      balance -= Math.abs(amount)
    }
  })
  
  // Salva in cache
  balanceCache.set(cacheKey, {
    balance,
    asOf: now,
    timestamp: now.getTime()
  })

  return { balance, asOf: now }
}

// Invalida cache quando si modificano transazioni
export function invalidateBalanceCache(userId) {
  balanceCache.delete(`balance_${userId}`)
}
