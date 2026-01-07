/**
 * 📄 USER SETTINGS CONTROLLER: Gestione impostazioni utente
 * 
 * 🎯 Scopo: Gestisce impostazioni personalizzabili dell'utente per dashboard
 * 
 * 🔧 Dipendenze principali:
 * - Zod per validazione input
 * - userSettingsService per business logic
 * 
 * 📝 Note:
 * - Gestisce visibilità categorie nel dashboard
 * - Supporta selezione max 4 categorie principali
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creazione iniziale
 */

import { z } from 'zod'
import {
  getUserSettings as getUserSettingsService,
  updateUserSettings as updateUserSettingsService,
} from '../services/userSettingsService.js'

// 🔸 Validation schemas
const dashboardSettingsSchema = z.object({
  visibleMainCategories: z.array(z.string().min(1).max(32).transform(s => s.toUpperCase()))
    .max(4, 'Puoi selezionare massimo 4 categorie')
    .min(1, 'Devi selezionare almeno una categoria')
    .optional(),
})

const themeSchema = z.object({
  theme: z.enum(['light', 'dark'], { 
    errorMap: () => ({ message: 'Il tema deve essere "light" o "dark"' }) 
  })
})

/**
 * 🎯 CONTROLLER: Ottieni impostazioni utente
 */
export async function getUserSettings(req, res, next) {
  try {
    const settings = await getUserSettingsService(req.user.id)
    res.json(settings)
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Aggiorna impostazioni dashboard
 */
export async function updateDashboardSettings(req, res, next) {
  const parsed = dashboardSettingsSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Invalid settings', 
      details: parsed.error.errors 
    })
  }

  try {
    const updatedSettings = await updateUserSettingsService(req.user.id, {
      dashboardSettings: parsed.data
    })
    
    res.json({
      message: 'Impostazioni dashboard aggiornate con successo',
      settings: updatedSettings
    })
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Aggiorna tema UI utente
 */
export async function updateTheme(req, res, next) {
  const parsed = themeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Tema non valido', 
      details: parsed.error.errors 
    })
  }

  try {
    const { prisma } = await import('../lib/prisma.js')
    
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { theme: parsed.data.theme },
      select: { 
        id: true, 
        email: true, 
        name: true, 
        theme: true 
      }
    })
    
    res.json({
      message: `Tema aggiornato a ${parsed.data.theme}`,
      user: updatedUser
    })
  } catch (e) { next(e) }
}

/**
 * 🎯 CONTROLLER: Aggiorna visibilità categoria
 */
export async function updateCategoryVisibility(req, res, next) {
  const { main, visible } = req.body
  
  if (!main || typeof visible !== 'boolean') {
    return res.status(400).json({ 
      error: 'main e visible sono richiesti' 
    })
  }

  try {
    const { updateCategoryVisibility } = await import('../services/categoryService.js')
    const updatedCategory = await updateCategoryVisibility(req.user.id, main.toUpperCase(), visible)
    
    res.json({
      message: `Categoria ${visible ? 'attivata' : 'disattivata'} con successo`,
      category: updatedCategory
    })
  } catch (e) { next(e) }
}
