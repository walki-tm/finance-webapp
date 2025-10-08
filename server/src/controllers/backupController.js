/**
 * 📄 BACKUP CONTROLLER: Gestione backup database
 * 
 * 🎯 Scopo: Endpoint per creare backup del database usando Prisma
 * 
 * @author Finance WebApp Team
 * @created 4 Ottobre 2025
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import { writeFile, mkdir, readdir, stat } from 'fs/promises'
import path from 'path'
import { prisma } from '../lib/prisma.js'

const execAsync = promisify(exec)

function httpError(status, message) {
  const err = new Error(message)
  err.status = status
  return err
}

/**
 * 🎯 CONTROLLER: Crea backup del database
 */
export async function createBackup(req, res, next) {
  try {
    console.log('🗃️ [BACKUP] Avvio creazione backup database...')
    
    const userId = req.user.id
    
    // Crea nome file backup con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const backupFileName = `finance-backup-${timestamp}.json`
    const backupDir = path.join(process.cwd(), 'backups')
    const backupPath = path.join(backupDir, backupFileName)
    
    // Assicurati che esista la directory backups
    try {
      await mkdir(backupDir, { recursive: true })
    } catch (err) {
      if (err.code !== 'EEXIST') throw err
    }
    
    console.log(`🗃️ [BACKUP] Esportazione dati per utente ${userId}...`)
    
    // Esporta tutti i dati dell'utente usando Prisma
    const backupData = {
      metadata: {
        version: '1.0',
        exportDate: new Date().toISOString(),
        userId: userId,
        description: 'Finance WebApp - Backup completo dati utente'
      },
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
        where: { userId },
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
    
    // Calcola statistiche del backup
    const stats = {
      categories: backupData.categories.length,
      subcategories: backupData.categories.reduce((sum, cat) => sum + cat.subcats.length, 0),
      transactions: backupData.transactions.length,
      plannedTransactions: backupData.plannedTransactions.length,
      budgets: backupData.budgets.length,
      accounts: backupData.accounts.length,
      transfers: backupData.transfers.length,
      loans: backupData.loans.length,
      savingsGoals: backupData.savingsGoals.length
    }
    
    // Aggiungi statistiche ai metadata
    backupData.metadata.stats = stats
    
    console.log(`🗃️ [BACKUP] Statistiche backup:`, stats)
    
    // Scrivi il file JSON
    await writeFile(backupPath, JSON.stringify(backupData, null, 2), 'utf8')
    
    console.log('🗃️ [BACKUP] Backup completato con successo!')
    console.log(`🗃️ [BACKUP] File salvato: ${backupPath}`)
    
    res.json({
      success: true,
      message: 'Backup creato con successo',
      filename: backupFileName,
      path: backupPath,
      timestamp: new Date().toISOString(),
      stats: stats
    })
    
  } catch (error) {
    console.error('❌ [BACKUP] Errore durante creazione backup:', error)
    next(httpError(500, `Errore durante backup: ${error.message}`))
  }
}

/**
 * 🎯 CONTROLLER: Lista backup esistenti
 */
export async function listBackups(req, res, next) {
  try {
    const backupsDir = path.join(process.cwd(), 'backups')
    
    console.log(`🗃️ [BACKUP] Lista backup da directory: ${backupsDir}`)
    
    // Verifica se la directory esiste
    try {
      await stat(backupsDir)
    } catch (error) {
      if (error.code === 'ENOENT') {
        return res.json({
          success: true,
          backupsDirectory: backupsDir,
          backups: [],
          message: 'Directory backup non trovata. Nessun backup presente.'
        })
      }
      throw error
    }
    
    // Lista i file nella directory backups
    const files = await readdir(backupsDir)
    const backupFiles = files.filter(file => 
      file.startsWith('finance-backup-') && file.endsWith('.json')
    )
    
    // Ottieni informazioni sui file
    const backupsWithInfo = await Promise.all(
      backupFiles.map(async (filename) => {
        const filePath = path.join(backupsDir, filename)
        const fileStats = await stat(filePath)
        
        return {
          filename,
          path: filePath,
          size: fileStats.size,
          created: fileStats.birthtime,
          modified: fileStats.mtime,
          sizeFormatted: (fileStats.size / 1024).toFixed(2) + ' KB'
        }
      })
    )
    
    // Ordina per data di creazione (più recenti primi)
    backupsWithInfo.sort((a, b) => b.created - a.created)
    
    console.log(`🗃️ [BACKUP] Trovati ${backupsWithInfo.length} backup`)
    
    res.json({
      success: true,
      backupsDirectory: backupsDir,
      backups: backupsWithInfo,
      count: backupsWithInfo.length
    })
    
  } catch (error) {
    console.error('❌ [BACKUP] Errore durante listing backup:', error)
    next(httpError(500, `Errore durante listing backup: ${error.message}`))
  }
}

