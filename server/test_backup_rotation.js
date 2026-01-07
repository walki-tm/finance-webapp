/**
 * 🧪 TEST BACKUP SERVICE: Verifica rotazione backup
 * 
 * Questo script testa:
 * 1. Creazione multipla di backup
 * 2. Rotazione automatica (max 5 backup)
 * 3. Cancellazione backup più vecchi
 * 
 * ATTENZIONE: questo script creerà backup reali!
 * Usare solo in ambiente di test/sviluppo.
 */

import { forceBackup } from './src/services/backupService.js'

async function testBackupRotation() {
  console.log('🧪 INIZIO TEST ROTAZIONE BACKUP')
  console.log('=' .repeat(50))
  
  try {
    // Crea 7 backup in sequenza per testare la rotazione (max 5)
    for (let i = 1; i <= 7; i++) {
      console.log(`\n📦 [TEST ${i}/7] Creazione backup ${i}...`)
      
      const result = await forceBackup()
      
      if (result.success) {
        console.log(`✅ Backup ${i} creato: ${result.filename}`)
        console.log(`📊 Statistiche:`, result.stats)
      } else {
        console.error(`❌ Errore backup ${i}:`, result.error)
      }
      
      // Pausa di 1 secondo tra i backup per differenziare i timestamp
      if (i < 7) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('✅ TEST COMPLETATO')
    console.log('\n📁 Controlla la cartella server/backups/')
    console.log('   Dovrebbero esserci SOLO 5 backup (i più recenti)')
    console.log('   I primi 2 backup dovrebbero essere stati cancellati')
    
  } catch (error) {
    console.error('\n❌ ERRORE DURANTE IL TEST:', error)
  } finally {
    process.exit(0)
  }
}

// Avvia test
testBackupRotation()
