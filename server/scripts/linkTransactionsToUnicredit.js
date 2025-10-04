/**
 * Script per collegare tutte le transazioni esistenti al conto "Unicredit"
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function linkTransactionsToUnicredit() {
  try {
    console.log('🔍 Ricerca conto Unicredit...')
    
    // Trova il conto Unicredit
    const unicreditAccount = await prisma.account.findFirst({
      where: {
        name: {
          contains: 'Unicredit',
          mode: 'insensitive'
        }
      }
    })

    if (!unicreditAccount) {
      console.error('❌ Conto Unicredit non trovato!')
      return
    }

    console.log(`✅ Conto trovato: ${unicreditAccount.name} (ID: ${unicreditAccount.id})`)

    // Conta le transazioni senza conto collegato
    const transactionsWithoutAccount = await prisma.transaction.count({
      where: {
        accountId: null
      }
    })

    console.log(`📊 Transazioni senza conto collegato: ${transactionsWithoutAccount}`)

    if (transactionsWithoutAccount === 0) {
      console.log('✅ Tutte le transazioni hanno già un conto collegato!')
      return
    }

    // Aggiorna tutte le transazioni senza conto collegandole a Unicredit
    const updateResult = await prisma.transaction.updateMany({
      where: {
        accountId: null
      },
      data: {
        accountId: unicreditAccount.id
      }
    })

    console.log(`✅ Aggiornate ${updateResult.count} transazioni collegate al conto Unicredit`)

    // Mostra alcune transazioni aggiornate per verifica
    const updatedTransactions = await prisma.transaction.findMany({
      where: {
        accountId: unicreditAccount.id
      },
      include: {
        account: true
      },
      take: 5,
      orderBy: {
        date: 'desc'
      }
    })

    console.log('\n📋 Ultime 5 transazioni collegate:')
    updatedTransactions.forEach(t => {
      console.log(`  - ${t.date.toISOString().split('T')[0]} | ${t.main} | €${t.amount} | Conto: ${t.account.name}`)
    })

  } catch (error) {
    console.error('❌ Errore durante l\'aggiornamento:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Esegui lo script
linkTransactionsToUnicredit()
