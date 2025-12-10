/**
 * 📄 CATEGORIES CONTROLLER: Gestione categorie e sottocategorie
 * 
 * 🎯 Scopo: Gestisce CRUD operations per categorie principali e sottocategorie
 * 
 * 🔧 Dipendenze principali:
 * - Zod per validazione input
 * - categoryService per business logic
 * 
 * 📝 Note:
 * - Le categorie main sono sempre UPPERCASE
 * - Supporta icone e colori personalizzati
 * - Gestisce visibilità delle categorie
 * 
 * @author Finance WebApp Team
 * @modified 19 Gennaio 2025 - Aggiunta documentazione e migliorata struttura
 */

// 🔸 Import dependencies
import { z } from 'zod'

// 🔸 Import services
import {
  getCategories as getCategoriesService,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  createSubcategory as createSubcategoryService,
  updateSubcategory as updateSubcategoryService,
  deleteCategory as deleteCategoryService,
  deleteSubcategory as deleteSubcategoryService,
  reorderSubcategories as reorderSubcategoriesService,
  transferTransactionsBatch as transferTransactionsBatchService,
} from '../services/categoryService.js'

// 🔸 Validation schemas per categorie
const categorySchema = z.object({
  main: z.string().min(1, 'Categoria main richiesta').max(32, 'Categoria main troppo lunga').transform(s => s.toUpperCase()),
  name: z.string().min(1, 'Nome categoria richiesto').max(80, 'Nome categoria troppo lungo'),
  iconKey: z.string().optional().nullable(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Colore deve essere in formato esadecimale (#RRGGBB)').optional().nullable(),
  visible: z.boolean().optional(),
})

const categoryPatchSchema = z.object({
  name: z.string().min(1, 'Nome categoria richiesto').max(80, 'Nome categoria troppo lungo').optional(),
  iconKey: z.string().nullable().optional(),
  colorHex: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Colore deve essere in formato esadecimale (#RRGGBB)').nullable().optional(),
  visible: z.boolean().optional(),
})

// 🔸 Validation schemas per sottocategorie
const subcategorySchema = z.object({
  categoryId: z.string().min(1, 'ID categoria richiesto'),
  name: z.string().min(1, 'Nome sottocategoria richiesto').max(80, 'Nome sottocategoria troppo lungo'),
  iconKey: z.string().optional().nullable()
})

const subcategoryPatchSchema = z.object({
  name: z.string().min(1, 'Nome sottocategoria richiesto').max(80, 'Nome sottocategoria troppo lungo').optional(),
  iconKey: z.string().nullable().optional(),
  sortOrder: z.number().int().min(0).optional(),
})

const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), sortOrder: z.number().int().min(0) })).min(1)
})

// 🔸 Validation schema per batch transfer
const batchTransferSchema = z.object({
  sourceSubcategoryId: z.string().min(1, 'ID sottocategoria di origine richiesto'),
  targetSubcategoryId: z.string().min(1, 'ID sottocategoria di destinazione richiesto'),
}).refine((data) => data.sourceSubcategoryId !== data.targetSubcategoryId, {
  message: 'Le sottocategorie di origine e destinazione devono essere diverse',
  path: ['targetSubcategoryId']
})

/**
 * 🎯 CONTROLLER: Lista tutte le categorie dell'utente
 * 
 * Recupera tutte le categorie principali e sottocategorie associate all'utente.
 * Include informazioni su visibilità, colori e icone.
 * 
 * @param {Request} req - Express request (user.id dal middleware auth)
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function listCategories(req, res, next) {
  try {
    // 🔸 Recupera categorie dal service
    const categories = await getCategoriesService(req.user.id)
    
    // 🔸 Risposta con lista categorie
    res.json(categories)
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Crea nuova categoria principale
 * 
 * Crea una nuova categoria principale con validazione completa.
 * La categoria main viene automaticamente convertita in maiuscolo.
 * 
 * @param {Request} req - Express request con { main, name, iconKey?, colorHex?, visible? }
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function createCategory(req, res, next) {
  // 🔸 Validazione input
  const parsed = categorySchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message).join(', ')
    return res.status(400).json({ 
      error: 'Dati categoria non validi',
      details: errors
    })
  }
  
  try {
    // 🔸 Business logic
    const created = await createCategoryService(req.user.id, parsed.data)
    
    // 🔸 Risposta categoria creata
    res.status(201).json(created)
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Aggiorna categoria esistente
 * 
 * Aggiorna i dati di una categoria esistente dell'utente.
 * Supporta aggiornamenti parziali.
 * 
 * @param {Request} req - Express request con params.id e body opzionale
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function updateCategory(req, res, next) {
  // 🔸 Validazione input
  const parsed = categoryPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message).join(', ')
    return res.status(400).json({ 
      error: 'Dati aggiornamento non validi',
      details: errors
    })
  }
  
  try {
    // 🔸 Business logic
    const updated = await updateCategoryService(req.user.id, req.params.id, parsed.data)
    
    // 🔸 Risposta categoria aggiornata
    res.json(updated)
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Crea nuova sottocategoria
 * 
 * Crea una nuova sottocategoria associata a una categoria principale esistente.
 * Verifica che la categoria principale appartenga all'utente.
 * 
 * @param {Request} req - Express request con { categoryId, name, iconKey? }
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function createSubcategory(req, res, next) {
  // 🔸 Validazione input
  const parsed = subcategorySchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message).join(', ')
    return res.status(400).json({ 
      error: 'Dati sottocategoria non validi',
      details: errors
    })
  }
  
  try {
    // 🔸 Estrazione dati
    const { categoryId, ...rest } = parsed.data
    
    // 🔸 Business logic
    const created = await createSubcategoryService(req.user.id, categoryId, rest)
    
    // 🔸 Risposta sottocategoria creata
    res.status(201).json(created)
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Aggiorna sottocategoria esistente
 * 
 * Aggiorna i dati di una sottocategoria esistente dell'utente.
 * Supporta aggiornamenti parziali.
 * 
 * @param {Request} req - Express request con params.id e body opzionale
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function updateSubcategory(req, res, next) {
  // 🔸 Validazione input
  const parsed = subcategoryPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message).join(', ')
    return res.status(400).json({ 
      error: 'Dati aggiornamento non validi',
      details: errors
    })
  }
  
  try {
    // 🔸 Business logic
    const updated = await updateSubcategoryService(req.user.id, req.params.id, parsed.data)
    
    // 🔸 Risposta sottocategoria aggiornata
    res.json(updated)
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Elimina categoria principale
 * 
 * Elimina una categoria principale e tutte le sue sottocategorie.
 * Aggiorna le transazioni rimuovendo i riferimenti alle sottocategorie eliminate.
 * 
 * @param {Request} req - Express request con params.id
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function deleteCategory(req, res, next) {
  try {
    // 🔸 Business logic (gestisce anche sottocategorie e transazioni)
    await deleteCategoryService(req.user.id, req.params.id)
    
    // 🔸 Risposta no content
    res.status(204).end()
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Elimina sottocategoria
 * 
 * Elimina una sottocategoria specifica.
 * Aggiorna le transazioni rimuovendo i riferimenti alla sottocategoria eliminata.
 * 
 * @param {Request} req - Express request con params.id
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next function
 */
export async function deleteSubcategory(req, res, next) {
  try {
    // 🔸 Business logic (gestisce anche transazioni)
    await deleteSubcategoryService(req.user.id, req.params.id)
    
    // 🔸 Risposta no content
    res.status(204).end()
  } catch (e) { 
    next(e) 
  }
}

/**
 * 🎯 CONTROLLER: Riordina sottocategorie (batch)
 */
export async function reorderSubcategories(req, res, next) {
  const parsed = reorderSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message).join(', ')
    return res.status(400).json({ error: 'Dati reorder non validi', details: errors })
  }
  try {
    const { items } = parsed.data
    await reorderSubcategoriesService(req.user.id, items)
    res.status(204).end()
  } catch (e) {
    next(e)
  }
}

/**
 * 🎯 CONTROLLER: Trasferisce in batch tutte le transazioni da una sottocategoria ad un'altra
 * 
 * Questa funzione permette di spostare tutte le transazioni (normali e pianificate)
 * da una sottocategoria di origine ad una di destinazione in una singola operazione atomica.
 * Utile per riorganizzare le categorie o correggere errori di categorizzazione di massa.
 * 
 * @param {Request} req - Express request con { sourceSubcategoryId, targetSubcategoryId }
 * @param {Response} res - Express response con dettagli del trasferimento
 * @param {NextFunction} next - Express next function
 * 
 * @returns {Object} {
 *   transferred: number,           // Numero transazioni trasferite
 *   plannedTransferred: number,    // Numero transazioni pianificate trasferite  
 *   source: { id, name, category }, // Sottocategoria origine
 *   target: { id, name, category }  // Sottocategoria destinazione
 * }
 */
export async function batchTransferTransactions(req, res, next) {
  // 🔸 Validazione input
  const parsed = batchTransferSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => e.message).join(', ')
    return res.status(400).json({ 
      error: 'Dati trasferimento non validi',
      details: errors
    })
  }
  
  try {
    // 🔸 Business logic
    const { sourceSubcategoryId, targetSubcategoryId } = parsed.data
    const result = await transferTransactionsBatchService(
      req.user.id, 
      sourceSubcategoryId, 
      targetSubcategoryId
    )
    
    // 🔸 Risposta con dettagli trasferimento
    res.json({
      success: true,
      message: `Trasferite ${result.transferred} transazioni e ${result.plannedTransferred} transazioni pianificate`,
      transferred: result.transferred,
      plannedTransferred: result.plannedTransferred,
      source: {
        id: result.source.id,
        name: result.source.name,
        categoryName: result.source.Category.name
      },
      target: {
        id: result.target.id,
        name: result.target.name,
        categoryName: result.target.Category.name
      }
    })
  } catch (e) { 
    next(e) 
  }
}
