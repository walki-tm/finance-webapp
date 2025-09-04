import express from 'express'
import {
  getDashboardCategoriesVisibility,
  updateDashboardCategoriesVisibility,
  getVisibleDashboardCategories
} from '../controllers/dashboardCategoryController.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

// Applica autenticazione a tutte le rotte
router.use(authRequired)

// GET /api/dashboard-categories - Ottieni tutte le impostazioni di visibilità
router.get('/', getDashboardCategoriesVisibility)

// GET /api/dashboard-categories/visible - Ottieni solo le categorie visibili
router.get('/visible', getVisibleDashboardCategories)

// PUT /api/dashboard-categories - Aggiorna le impostazioni di visibilità
router.put('/', updateDashboardCategoriesVisibility)

export default router
