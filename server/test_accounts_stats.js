/**
 * 🧪 TEST ACCOUNTS STATS API - CORRETTO
 * Test corretto dell'API che causava problemi
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testAccountsStatsAPI() {
  console.log('🧪 TEST ACCOUNTS STATS API CORRETTO...\n')
  
  try {
    
    // Simuliamo un utente di test
    const firstUser = await prisma.user.findFirst()
    if (!firstUser) {
      console.log('❌ Nessun utente trovato nel database!')
      return
    }
    
    const userId = firstUser.id
    console.log(`👤 Testing con User ID: ${userId} (${firstUser.name})\n`)
    
    // Test dell'API accounts/stats con il campo corretto
    console.log('🔍 Testing /api/accounts/stats (versione corretta)...')
    try {
      // Query corretta con 'accountType' invece di 'type'
      const accountsStats = await prisma.account.groupBy({
        by: ['accountType'],  // ✅ CAMPO CORRETTO
        where: { userId },
        _count: { id: true },
        _sum: { balance: true }
      })
      console.log(`✅ Accounts Stats API OK - ${accountsStats.length} account types`)
      
      // Mostra i dettagli
      accountsStats.forEach(stat => {
        console.log(`   📊 ${stat.accountType}: ${stat._count.id} accounts, balance: €${stat._sum.balance || 0}`)
      })
      
    } catch (error) {
      console.log(`❌ Accounts Stats API FAILED: ${error.message}`)
    }
    
    // Test completo del service
    console.log('\n🔍 Testing AccountService.getAccountsStats()...')
    try {
      // Importiamo e testiamo il service completo
      const { getAccountsStats } = await import('./src/services/accountService.js')
      const stats = await getAccountsStats(userId)
      
      console.log('✅ AccountService.getAccountsStats() OK')
      console.log(`   📊 Total accounts: ${stats.totalAccounts}`)
      console.log(`   💰 Current accounts balance: €${stats.currentAccountsBalance}`)
      console.log(`   📈 Transactions with accounts: ${stats.totalTransactionsWithAccounts}`)
      console.log(`   🏦 Accounts by type:`, stats.accountsByType)
      
    } catch (error) {
      console.log(`❌ AccountService.getAccountsStats() FAILED: ${error.message}`)
    }
    
    console.log('\n✅ Test completato!')
    
  } catch (error) {
    console.error('❌ Errore durante il test:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAccountsStatsAPI()
