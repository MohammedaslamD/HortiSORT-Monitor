import { execSync } from 'child_process'
import { config } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// server/ root is two levels above src/__tests__/
const serverRoot = path.resolve(__dirname, '../..')

export async function setup() {
  // Load .env.test so DATABASE_URL points to hortisort_test for the migration command
  config({ path: path.resolve(serverRoot, '.env.test') })
  // Run migrations on test DB
  execSync('npx prisma migrate deploy', { stdio: 'inherit', cwd: serverRoot })
}

export async function teardown() {
  // Nothing to clean up globally
}
