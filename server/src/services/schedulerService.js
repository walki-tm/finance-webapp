/**
 * 📄 SCHEDULER SERVICE: Servizio per schedulazione automatica transazioni
 * 
 * 🎯 Scopo: Gestisce la materializzazione automatica delle transazioni pianificate
 * 
 * 🔧 Dipendenze principali:
 * - plannedTransactionService per logica business
 * - Node.js timers per schedulazione
 * 
 * 📝 Note:
 * - Esegue controlli periodici per transazioni in scadenza
 * - Auto-materializza transazioni con confirmationMode AUTOMATIC
 * - Logging per monitoraggio e debug
 * 
 * @author Finance WebApp Team
 * @modified 23 Agosto 2025 - Creazione iniziale
 */

import { autoMaterializeDueTransactions } from './plannedTransactionService.js'

let schedulerInterval = null
const SCHEDULER_INTERVAL = 10 * 60 * 1000 // 10 minuti in millisecondi (ridotto per sviluppo)

/**
 * 🎯 SERVICE: Avvia scheduler automatico
 */
export function startScheduler() {
  if (schedulerInterval) {
    console.log('[Scheduler] Scheduler già in esecuzione')
    return
  }

  console.log('[Scheduler] Avvio scheduler transazioni pianificate')
  
  // Esegui immediatamente al primo avvio
  runScheduledMaterialization()
  
  // Poi esegui ogni ora
  schedulerInterval = setInterval(() => {
    runScheduledMaterialization()
  }, SCHEDULER_INTERVAL)
}

/**
 * 🎯 SERVICE: Ferma scheduler automatico
 */
export function stopScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
    console.log('[Scheduler] Scheduler fermato')
  }
}

/**
 * 🎯 SERVICE: Esegue materializzazione schedulata
 */
async function runScheduledMaterialization() {
  const timestamp = new Date().toISOString()
  console.log(`[Scheduler] Inizio controllo transazioni pianificate - ${timestamp}`)
  
  try {
    const results = await autoMaterializeDueTransactions()
    
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    
    if (results.length > 0) {
      console.log(`[Scheduler] Materializzazione completata:`)
      console.log(`  - Successo: ${successful}`)
      console.log(`  - Fallite: ${failed}`)
      
      // Log errori se presenti
      const errors = results.filter(r => !r.success)
      if (errors.length > 0) {
        console.error('[Scheduler] Errori durante materializzazione:')
        errors.forEach(error => {
          console.error(`  - Planned TX ${error.plannedTxId}: ${error.error}`)
        })
      }
    } else {
      console.log('[Scheduler] Nessuna transazione da materializzare')
    }
    
  } catch (error) {
    console.error('[Scheduler] Errore durante controllo schedulato:', error.message)
  }
}

/**
 * 🎯 SERVICE: Ottieni stato scheduler
 */
export function getSchedulerStatus() {
  return {
    running: schedulerInterval !== null,
    intervalMs: SCHEDULER_INTERVAL,
    nextRun: schedulerInterval ? Date.now() + SCHEDULER_INTERVAL : null,
  }
}

/**
 * 🎯 SERVICE: Esegui materializzazione manuale (per testing/admin)
 */
export async function runManualMaterialization() {
  console.log('[Scheduler] Esecuzione materializzazione manuale')
  return await runScheduledMaterialization()
}

// 🎯 AVVIA AUTOMATICAMENTE LO SCHEDULER SEMPRE (sviluppo e produzione)
console.log('[Scheduler] 🚀 Initializing automatic scheduler for planned transactions...')
startScheduler()

// Gestisci shutdown graceful
process.on('SIGINT', () => {
  console.log('[Scheduler] Ricevuto SIGINT, fermando scheduler...')
  stopScheduler()
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('[Scheduler] Ricevuto SIGTERM, fermando scheduler...')
  stopScheduler()
  process.exit(0)
})
