/**
 * 📄 BUDGETS CONTROLLER: Gestione budget mensili
 * 
 * 🎯 Scopo: Gestisce CRUD operations per budget di categorie e sottocategorie
 * 
 * 🔧 Dipendenze principali:
 * - Zod per validazione input
 * - budgetService per business logic
 * 
 * 📝 Note:
 * - I budget sono organizzati per periodo (YYYY-MM)
 * - Supporta diversi stili di budget (FIXED, PERCENT_OF_INCOME, etc.)
 * - Gestisce operazioni batch per impostare tutti i mesi
 * 
 * @author Finance WebApp Team
 * @created 19 Gennaio 2025 - Implementazione API backend per budgeting
 */

// 🔸 Import dependencies
import { z } from 'zod'

// 🔸 Import services
import {
  getBudgets as getBudgetsService,
  upsertBudget as upsertBudgetService,
  batchUpsertBudgets as batchUpsertBudgetsService,
  deleteBudget as deleteBudgetService,
  getBudgetsByCategory as getBudgetsByCategoryService,
} from '../services/budgetService.js'

// 🔸 Validation schemas per budget
const budgetSchema = z.object({
  main: z.string().min(1, 'Categoria main richiesta').max(32, 'Categoria main troppo lunga').transform(s => s.toUpperCase()),
  subcategoryId: z.string().optional().nullable(),
  period: z.string().regex(/^\d{4}-\d{2}$/, 'Periodo deve essere formato YYYY-MM'),
  amount: z.number().min(0, 'Amount deve essere positivo'),
  style: z.enum(['FIXED', 'PERCENT_OF_INCOME', 'ENVELOPE', 'ONE_OFF']).optional().default('FIXED'),
  pctOfIncome: z.number().min(0).max(100).optional().nullable(),
  rollover: z.boolean().optional().default(false),
  capType: z.enum(['SOFT', 'HARD']).optional().nullable(),
  notes: z.string().optional().nullable(),
  overrideChildren: z.boolean().optional().default(false),
  managedAutomatically: z.boolean().optional().default(false),
})

const batchBudgetSchema = z.object({
  budgets: z.array(budgetSchema).min(1, 'Almeno un budget richiesto')
})

const yearQuerySchema = z.object({
  year: z.string().regex(/^\d{4}$/, 'Anno deve essere formato YYYY').transform(s => parseInt(s, 10))
})

/**
 * 🎯 CONTROLLER: Lista tutti i budget dell'utente per un anno
 * 
 * Recupera tutti i budget dell'utente per l'anno specificato.
 * Se l'anno non è specificato, usa l'anno corrente.
 * 
 * @param {Request} req - Express request (user.id dal middleware auth, query.year)
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function listBudgets(req, res, next) {
  try {
    // 🔸 Validazione query params
    const currentYear = new Date().getFullYear()
    const year = req.query.year ? parseInt(req.query.year, 10) : currentYear
    
    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ 
        error: 'Anno non valido',
        details: 'Anno deve essere compreso tra 2000 e 2100'
      })
    }

    // 🔸 Recupera budget dal service
    const budgets = await getBudgetsService(req.user.id, year)
    
    // 🔸 Risposta con lista budget
    res.json(budgets)
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Upsert singolo budget
 * 
 * Crea o aggiorna un budget specifico per categoria/sottocategoria e periodo.
 * Se il budget esiste, viene aggiornato; altrimenti viene creato.
 * 
 * @param {Request} req - Express request con budget data
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function upsertBudget(req, res, next) {
  // 🔸 Validazione input
  const parsed = budgetSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message).join(', ')
    return res.status(400).json({ 
      error: 'Dati budget non validi',
      details: errors
    })
  }
  
  try {
    // 🔸 Business logic
    const budget = await upsertBudgetService(req.user.id, parsed.data)
    
    // 🔸 Risposta budget creato/aggiornato
    res.json(budget)
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Batch upsert di budget
 * 
 * Crea o aggiorna più budget in una singola operazione.
 * Utile per operazioni come "imposta tutti i mesi" o "reset a zero".
 * 
 * @param {Request} req - Express request con array di budget
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function batchUpsertBudgets(req, res, next) {
  // 🔸 Validazione input
  const parsed = batchBudgetSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message).join(', ')
    return res.status(400).json({ 
      error: 'Dati batch budget non validi',
      details: errors
    })
  }
  
  try {
    // 🔸 Business logic
    const budgets = await batchUpsertBudgetsService(req.user.id, parsed.data.budgets)
    
    // 🔸 Risposta budget creati/aggiornati
    res.json(budgets)
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Elimina budget
 * 
 * Elimina un budget specifico dell'utente.
 * 
 * @param {Request} req - Express request con params.id
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function deleteBudget(req, res, next) {
  try {
    // 🔸 Business logic
    await deleteBudgetService(req.user.id, req.params.id)
    
    // 🔸 Risposta no content
    res.status(204).end()
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Lista budget per categoria specifica
 * 
 * Recupera tutti i budget di una categoria principale per un anno.
 * 
 * @param {Request} req - Express request con params.main e query.year
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function getBudgetsByCategory(req, res, next) {
  try {
    // 🔸 Validazione parametri
    const main = req.params.main?.toUpperCase()
    if (!main) {
      return res.status(400).json({ 
        error: 'Categoria main richiesta'
      })
    }

    const currentYear = new Date().getFullYear()
    const year = req.query.year ? parseInt(req.query.year, 10) : currentYear
    
    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ 
        error: 'Anno non valido',
        details: 'Anno deve essere compreso tra 2000 e 2100'
      })
    }

    // 🔸 Recupera budget dal service
    const budgets = await getBudgetsByCategoryService(req.user.id, main, year)
    
    // 🔸 Risposta con budget della categoria
    res.json(budgets)
  } catch (e) { 
    next(e) 
  }
}
