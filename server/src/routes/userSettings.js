/**
 * 📄 USER SETTINGS ROUTES: Route definitions per impostazioni utente
 * 
 * 🎯 Scopo: Definisce gli endpoint REST per impostazioni personalizzabili utente
 * 
 * 🔧 Dipendenze principali:
 * - Express Router
 * - Auth middleware
 * - userSettingsController
 * 
 * @author Finance WebApp Team
 * @modified 3 Settembre 2025 - Creazione iniziale
 */

import { Router } from 'express'
import { authRequired } from '../middleware/auth.js'
import {
  getUserSettings,
  updateDashboardSettings,
  updateCategoryVisibility,
  updateTheme,
} from '../controllers/userSettingsController.js'

const router = Router()
router.use(authRequired)

// 🔸 Routes per impostazioni generali
router.get('/', getUserSettings)

// 🔸 Routes per impostazioni dashboard
router.put('/dashboard', updateDashboardSettings)

// 🔸 Routes per visibilità categorie
router.patch('/category-visibility', updateCategoryVisibility)

// 🔸 Routes per tema UI
router.patch('/theme', updateTheme)

export default router
