import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middleware/errorHandler.ts'
import { authRouter } from './routes/auth.ts'
import { machinesRouter } from './routes/machines.ts'
import { dailyLogsRouter } from './routes/dailyLogs.ts'
import { ticketsRouter } from './routes/tickets.ts'
import { ticketCommentsRouter } from './routes/ticketComments.ts'
import { siteVisitsRouter } from './routes/siteVisits.ts'
import { machineHistoryRouter } from './routes/machineHistory.ts'
import { activityLogRouter } from './routes/activityLog.ts'
import { usersRouter } from './routes/users.ts'
import { productionSessionsRouter } from './routes/productionSessions.ts'
import { machineErrorsRouter } from './routes/machineErrors.ts'

export const app = express()

// -------------------------------------------------------------------------
// Global middleware
// -------------------------------------------------------------------------
app.use(cors({ origin: /^http:\/\/localhost(:\d+)?$/, credentials: true }))
app.use(express.json())
app.use(cookieParser())

// -------------------------------------------------------------------------
// Routes
// -------------------------------------------------------------------------
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/machines', machinesRouter)
app.use('/api/v1/daily-logs', dailyLogsRouter)
app.use('/api/v1/tickets', ticketsRouter)
app.use('/api/v1/tickets/:id/comments', ticketCommentsRouter)
app.use('/api/v1/site-visits', siteVisitsRouter)
app.use('/api/v1/machine-history', machineHistoryRouter)
app.use('/api/v1/activity-log', activityLogRouter)
app.use('/api/v1/users', usersRouter)
app.use('/api/v1/production-sessions', productionSessionsRouter)
app.use('/api/v1/machine-errors', machineErrorsRouter)

// -------------------------------------------------------------------------
// Error handler (must be last)
// -------------------------------------------------------------------------
app.use(errorHandler)
