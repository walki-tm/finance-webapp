/**
 * 📊 DASHBOARD ROUTES
 * 
 * Routes per statistiche dashboard e KPI
 */

import express from 'express'
import { 
  getKPIStats,
  getAllocationsDetail,
  getSavingsDetail 
} from '../controllers/dashboardController.js'
import { authRequired } from '../middleware/auth.js'

const router = express.Router()

// 📊 GET /api/dashboard/kpi - Statistiche KPI principali
router.get('/kpi', authRequired, getKPIStats)

// 📦 GET /api/dashboard/allocations-detail - Dettaglio accantonamenti
router.get('/allocations-detail', authRequired, getAllocationsDetail)

// 💰 GET /api/dashboard/savings-detail - Dettaglio risparmio
router.get('/savings-detail', authRequired, getSavingsDetail)

export default router
