import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middleware/errorHandler.ts'
import { authRouter } from './routes/auth.ts'
import { machinesRouter } from './routes/machines.ts'
import { dailyLogsRouter } from './routes/dailyLogs.ts'

export const app = express()

// -------------------------------------------------------------------------
// Global middleware
// -------------------------------------------------------------------------
app.use(cors({ origin: 'http://localhost:3000', credentials: true }))
app.use(express.json())
app.use(cookieParser())

// -------------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------------
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/machines', machinesRouter)
app.use('/api/v1/daily-logs', dailyLogsRouter)

// -------------------------------------------------------------------------
// Error handler (must be last)
// -------------------------------------------------------------------------
app.use(errorHandler)
