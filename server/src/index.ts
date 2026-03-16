// Load .env BEFORE any other import so DATABASE_URL and JWT_SECRET are
// available when app.ts / config/env.ts / prisma.ts are first imported.
import 'dotenv/config'

import { app } from './app.ts'
import { env } from './config/env.ts'

app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT} (${env.NODE_ENV})`)
})
