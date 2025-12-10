/**
 * 📊 DASHBOARD CONTROLLER: Statistiche e KPI
 * 
 * 🎯 Scopo: Fornire statistiche aggregate per il dashboard
 * - Entrate totali
 * - Spese totali
 * - Accantonamenti (ALLOCATE transfers)
 * - Risparmio (SAVING transfers)
 * - Saldo previsto
 * 
 * @author Finance WebApp Team
 * @modified 10 Dicembre 2025 - Creato per sistema KPI
 */

import { prisma } from '../lib/prisma.js'

/**
 * 🎯 GET /api/dashboard/kpi
 * Restituisce statistiche KPI per il periodo selezionato
 */
export async function getKPIStats(req, res) {
  try {
    const userId = req.user.id
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate e endDate sono obbligatori' 
      })
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    console.log(`📊 Calculating KPI stats for user ${userId}`)
    console.log(`   Period: ${start.toISOString()} to ${end.toISOString()}`)
    console.log(`   Query params:`, { startDate, endDate })
    
    // 🔸 Query parallele per performance
    const [
      incomeResult,
      expensesResult,
      allocationsResult,
      savingsTransfersResult,
      savingsTransactionsResult
    ] = await Promise.all([
      // 1️⃣ Entrate totali (transactions INCOME) - UPPERCASE
      prisma.transaction.aggregate({
        where: {
          userId,
          main: 'INCOME',
          date: { gte: start, lte: end }
        },
        _sum: { amount: true }
      }),
      
      // 2️⃣ Uscite totali (transactions escluso INCOME e SAVING) - UPPERCASE
      prisma.transaction.aggregate({
        where: {
          userId,
          main: { notIn: ['INCOME', 'SAVING'] },
          date: { gte: start, lte: end }
        },
        _sum: { amount: true }
      }),
      
      // 3️⃣ Accantonamenti (transfers ALLOCATE) - usa join con fromAccount per filtrare per userId
      prisma.transfer.aggregate({
        where: {
          fromAccount: { userId },
          transferType: 'ALLOCATE',
          date: { gte: start, lte: end }
        },
        _sum: { amount: true }
      }),
      
      // 4️⃣ Risparmio da transfers (SAVING) - usa join con fromAccount per filtrare per userId
      prisma.transfer.aggregate({
        where: {
          fromAccount: { userId },
          transferType: 'SAVING',
          date: { gte: start, lte: end }
        },
        _sum: { amount: true }
      }),
      
      // 5️⃣ Risparmio da transactions (main='SAVING')
      prisma.transaction.aggregate({
        where: {
          userId,
          main: 'SAVING',
          date: { gte: start, lte: end }
        },
        _sum: { amount: true }
      })
    ])
    
    // 🔸 Estrai valori (gestendo null)
    const totalIncome = Math.abs(Number(incomeResult._sum.amount) || 0)
    const totalExpenses = Math.abs(Number(expensesResult._sum.amount) || 0)
    const totalAllocations = Math.abs(Number(allocationsResult._sum.amount) || 0)
    
    // 💰 Risparmio = transfers SAVING + transactions SAVING
    const savingsFromTransfers = Math.abs(Number(savingsTransfersResult._sum.amount) || 0)
    const savingsFromTransactions = Math.abs(Number(savingsTransactionsResult._sum.amount) || 0)
    const totalSavings = savingsFromTransfers + savingsFromTransactions
    
    // 🔸 Calcolo saldo totale utente (somma saldi di tutti gli accounts)
    const accountsResult = await prisma.account.aggregate({
      where: { userId },
      _sum: { balance: true }
    })
    const currentBalance = Number(accountsResult._sum.balance) || 0
    
    // 🔸 TODO: Calcolare uscite previste dalle planned transactions
    // Per ora uso 0, ma dovrebbe essere calcolato dal frontend
    const plannedExpenses = 0
    
    // 🔸 Residuo = Saldo attuale - Uscite previste
    const projectedBalance = currentBalance - plannedExpenses
    
    console.log(`✅ KPI Stats calculated:`)
    console.log(`   - Income: ${totalIncome}`)
    console.log(`   - Expenses: ${totalExpenses}`)
    console.log(`   - Allocations: ${totalAllocations}`)
    console.log(`   - Savings: ${totalSavings}`)
    console.log(`   - Projected Balance: ${projectedBalance}`)
    
    res.status(200).json({
      totalIncome,
      totalExpenses,
      totalAllocations,
      totalSavings,
      projectedBalance,
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString()
      }
    })
    
  } catch (err) {
    console.error('❌ Get KPI stats error:', err)
    console.error('Stack trace:', err.stack)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}

/**
 * 🎯 GET /api/dashboard/allocations-detail
 * Dettaglio accantonamenti per pocket
 */
export async function getAllocationsDetail(req, res) {
  try {
    const userId = req.user.id
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate e endDate sono obbligatori' 
      })
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // 🔸 Accantonamenti raggruppati per pocket
    const allocations = await prisma.transfer.findMany({
      where: {
        userId,
        transferType: 'ALLOCATE',
        date: { gte: start, lte: end }
      },
      include: {
        toAccount: true // Il pocket di destinazione
      },
      orderBy: { date: 'desc' }
    })
    
    // 🔸 Raggruppa per pocket
    const byPocket = {}
    allocations.forEach(transfer => {
      const pocketName = transfer.toAccount.name
      if (!byPocket[pocketName]) {
        byPocket[pocketName] = {
          pocketId: transfer.toAccountId,
          pocketName,
          totalAmount: 0,
          count: 0,
          transfers: []
        }
      }
      byPocket[pocketName].totalAmount += Number(transfer.amount)
      byPocket[pocketName].count++
      byPocket[pocketName].transfers.push({
        id: transfer.id,
        amount: transfer.amount,
        date: transfer.date,
        note: transfer.note
      })
    })
    
    res.status(200).json({
      byPocket,
      total: allocations.reduce((sum, t) => sum + Number(t.amount), 0),
      count: allocations.length
    })
    
  } catch (err) {
    console.error('❌ Get allocations detail error:', err.message)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}

/**
 * 🎯 GET /api/dashboard/savings-detail
 * Dettaglio risparmio
 */
export async function getSavingsDetail(req, res) {
  try {
    const userId = req.user.id
    const { startDate, endDate } = req.query
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate e endDate sono obbligatori' 
      })
    }
    
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // 🔸 Risparmi verso conti SAVINGS
    const savings = await prisma.transfer.findMany({
      where: {
        userId,
        transferType: 'SAVING',
        date: { gte: start, lte: end }
      },
      include: {
        toAccount: true // Il conto risparmio di destinazione
      },
      orderBy: { date: 'desc' }
    })
    
    res.status(200).json({
      savings,
      total: savings.reduce((sum, t) => sum + Number(t.amount), 0),
      count: savings.length
    })
    
  } catch (err) {
    console.error('❌ Get savings detail error:', err.message)
    res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
