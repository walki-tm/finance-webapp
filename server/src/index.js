import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/categories.js'
import transactionRoutes from './routes/transactions.js'
import plannedTransactionRoutes from './routes/plannedTransactions.js'
import budgetRoutes from './routes/budgets.js'
import loanRoutes from './routes/loanRoutes.js'
import savingsGoalsRoutes from './routes/savingsGoals.js'
import balanceRoutes from './routes/balance.js'
import userSettingsRoutes from './routes/userSettings.js'
import accountRoutes from './routes/accounts.js'
import transferRoutes from './routes/transfers.js'
import { errorMiddleware } from './middleware/error.js'
import { debugMiddleware } from '../debug_middleware.js'
import './services/schedulerService.js' // Inizializza scheduler automatico

const app = express()

app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(debugMiddleware) // Debug middleware per tracciare chiamate API

// 🔧 FIX CORS: Gestore esplicito per richieste OPTIONS preflight
app.options('*', (req, res) => {
  const allowOrigin = process.env.CORS_ORIGIN || '*'
  const origins = allowOrigin.split(',')
  const origin = req.headers.origin
  
  if (allowOrigin === '*' || origins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*')
  }
  
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, X-Requested-With')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.header('Access-Control-Max-Age', '86400') // 24 ore di cache per preflight
  
  res.status(200).end()
})

const allowOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({ 
  origin: allowOrigin.split(','), 
  credentials: true,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With']
}))
app.use(morgan('dev'))

// health
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// public
app.use('/api/auth', authRoutes)

// protected
app.use('/api/categories', categoryRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/planned-transactions', plannedTransactionRoutes)
app.use('/api/budgets', budgetRoutes)
app.use('/api/loans', loanRoutes)
app.use('/api/savings-goals', savingsGoalsRoutes)
app.use('/api/accounts', accountRoutes)
app.use('/api/transfers', transferRoutes)
app.use('/api/balance', balanceRoutes)
app.use('/api/user-settings', userSettingsRoutes)

app.use(errorMiddleware)

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`API listening on :${port}`)
})
