/**
 * 📄 PLANNED TRANSACTIONS CONTROLLER: Gestione transazioni pianificate
 * 
 * 🎯 Scopo: Gestisce CRUD per transazioni pianificate e gruppi organizzativi
 * 
 * 🔧 Dipendenze principali:
 * - Zod per validazione input
 * - plannedTransactionService per business logic
 * 
 * 📝 Note:
 * - Supporta creazione, modifica, eliminazione transazioni pianificate
 * - Gestisce raggruppamento in card personalizzate
 * - Include logica per materializzazione automatica
 * 
 * @author Finance WebApp Team
 * @modified 23 Agosto 2025 - Creazione iniziale
 */

import { z } from 'zod'
import {
  listPlannedTransactions as listPlannedTransactionsService,
  createPlannedTransaction as createPlannedTransactionService,
  updatePlannedTransaction as updatePlannedTransactionService,
  deletePlannedTransaction as deletePlannedTransactionService,
  listTransactionGroups as listTransactionGroupsService,
  createTransactionGroup as createTransactionGroupService,
  updateTransactionGroup as updateTransactionGroupService,
  deleteTransactionGroup as deleteTransactionGroupService,
  reorderTransactionGroups as reorderTransactionGroupsService,
  movePlannedTransaction as movePlannedTransactionService,
  materializePlannedTransaction as materializePlannedTransactionService,
  getPlannedTransactionsDue as getPlannedTransactionsDueService,
  getNextOccurrences as getNextOccurrencesService,
} from '../services/plannedTransactionService.js'

// Import per integrazione budgeting
import { batchUpsertBudgets as batchUpsertBudgetsService, batchAccumulateBudgets as batchAccumulateBudgetsService } from '../services/budgetService.js'
import { 
  applyTransactionToBudget, 
  removeTransactionFromBudget 
} from '../lib/budgetingIntegration.js'

// 🔸 Validation schemas
const plannedTxSchema = z.object({
  title: z.string().optional().nullable(),  // ✅ Aggiungi title mancante
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()),
  subId: z.string().optional().nullable(),
  subName: z.string().optional().nullable(),
  amount: z.coerce.number(),
  note: z.string().optional().nullable(),
  payee: z.string().optional().nullable(),
  frequency: z.enum(['MONTHLY', 'YEARLY', 'ONE_TIME', 'REPEAT']), // ✅ Aggiungi REPEAT
  startDate: z.coerce.date(),
  confirmationMode: z.enum(['MANUAL', 'AUTOMATIC']).default('MANUAL'),
  groupId: z.string().optional().nullable(),
  appliedToBudget: z.boolean().optional().default(false),
  
  // 🔄 Campi per frequenza REPEAT
  repeatCount: z.number().int().min(1).max(100).optional().nullable(), // numero di ripetizioni (1-100)
}).refine((data) => {
  // Se frequency è REPEAT, repeatCount deve essere specificato
  if (data.frequency === 'REPEAT' && (!data.repeatCount || data.repeatCount < 1)) {
    return false
  }
  return true
}, {
  message: "Per la frequenza REPEAT è richiesto un numero di ripetizioni valido (1-100)",
  path: ["repeatCount"]
})

const plannedTxPatchSchema = z.object({
  title: z.string().nullable().optional(),  // ✅ Aggiungi title per modifiche
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()).optional(),
  subId: z.string().nullable().optional(),
  subName: z.string().nullable().optional(),
  amount: z.number().optional(),
  note: z.string().nullable().optional(),
  payee: z.string().nullable().optional(),
  frequency: z.enum(['MONTHLY', 'YEARLY', 'ONE_TIME', 'REPEAT']).optional(), // ✅ Aggiungi REPEAT
  startDate: z.coerce.date().optional(),
  confirmationMode: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
  groupId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  appliedToBudget: z.boolean().optional(),
  budgetApplicationMode: z.string().nullable().optional(), // Aggiungi campo mancante
  budgetTargetMonth: z.number().nullable().optional(), // Aggiungi campo mancante
  
  // 🔄 Campi per frequenza REPEAT
  repeatCount: z.number().int().min(1).max(100).nullable().optional(),
  remainingRepeats: z.number().int().min(0).nullable().optional(), // per aggiornamenti interni
})

const groupSchema = z.object({
  name: z.string().min(1).max(255),
  color: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
})

const groupPatchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  color: z.string().nullable().optional(),
  sortOrder: z.number().optional(),
})

/**
 * 🎯 CONTROLLER: Lista transazioni pianificate
 */
export async function listPlannedTransactions(req, res, next) {
  try {
    const data = await listPlannedTransactionsService(req.user.id, req.query)
    res.json(data)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Crea transazione pianificata
 */
export async function createPlannedTransaction(req, res, next) {
  // 🔸 DEBUG: Log dei dati ricevuti nel controller
  console.log('🐛 DEBUG plannedTransactionsController - createPlannedTransaction:')
  console.log('- req.body.startDate (raw):', req.body.startDate)
  console.log('- typeof req.body.startDate:', typeof req.body.startDate)
  
  const parsed = plannedTxSchema.safeParse(req.body)
  
  if (!parsed.success) {
    console.log('🔸 DEBUG - Validation failed:', parsed.error.errors)
    return res.status(400).json({ error: 'Invalid body', details: parsed.error.errors })
  }
  
  // 🔸 DEBUG: Log dei dati dopo parsing Zod
  console.log('- parsed.data.startDate (after Zod):', parsed.data.startDate)
  console.log('- parsed.data.startDate instanceof Date:', parsed.data.startDate instanceof Date)
  console.log('- parsed.data.startDate.toISOString():', parsed.data.startDate.toISOString())
  
  try {
    const created = await createPlannedTransactionService(req.user.id, parsed.data)
    
    // 🔸 DEBUG: Log del risultato salvato
    console.log('- created.startDate (saved):', created.startDate)
    
    res.status(201).json(created)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Aggiorna transazione pianificata
 */
export async function updatePlannedTransaction(req, res, next) {
  const parsed = plannedTxPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.errors })
  try {
    const updated = await updatePlannedTransactionService(req.user.id, req.params.id, parsed.data)
    res.json(updated)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Elimina transazione pianificata
 */
export async function deletePlannedTransaction(req, res, next) {
  try {
    await deletePlannedTransactionService(req.user.id, req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Lista gruppi di transazioni
 */
export async function listTransactionGroups(req, res, next) {
  try {
    const data = await listTransactionGroupsService(req.user.id)
    res.json(data)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Crea gruppo transazioni
 */
export async function createTransactionGroup(req, res, next) {
  const parsed = groupSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.errors })
  try {
    const created = await createTransactionGroupService(req.user.id, parsed.data)
    res.status(201).json(created)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Aggiorna gruppo transazioni
 */
export async function updateTransactionGroup(req, res, next) {
  const parsed = groupPatchSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.errors })
  try {
    const updated = await updateTransactionGroupService(req.user.id, req.params.id, parsed.data)
    res.json(updated)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Elimina gruppo transazioni
 */
export async function deleteTransactionGroup(req, res, next) {
  try {
    await deleteTransactionGroupService(req.user.id, req.params.id)
    res.status(204).end()
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Riordina gruppi transazioni
 */
export async function reorderTransactionGroups(req, res, next) {
  const { groupIds } = req.body
  if (!Array.isArray(groupIds)) {
    return res.status(400).json({ error: 'groupIds must be an array' })
  }
  try {
    await reorderTransactionGroupsService(req.user.id, groupIds)
    res.status(204).end()
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Sposta transazione pianificata in gruppo
 */
export async function movePlannedTransaction(req, res, next) {
  const { groupId } = req.body
  try {
    const updated = await movePlannedTransactionService(req.user.id, req.params.id, groupId)
    res.json(updated)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Materializza transazione pianificata
 */
export async function materializePlannedTransaction(req, res, next) {
  try {
    const materialized = await materializePlannedTransactionService(req.user.id, req.params.id)
    res.status(201).json(materialized)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Ottieni transazioni pianificate in scadenza
 */
export async function getPlannedTransactionsDue(req, res, next) {
  try {
    const due = await getPlannedTransactionsDueService(req.user.id)
    res.json(due)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Ottieni prossime N transazioni pianificate per dashboard
 */
export async function getUpcomingPlannedTransactions(req, res, next) {
  try {
    const { limit = '5' } = req.query
    const limitNum = Math.min(parseInt(limit, 10) || 5, 10) // Max 10 transazioni
    
    const upcoming = await getPlannedTransactionsDueService(req.user.id, 365) // Prossimi 365 giorni
    
    // Ordina per nextDueDate e prendi solo le prime N
    const sortedUpcoming = upcoming
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
      .slice(0, limitNum)
    
    res.json(sortedUpcoming)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Calcola prossime occorrenze per una transazione pianificata
 */
export async function getNextOccurrences(req, res, next) {
  try {
    const { startDate, frequency, count = '5' } = req.query
    
    if (!startDate || !frequency) {
      return res.status(400).json({ error: 'startDate and frequency are required' })
    }
    
    const occurrences = getNextOccurrencesService(
      startDate, 
      frequency, 
      parseInt(count, 10) || 5
    )
    
    res.json(occurrences)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Applica transazione pianificata al budgeting
 */
export async function applyToBudgeting(req, res, next) {
  try {
    // Recupera la transazione pianificata
    const plannedTransactions = await listPlannedTransactionsService(req.user.id)
    const transaction = plannedTransactions.find(t => t.id === req.params.id)
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transazione pianificata non trovata' })
    }
    
    if (transaction.appliedToBudget) {
      return res.status(400).json({ error: 'Transazione già applicata al budgeting' })
    }
    
    // Opzioni per l'applicazione
    const { year, mode = 'divide', targetMonth } = req.body
    const currentYear = year || new Date().getFullYear()
    
    // Recupera le sottocategorie (per ora usiamo un oggetto vuoto - verrà gestito dalla funzione)
    const subcats = {}
    
    // Applica al budgeting
    const budgetUpdates = applyTransactionToBudget(
      transaction, 
      { year: currentYear, mode, targetMonth }, 
      subcats
    )
    
    // Applica i budget (usa accumulo per non sovrascrivere)
    await batchAccumulateBudgetsService(req.user.id, budgetUpdates)
    
    // Salva i parametri di applicazione
    const budgetUpdateData = {
      appliedToBudget: true
    }
    
    // Per le transazioni annuali, salva la modalità usata
    if (transaction.frequency === 'YEARLY') {
      budgetUpdateData.budgetApplicationMode = mode
      if (mode === 'specific' && targetMonth !== undefined) {
        budgetUpdateData.budgetTargetMonth = targetMonth
      }
    }
    
    // Aggiorna la transazione pianificata
    const updated = await updatePlannedTransactionService(req.user.id, req.params.id, budgetUpdateData)
    
    res.json({ 
      message: 'Transazione applicata al budgeting con successo', 
      transaction: updated,
      budgetUpdates: budgetUpdates.length
    })
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Rimuovi transazione pianificata dal budgeting
 */
export async function removeFromBudgeting(req, res, next) {
  try {
    // Recupera la transazione pianificata
    const plannedTransactions = await listPlannedTransactionsService(req.user.id)
    const transaction = plannedTransactions.find(t => t.id === req.params.id)
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transazione pianificata non trovata' })
    }
    
    if (!transaction.appliedToBudget) {
      return res.status(400).json({ error: 'Transazione non applicata al budgeting' })
    }
    
    // Opzioni per la rimozione (usa le modalità salvate o default)
    const { year } = req.body
    const currentYear = year || new Date().getFullYear()
    
    // Usa la modalità salvata per le transazioni annuali
    let mode = 'divide'
    let targetMonth = null
    
    if (transaction.frequency === 'YEARLY') {
      mode = transaction.budgetApplicationMode || 'divide'
      targetMonth = transaction.budgetTargetMonth
    }
    
    // Recupera le sottocategorie
    const subcats = {}
    
    // Funzione per controllare se ci sono altre transazioni attive per la stessa sottocategoria/mese
    const checkOtherActiveTransactions = async (main, subcategoryName, monthIndex, excludeTransactionId) => {
      try {
        const { prisma } = await import('../lib/prisma.js')
        
        // Trova la sottocategoria by nome
        const subcategory = await prisma.subcategory.findFirst({
          where: {
            userId: req.user.id,
            name: { equals: subcategoryName, mode: 'insensitive' }
          }
        })
        
        if (!subcategory) return false
        
        // Cerca altre transazioni pianificate attive per la stessa sottocategoria
        const otherTransactions = await prisma.plannedTransaction.findMany({
          where: {
            userId: req.user.id,
            subId: subcategory.id,
            main: main.toUpperCase(),
            isActive: true,
            appliedToBudget: true,
            id: { not: excludeTransactionId } // Escludi la transazione che stiamo rimuovendo
          }
        })
        
        // Verifica se qualcuna di queste transazioni contribuisce al mese specificato
        const currentYear = new Date().getFullYear()
        
        for (const tx of otherTransactions) {
          if (tx.frequency === 'MONTHLY') {
            // Transazioni mensili contribuiscono a tutti i mesi
            return true
          } else if (tx.frequency === 'YEARLY') {
            if (tx.budgetApplicationMode === 'divide') {
              // Transazioni annuali divise contribuiscono a tutti i mesi
              return true
            } else if (tx.budgetApplicationMode === 'specific') {
              // Verifica se il mese target corrisponde
              if (tx.budgetTargetMonth === monthIndex) {
                return true
              }
            } else {
              // Fallback: verifica il mese della startDate
              const startDate = new Date(tx.startDate)
              if (startDate.getMonth() === monthIndex) {
                return true
              }
            }
          } else if (tx.frequency === 'ONE_TIME') {
            // Verifica se la one-time è nello stesso mese
            const startDate = new Date(tx.startDate)
            if (startDate.getMonth() === monthIndex && startDate.getFullYear() === currentYear) {
              return true
            }
          }
        }
        
        return false
      } catch (error) {
        console.error('Errore nel controllo altre transazioni:', error)
        return false
      }
    }
    
    // Rimuovi dal budgeting con controllo delle altre transazioni
    const budgetUpdates = await removeTransactionFromBudget(
      transaction, 
      { year: currentYear, mode, targetMonth }, 
      subcats,
      checkOtherActiveTransactions
    )
    
    // Applica le rimozioni (usa accumulo con valori negativi)
    await batchAccumulateBudgetsService(req.user.id, budgetUpdates)
    
    // Aggiorna la transazione pianificata
    const updated = await updatePlannedTransactionService(req.user.id, req.params.id, {
      appliedToBudget: false
    })
    
    res.json({ 
      message: 'Transazione rimossa dal budgeting con successo', 
      transaction: updated,
      budgetUpdates: budgetUpdates.length
    })
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Attiva/Disattiva transazione pianificata
 */
export async function toggleActive(req, res, next) {
  try {
    const { id } = req.params
    const { isActive } = req.body
    
    // Validazione input
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive deve essere un booleano' })
    }
    
    // Importa la nuova funzione dal service
    const { togglePlannedTransactionActive } = await import('../services/plannedTransactionService.js')
    
    const transaction = await togglePlannedTransactionActive(
      req.user.id, 
      id, 
      isActive
    )
    
    res.json({
      message: isActive ? 'Transazione riattivata con successo' : 'Transazione disattivata con successo',
      transaction
    })
  } catch (error) {
    next(error)
  }
}
