/**
 * 🔧 DATABASE FIX SCRIPT
 * Corregge la planned transaction con frequency invalida
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixDatabaseIssues() {
  console.log('🔧 Avvio correzione problemi database...\n')
  
  try {
    // Correggiamo la planned transaction con frequency invalida
    const problematicId = 'cmfcj34bp000vy11malwtepbi'
    
    console.log(`🔍 Cerco planned transaction con ID: ${problematicId}`)
    
    const problematicPT = await prisma.plannedTransaction.findUnique({
      where: { id: problematicId }
    })
    
    if (problematicPT) {
      console.log(`✅ Trovata planned transaction: "${problematicPT.title}"`)
      console.log(`❌ Frequency attuale: "${problematicPT.frequency}" (INVALIDA)`)
      
      // Siccome il titolo è "Abbonamento Palestra (6 mesi)", sembra che dovrebbe essere
      // una transazione semestrale, quindi usiamo "SEMIANNUAL"
      const newFrequency = 'SEMIANNUAL'
      
      console.log(`🔄 Aggiorno frequency a: "${newFrequency}"`)
      
      const updated = await prisma.plannedTransaction.update({
        where: { id: problematicId },
        data: { 
          frequency: newFrequency,
          updatedAt: new Date()
        }
      })
      
      console.log(`✅ Planned transaction aggiornata con successo!`)
      console.log(`   - ID: ${updated.id}`)
      console.log(`   - Title: ${updated.title}`)
      console.log(`   - Frequency: ${updated.frequency}`)
      console.log(`   - Updated: ${updated.updatedAt}`)
      
    } else {
      console.log(`❌ Planned transaction con ID ${problematicId} non trovata`)
    }
    
    // Verifica finale
    console.log('\n🔍 Verifica finale - controllo planned transactions con frequency invalida...')
    
    const stillBadFrequency = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM "PlannedTransaction" 
      WHERE "frequency" NOT IN ('WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'YEARLY', 'ONE_TIME')
    `
    
    const badCount = Number(stillBadFrequency[0].count)
    
    if (badCount === 0) {
      console.log('✅ Tutti i record hanno frequency valida!')
    } else {
      console.log(`❌ Ci sono ancora ${badCount} planned transactions con frequency invalida`)
    }
    
    console.log('\n🎉 Correzione completata!')
    
  } catch (error) {
    console.error('❌ Errore durante la correzione:', error.message)
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDatabaseIssues()
