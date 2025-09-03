import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configurazione
const USER_ID = 'cmeq9a86a0009mgj0g7u5eul2' // Il tuo user ID dal log
const TOTAL_TRANSACTIONS = 12000

// Importi casuali per le spese
const EXPENSE_AMOUNTS = [20, 50, 100, 200, 500, 1000, 5000]

// Categorie disponibili
const MAIN_CATEGORIES = ['EXPENSE', 'FOOD', 'TRANSPORT', 'ENTERTAINMENT', 'SHOPPING', 'UTILITIES']

// Non usiamo sottocategorie per evitare problemi foreign key
const SUB_CATEGORIES = [null]

// Note casuali
const RANDOM_NOTES = [
  'Spesa supermercato',
  'Pagamento bolletta',
  'Acquisto online',
  'Ristorante',
  'Benzina auto',
  'Abbonamento servizio',
  'Spese varie',
  'Pagamento rata',
  null,
  null, // Più probabilità di non avere note
]

function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function getRandomDate() {
  // Date casuali negli ultimi 6 mesi
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime())
  return new Date(randomTime)
}

async function generateTransactions() {
  console.log('🚀 Iniziando generazione di', TOTAL_TRANSACTIONS, 'transazioni...')
  
  const transactions = []
  
  // 1. Prima transazione INCOME da 1 milione
  console.log('💰 Creando transazione INCOME da €1.000.000...')
  transactions.push({
    userId: USER_ID,
    date: new Date('2025-01-01T10:00:00.000Z'),
    amount: 1000000, // 1 milione positivo
    main: 'INCOME',
    subId: null,
    note: 'Vincita lotteria - Test Performance',
    payee: 'Lotteria Italia'
  })
  
  // 2. Genera le restanti 11.999 transazioni EXPENSE
  console.log('💸 Generando', TOTAL_TRANSACTIONS - 1, 'transazioni di spesa...')
  
  for (let i = 1; i < TOTAL_TRANSACTIONS; i++) {
    const amount = getRandomElement(EXPENSE_AMOUNTS)
    
    transactions.push({
      userId: USER_ID,
      date: getRandomDate(),
      amount: -Math.abs(amount), // Spese sempre negative
      main: getRandomElement(MAIN_CATEGORIES),
      subId: getRandomElement(SUB_CATEGORIES),
      note: getRandomElement(RANDOM_NOTES),
      payee: Math.random() > 0.7 ? `Negozio ${Math.floor(Math.random() * 100)}` : null
    })
    
    // Progress log ogni 1000 transazioni
    if (i % 1000 === 0) {
      console.log(`  ⏳ Preparate ${i}/${TOTAL_TRANSACTIONS - 1} transazioni...`)
    }
  }
  
  console.log('📝 Salvando tutte le transazioni nel database...')
  const startTime = Date.now()
  
  // Inserimento batch per performance
  const batchSize = 500
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize)
    await prisma.transaction.createMany({
      data: batch,
      skipDuplicates: true
    })
    
    console.log(`  💾 Salvate ${Math.min(i + batchSize, transactions.length)}/${transactions.length} transazioni`)
  }
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  console.log('✅ Completato!')
  console.log(`📊 Statistiche:`)
  console.log(`   - Transazioni create: ${TOTAL_TRANSACTIONS}`)
  console.log(`   - Tempo impiegato: ${duration} secondi`)
  console.log(`   - Velocità: ${Math.round(TOTAL_TRANSACTIONS / duration)} transazioni/sec`)
  
  // Calcola il saldo finale atteso
  const totalIncome = 1000000
  const expenseAmounts = transactions.slice(1).map(t => Math.abs(t.amount))
  const totalExpenses = expenseAmounts.reduce((sum, amount) => sum + amount, 0)
  const expectedBalance = totalIncome - totalExpenses
  
  console.log(`💰 Saldo atteso: €${expectedBalance.toLocaleString()}`)
  console.log(`   - Entrate: €${totalIncome.toLocaleString()}`)
  console.log(`   - Uscite: €${totalExpenses.toLocaleString()}`)
}

async function main() {
  try {
    await generateTransactions()
  } catch (error) {
    console.error('❌ Errore durante la generazione:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
