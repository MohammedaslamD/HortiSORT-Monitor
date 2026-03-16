import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const serverRoot = path.resolve(__dirname, '../..')

// Load .env.test before any module (including PrismaClient singletons) is imported.
// This runs in each worker fork via vitest setupFiles, ensuring DATABASE_URL
// points to hortisort_test before PrismaClient is instantiated.
config({ path: path.resolve(serverRoot, '.env.test'), override: true })
