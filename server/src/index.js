import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import authRoutes from './routes/auth.js'
import categoryRoutes from './routes/categories.js'
import transactionRoutes from './routes/transactions.js'
import budgetRoutes from './routes/budgets.js'
import { errorMiddleware } from './middleware/error.js'

const app = express()

app.use(helmet())
app.use(express.json({ limit: '1mb' }))

const allowOrigin = process.env.CORS_ORIGIN || '*'
app.use(cors({ origin: allowOrigin.split(','), credentials: true }))
app.use(morgan('dev'))

// health
app.get('/api/health', (_req, res) => res.json({ ok: true }))

// public
app.use('/api/auth', authRoutes)

// protected
app.use('/api/categories', categoryRoutes)
app.use('/api/transactions', transactionRoutes)
app.use('/api/budgets', budgetRoutes)

app.use(errorMiddleware)

const port = process.env.PORT || 3001
app.listen(port, () => {
  console.log(`API listening on :${port}`)
})
