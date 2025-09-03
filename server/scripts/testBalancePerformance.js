import { PrismaClient } from '@prisma/client'
import { getCurrentBalance } from '../src/services/balanceService.js'

const prisma = new PrismaClient()
const USER_ID = 'cmeq9a86a0009mgj0g7u5eul2'

async function testPerformance() {
  console.log('🔄 Test performance calcolo saldo con ~12k transazioni')
  
  // 1. Conta le transazioni totali
  const totalTransactions = await prisma.transaction.count({
    where: { userId: USER_ID }
  })
  console.log(`📊 Transazioni totali nel DB: ${totalTransactions}`)
  
  // 2. Test multiple chiamate per misurare cache vs non-cache
  const tests = [
    'Prima chiamata (nessuna cache)',
    'Seconda chiamata (dovrebbe usare cache)',
    'Terza chiamata (dovrebbe usare cache)',
    'Quarta chiamata (dovrebbe usare cache)',
    'Quinta chiamata (dovrebbe usare cache)'
  ]
  
  console.log('\n🚀 Iniziando test performance...')
  
  for (let i = 0; i < tests.length; i++) {
    const testName = tests[i]
    
    const startTime = Date.now()
    const result = await getCurrentBalance(USER_ID)
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log(`${i + 1}. ${testName}`)
    console.log(`   ⏱️  Tempo: ${duration}ms`)
    console.log(`   💰 Saldo: €${result.balance.toLocaleString()}`)
    console.log(`   📅 Data: ${result.asOf.toISOString()}`)
    
    if (i === 0) {
      // Aspetta un po' prima del secondo test per vedere differenza cache
      console.log('   ⏳ Attendo 1 secondo...')
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  // 3. Test stress: molte chiamate rapide
  console.log('\n🔥 Test stress: 10 chiamate rapide consecutive...')
  const stressStartTime = Date.now()
  
  const promises = []
  for (let i = 0; i < 10; i++) {
    promises.push(getCurrentBalance(USER_ID))
  }
  
  const stressResults = await Promise.all(promises)
  const stressEndTime = Date.now()
  const stressDuration = stressEndTime - stressStartTime
  
  console.log(`   ✅ 10 chiamate completate in ${stressDuration}ms`)
  console.log(`   ⚡ Velocità media: ${(stressDuration / 10).toFixed(1)}ms per chiamata`)
  console.log(`   🎯 Tutte le chiamate hanno restituito lo stesso saldo: ${stressResults.every(r => r.balance === stressResults[0].balance)}`)
  
  console.log('\n📈 Riassunto performance:')
  console.log(`   - Transazioni processate: ${totalTransactions}`)
  console.log(`   - Cache attiva: 30 secondi`)
  console.log(`   - Saldo finale: €${stressResults[0].balance.toLocaleString()}`)
}

async function main() {
  try {
    await testPerformance()
  } catch (error) {
    console.error('❌ Errore durante il test:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
