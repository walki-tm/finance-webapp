/**
 * 🧪 TEST HOMEPAGE APIs
 * Testa tutte le API che la homepage dovrebbe chiamare
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testHomepageAPIs() {
  console.log('🧪 TEST HOMEPAGE APIs - Simulazione chiamate della homepage...\n')
  
  try {
    
    // Simuliamo un utente di test (prendo il primo utente dal database)
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) {
      console.log('❌ Nessun utente trovato nel database!')
      return
    }
    
    const userId = firstUser.id
    console.log(`👤 Testing con User ID: ${userId} (${firstUser.name})\n`)
    
    // ==========================================
    // 1. TEST API CATEGORIES
    // ==========================================
    console.log('🔍 Testing /api/categories...')
    try {
      const categories = await prisma.category.findMany({
        where: { userId },
        include: {
          subcats: {
            orderBy: { sortOrder: 'asc' }
          }
        },
        orderBy: { main: 'asc' }
      })
      console.log(`✅ Categories API OK - ${categories.length} categories, ${categories.reduce((sum, c) => sum + c.subcats.length, 0)} subcategories`)
    } catch (error) {
      console.log(`❌ Categories API FAILED: ${error.message}`)
    }
    
    // ==========================================
    // 2. TEST API TRANSACTIONS (current month)
    // ==========================================
    console.log('🔍 Testing /api/transactions (current month)...')
    try {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const fromDate = new Date(year, month - 1, 1)
      const toDate = new Date(year, month, 1)
      
      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: {
            gte: fromDate,
            lt: toDate
          }
        },
        include: {
          subcategory: true
        },
        orderBy: { date: 'desc' },
        take: 200
      })
      console.log(`✅ Transactions API OK - ${transactions.length} transactions for ${month}/${year}`)
    } catch (error) {
      console.log(`❌ Transactions API FAILED: ${error.message}`)
    }
    
    // ==========================================
    // 3. TEST API BUDGETS (current year)
    // ==========================================
    console.log('🔍 Testing /api/budgets (current year)...')
    try {
      const currentYear = new Date().getFullYear()
      const budgets = await prisma.budget.findMany({
        where: {
          userId,
          period: {
            startsWith: currentYear.toString()
          }
        },
        include: {
          subcategory: true
        },
        orderBy: [
          { main: 'asc' },
          { period: 'asc' }
        ]
      })
      console.log(`✅ Budgets API OK - ${budgets.length} budgets for ${currentYear}`)
    } catch (error) {
      console.log(`❌ Budgets API FAILED: ${error.message}`)
    }
    
    // ==========================================
    // 4. TEST API BALANCE
    // ==========================================
    console.log('🔍 Testing /api/balance...')
    try {
      const balance = await prisma.transaction.aggregate({
        where: {
          userId,
          date: { lte: new Date() }
        },
        _sum: { amount: true }
      })
      const currentBalance = balance._sum.amount || 0
      console.log(`✅ Balance API OK - Current balance: €${currentBalance}`)
    } catch (error) {
      console.log(`❌ Balance API FAILED: ${error.message}`)
    }
    
    // ==========================================
    // 5. TEST API PLANNED TRANSACTIONS
    // ==========================================
    console.log('🔍 Testing /api/planned-transactions...')
    try {
      const plannedTx = await prisma.plannedTransaction.findMany({
        where: { userId },
        include: {
          subcategory: true,
          group: true
        },
        orderBy: { nextDueDate: 'asc' }
      })
      console.log(`✅ Planned Transactions API OK - ${plannedTx.length} planned transactions`)
    } catch (error) {
      console.log(`❌ Planned Transactions API FAILED: ${error.message}`)
    }
    
    // ==========================================
    // 6. TEST API PLANNED TRANSACTIONS DUE
    // ==========================================
    console.log('🔍 Testing /api/planned-transactions/due...')
    try {
      const dueTransactions = await prisma.plannedTransaction.findMany({
        where: {
          userId,
          isActive: true,
          nextDueDate: {
            lte: new Date()
          }
        },
        include: {
          subcategory: true,
          group: true
        },
        orderBy: { nextDueDate: 'asc' }
      })
      console.log(`✅ Planned Transactions Due API OK - ${dueTransactions.length} due transactions`)
    } catch (error) {
      console.log(`❌ Planned Transactions Due API FAILED: ${error.message}`)
    }
    
    // ==========================================
    // 7. TEST API ACCOUNTS STATS
    // ==========================================
    console.log('🔍 Testing /api/accounts/stats...')
    try {
      // Questa è la query più complessa che potrebbe causare problemi
      const accountsStats = await prisma.account.groupBy({
        by: ['type'],
        where: { userId },
        _count: { id: true },
        _sum: { balance: true }
      })
      console.log(`✅ Accounts Stats API OK - ${accountsStats.length} account types`)
    } catch (error) {
      console.log(`❌ Accounts Stats API FAILED: ${error.message}`)
    }
    
    console.log('\n🎯 === RIEPILOGO TEST ===')
    console.log('Se tutti i test sono ✅ OK, il problema non è nei dati del database.')
    console.log('Il problema potrebbe essere:')
    console.log('- Un timeout nella webapp frontend')
    console.log('- Un problema di autenticazione/token')
    console.log('- Un componente React che va in loop infinito')
    console.log('- Un middleware che blocca le richieste')
    
    console.log('\n✅ Test APIs completato!')
    
  } catch (error) {
    console.error('❌ Errore durante il test APIs:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

testHomepageAPIs()
