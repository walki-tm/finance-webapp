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

// 🔸 Validation schemas
const plannedTxSchema = z.object({
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()),
  subId: z.string().optional().nullable(),
  subName: z.string().optional().nullable(),
  amount: z.coerce.number(),
  note: z.string().optional().nullable(),
  payee: z.string().optional().nullable(),
  frequency: z.enum(['MONTHLY', 'YEARLY', 'ONE_TIME']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional().nullable(),
  confirmationMode: z.enum(['MANUAL', 'AUTOMATIC']).default('MANUAL'),
  groupId: z.string().optional().nullable(),
})

const plannedTxPatchSchema = z.object({
  main: z.string().min(1).max(32).transform(s => s.toUpperCase()).optional(),
  subId: z.string().nullable().optional(),
  subName: z.string().nullable().optional(),
  amount: z.number().optional(),
  note: z.string().nullable().optional(),
  payee: z.string().nullable().optional(),
  frequency: z.enum(['MONTHLY', 'YEARLY', 'ONE_TIME']).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().nullable().optional(),
  confirmationMode: z.enum(['MANUAL', 'AUTOMATIC']).optional(),
  groupId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
})

const groupSchema = z.object({
  name: z.string().min(1).max(255),
  sortOrder: z.number().optional(),
})

const groupPatchSchema = z.object({
  name: z.string().min(1).max(255).optional(),
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
  const parsed = plannedTxSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid body', details: parsed.error.errors })
  try {
    const created = await createPlannedTransactionService(req.user.id, parsed.data)
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
