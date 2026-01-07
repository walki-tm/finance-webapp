/**
 * 📦 BACKUP SERVICE: Gestione backup automatici
 * 
 * 🎯 Funzionalità:
 * - Backup automatico all'avvio server
 * - Backup schedulato giornaliero alle 5:00 AM
 * - Mantiene massimo 5 backup (cancella i più vecchi)
 * - Crea backup solo se l'ultimo è > 5 giorni fa
 * 
 * @author Finance WebApp Team
 * @created 7 Gennaio 2026
 */

import { writeFile, mkdir, readdir, stat, unlink } from 'fs/promises'
import path from 'path'
import { prisma } from '../lib/prisma.js'
import cron from 'node-cron'

const BACKUP_DIR = path.join(process.cwd(), 'backups')
const MAX_BACKUPS = 5
const BACKUP_INTERVAL_DAYS = 5
const SCHEDULE_TIME = '0 5 * * *' // Ogni giorno alle 5:00 AM

/**
 * 🔍 Ottiene lista backup esistenti ordinata per data (più recente prima)
 */
async function getBackupFiles() {
  try {
    // Assicura che la directory esista
    await mkdir(BACKUP_DIR, { recursive: true })
    
    const files = await readdir(BACKUP_DIR)
    const backupFiles = files.filter(file => 
      file.startsWith('finance-backup-') && file.endsWith('.json')
    )
    
    // Ottieni info su ogni file
    const filesWithStats = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = path.join(BACKUP_DIR, file)
        const stats = await stat(filePath)
        return {
          name: file,
          path: filePath,
          createdAt: stats.mtime, // Data modifica
          size: stats.size
        }
      })
    )
    
    // Ordina per data (più recente prima)
    filesWithStats.sort((a, b) => b.createdAt - a.createdAt)
    
    return filesWithStats
  } catch (error) {
    console.error('❌ [BACKUP SERVICE] Errore lettura backup:', error)
    return []
  }
}

/**
 * 🗑️ Cancella backup più vecchi per mantenere max MAX_BACKUPS
 */
async function cleanupOldBackups() {
  try {
    const backups = await getBackupFiles()
    
    if (backups.length <= MAX_BACKUPS) {
      console.log(`✅ [BACKUP SERVICE] ${backups.length} backup presenti (max ${MAX_BACKUPS})`)
      return
    }
    
    // Cancella i backup in eccesso (più vecchi)
    const backupsToDelete = backups.slice(MAX_BACKUPS)
    
    console.log(`🗑️ [BACKUP SERVICE] Eliminazione ${backupsToDelete.length} backup vecchi...`)
    
    for (const backup of backupsToDelete) {
      await unlink(backup.path)
      console.log(`   ✓ Eliminato: ${backup.name} (${new Date(backup.createdAt).toLocaleString('it-IT')})`)
    }
    
    console.log(`✅ [BACKUP SERVICE] Cleanup completato. Backup rimanenti: ${MAX_BACKUPS}`)
    
  } catch (error) {
    console.error('❌ [BACKUP SERVICE] Errore cleanup:', error)
  }
}

/**
 * ⏰ Verifica se è necessario creare un nuovo backup
 */
async function shouldCreateBackup() {
  const backups = await getBackupFiles()
  
  if (backups.length === 0) {
    console.log('📦 [BACKUP SERVICE] Nessun backup esistente, creazione necessaria')
    return true
  }
  
  const lastBackup = backups[0] // Più recente
  const daysSinceLastBackup = (Date.now() - lastBackup.createdAt) / (1000 * 60 * 60 * 24)
  
  console.log(`📅 [BACKUP SERVICE] Ultimo backup: ${new Date(lastBackup.createdAt).toLocaleString('it-IT')} (${daysSinceLastBackup.toFixed(1)} giorni fa)`)
  
  if (daysSinceLastBackup > BACKUP_INTERVAL_DAYS) {
    console.log(`✅ [BACKUP SERVICE] Backup necessario (> ${BACKUP_INTERVAL_DAYS} giorni)`)
    return true
  }
  
  console.log(`⏭️ [BACKUP SERVICE] Backup non necessario (< ${BACKUP_INTERVAL_DAYS} giorni)`)
  return false
}

/**
 * 💾 Crea backup di tutti i dati
 */
async function createBackup() {
  try {
    console.log('🗃️ [BACKUP SERVICE] Inizio creazione backup...')
    
    // Crea nome file con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const backupFileName = `finance-backup-${timestamp}.json`
    const backupPath = path.join(BACKUP_DIR, backupFileName)
    
    // Assicura che esista la directory
    await mkdir(BACKUP_DIR, { recursive: true })
    
    // Recupera tutti gli utenti (per backup completo)
    const users = await prisma.user.findMany({
      select: { id: true }
    })
    
    console.log(`📊 [BACKUP SERVICE] Backup di ${users.length} utenti...`)
    
    // Esporta dati per ogni utente
    const allUsersData = await Promise.all(
      users.map(async (user) => {
        const userId = user.id
        
        return {
          user: await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
              updatedAt: true
            }
          }),
          categories: await prisma.category.findMany({
            where: { userId },
            include: {
              subcats: {
                orderBy: { sortOrder: 'asc' }
              }
            },
            orderBy: { main: 'asc' }
          }),
          transactions: await prisma.transaction.findMany({
            where: { userId },
            include: {
              subcategory: true,
              account: true
            },
            orderBy: { date: 'desc' }
          }),
          plannedTransactions: await prisma.plannedTransaction.findMany({
            where: { userId },
            include: {
              subcategory: true,
              group: true,
              account: true
            },
            orderBy: { createdAt: 'asc' }
          }),
          transactionGroups: await prisma.transactionGroup.findMany({
            where: { userId },
            orderBy: { sortOrder: 'asc' }
          }),
          budgets: await prisma.budget.findMany({
            where: { userId },
            include: {
              subcategory: true
            },
            orderBy: { period: 'desc' }
          }),
          accounts: await prisma.account.findMany({
            where: { userId },
            orderBy: { createdAt: 'asc' }
          }),
          transfers: await prisma.transfer.findMany({
            where: {
              fromAccount: { userId }
            },
            include: {
              fromAccount: true,
              toAccount: true
            },
            orderBy: { date: 'desc' }
          }),
          loans: await prisma.loan.findMany({
            where: { userId },
            include: {
              subcategory: true,
              account: true,
              transactions: true
            },
            orderBy: { createdAt: 'asc' }
          }),
          savingsGoals: await prisma.savingsGoal.findMany({
            where: { userId },
            include: {
              subcategory: true,
              goalTransactions: true
            },
            orderBy: { createdAt: 'asc' }
          })
        }
      })
    )
    
    // Calcola statistiche totali
    const totalStats = allUsersData.reduce((acc, userData) => {
      return {
        users: acc.users + 1,
        categories: acc.categories + userData.categories.length,
        subcategories: acc.subcategories + userData.categories.reduce((sum, cat) => sum + cat.subcats.length, 0),
        transactions: acc.transactions + userData.transactions.length,
        plannedTransactions: acc.plannedTransactions + userData.plannedTransactions.length,
        budgets: acc.budgets + userData.budgets.length,
        accounts: acc.accounts + userData.accounts.length,
        transfers: acc.transfers + userData.transfers.length,
        loans: acc.loans + userData.loans.length,
        savingsGoals: acc.savingsGoals + userData.savingsGoals.length
      }
    }, {
      users: 0,
      categories: 0,
      subcategories: 0,
      transactions: 0,
      plannedTransactions: 0,
      budgets: 0,
      accounts: 0,
      transfers: 0,
      loans: 0,
      savingsGoals: 0
    })
    
    // Crea struttura backup
    const backupData = {
      metadata: {
        version: '2.0',
        exportDate: new Date().toISOString(),
        description: 'Finance WebApp - Backup automatico completo',
        stats: totalStats
      },
      users: allUsersData
    }
    
    // Scrivi file JSON
    await writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8')
    
    console.log('✅ [BACKUP SERVICE] Backup creato con successo!')
    console.log(`📊 [BACKUP SERVICE] Statistiche:`, totalStats)
    console.log(`📁 [BACKUP SERVICE] File: ${backupFileName}`)
    
    // Cleanup backup vecchi
    await cleanupOldBackups()
    
    return {
      success: true,
      filename: backupFileName,
      path: backupPath,
      stats: totalStats
    }
    
  } catch (error) {
    console.error('❌ [BACKUP SERVICE] Errore creazione backup:', error)
    throw error
  }
}

/**
 * 🚀 Esegue backup se necessario
 */
async function runBackupIfNeeded() {
  try {
    const shouldBackup = await shouldCreateBackup()
    
    if (!shouldBackup) {
      return { skipped: true, reason: `Ultimo backup < ${BACKUP_INTERVAL_DAYS} giorni fa` }
    }
    
    const result = await createBackup()
    return result
    
  } catch (error) {
    console.error('❌ [BACKUP SERVICE] Errore esecuzione backup:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 🎯 Inizializza servizio backup automatico
 */
export function initBackupService() {
  console.log('🗃️ [BACKUP SERVICE] Inizializzazione servizio backup automatico...')
  console.log(`   - Backup ogni ${BACKUP_INTERVAL_DAYS} giorni`)
  console.log(`   - Massimo ${MAX_BACKUPS} backup mantenuti`)
  console.log(`   - Scheduling: ogni giorno alle 5:00 AM`)
  
  // 1️⃣ Backup all'avvio del server (per uso locale)
  setTimeout(async () => {
    console.log('🚀 [BACKUP SERVICE] Verifica backup all\'avvio...')
    await runBackupIfNeeded()
  }, 5000) // Dopo 5 secondi dall'avvio (per non bloccare startup)
  
  // 2️⃣ Scheduling giornaliero alle 5:00 AM (per produzione)
  cron.schedule(SCHEDULE_TIME, async () => {
    console.log('⏰ [BACKUP SERVICE] Esecuzione backup schedulato (5:00 AM)...')
    await runBackupIfNeeded()
  }, {
    timezone: 'Europe/Rome' // Timezone Italia
  })
  
  console.log('✅ [BACKUP SERVICE] Servizio attivato con successo!')
}

/**
 * 🧪 Funzione manuale per forzare backup (per testing)
 */
export async function forceBackup() {
  console.log('🔧 [BACKUP SERVICE] Backup forzato manuale...')
  return await createBackup()
}

export default {
  initBackupService,
  forceBackup,
  runBackupIfNeeded
}
