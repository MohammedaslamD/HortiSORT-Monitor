// Load .env BEFORE any other import so DATABASE_URL and JWT_SECRET are
// available when app.ts / config/env.ts / prisma.ts are first imported.
import 'dotenv/config'

import { createServer } from 'http'
import { Server } from 'socket.io'
import { app } from './app.ts'
import { env } from './config/env.ts'
import { setIo } from './socket/index.ts'

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: { origin: /^http:\/\/localhost(:\d+)?$/, credentials: true },
})

// Handle Socket.io room joins
io.on('connection', (socket) => {
  socket.on('join:machine', (machineId: number) => {
    void socket.join(`machine:${machineId}`)
  })
  socket.on('join:all-machines', () => {
    void socket.join('all-machines')
  })
})

setIo(io)

httpServer.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`)
})
