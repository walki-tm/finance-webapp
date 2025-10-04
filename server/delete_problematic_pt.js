/**
 * 🗑️ DELETE PROBLEMATIC PLANNED TRANSACTION
 * Elimina la planned transaction con frequency invalida
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteProblematicPlannedTransaction() {
  console.log('🗑️ Eliminazione planned transaction problematica...\n')
  
  try {
    const problematicId = 'cmfcj34bp000vy11malwtepbi'
    
    console.log(`🔍 Cerco planned transaction con ID: ${problematicId}`)
    
    // Prima vediamo i dettagli del record che elimineremo
    const problematicPT = await prisma.plannedTransaction.findUnique({
      where: { id: problematicId }
    })
    
    if (problematicPT) {
      console.log(`✅ Trovata planned transaction da eliminare:`)
      console.log(`   - ID: ${problematicPT.id}`)
      console.log(`   - Title: ${problematicPT.title}`)
      console.log(`   - Frequency: ${problematicPT.frequency} (INVALIDA)`)
      console.log(`   - Amount: ${problematicPT.amount}`)
      console.log(`   - Created: ${problematicPT.createdAt}`)
      
      console.log('\n🗑️ Eliminazione in corso...')
      
      // Eliminiamo il record
      await prisma.plannedTransaction.delete({
        where: { id: problematicId }
      })
      
      console.log('✅ Planned transaction eliminata con successo!')
      
    } else {
      console.log(`❌ Planned transaction con ID ${problematicId} non trovata`)
    }
    
    // Verifica finale - controlliamo che non ci siano più record problematici
    console.log('\n🔍 Verifica finale - controllo planned transactions con frequency invalida...')
    
    const stillBadFrequency = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "PlannedTransaction" 
      WHERE "frequency" NOT IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME')
    `
    
    const badCount = Number(stillBadFrequency[0].count)
    
    if (badCount === 0) {
      console.log('✅ Database pulito! Nessuna planned transaction con frequency invalida')
    } else {
      console.log(`❌ Ci sono ancora ${badCount} planned transactions con frequency invalida`)
    }
    
    // Statistiche aggiornate
    const totalPlannedTx = await prisma.plannedTransaction.count()
    console.log(`📊 Totale planned transactions rimanenti: ${totalPlannedTx}`)
    
    console.log('\n🎉 Eliminazione completata! Il database ora dovrebbe essere pulito.')
    
  } catch (error) {
    console.error('❌ Errore durante l\'eliminazione:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

deleteProblematicPlannedTransaction()
