import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../app.ts'
import { prisma, truncateAll } from './helpers.ts'
import { logActivity } from '../services/activityLogService.ts'

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

async function createUser(
  overrides: Partial<{
    name: string
    email: string
    role: 'customer' | 'engineer' | 'admin'
  }> = {},
) {
  const hash = await bcrypt.hash('password_123', 12)
  return prisma.user.create({
    data: {
      name: overrides.name ?? 'Test User',
      email: overrides.email ?? `user_${Date.now()}@test.com`,
      phone: '0000000000',
      password_hash: hash,
      role: overrides.role ?? 'admin',
    },
  })
}

async function loginAs(email: string): Promise<string> {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password: 'password_123' })
  return (res.body.data as { accessToken: string }).accessToken
}

// -------------------------------------------------------------------------
// Test state
// -------------------------------------------------------------------------

let adminId: number
let customerId: number
let engineerId: number
let machineId: number
let adminToken: string
let customerToken: string
let engineerToken: string

beforeEach(async () => {
  await truncateAll()

  const admin = await createUser({ name: 'Admin', email: 'admin@test.com', role: 'admin' })
  const customer = await createUser({ name: 'Customer', email: 'customer@test.com', role: 'customer' })
  const engineer = await createUser({ name: 'Engineer', email: 'engineer@test.com', role: 'engineer' })

  adminId = admin.id
  customerId = customer.id
  engineerId = engineer.id

  const machine = await prisma.machine.create({
    data: {
      machine_code: 'HS-AL-001',
      machine_name: 'ActivityLog Test Machine',
      model: 'HS-200',
      serial_number: 'SN-AL-001',
      customer_id: customerId,
      engineer_id: engineerId,
      location: 'Warehouse D',
      city: 'Chennai',
      state: 'Tamil Nadu',
      country: 'India',
      grading_features: 'Weight',
      num_lanes: 1,
      software_version: 'v1.5.0',
      installation_date: new Date('2022-06-15'),
      status: 'down',
      last_updated_by: adminId,
    },
  })
  machineId = machine.id

  // Seed an activity log entry
  await prisma.activityLog.create({
    data: {
      user_id: adminId,
      action: 'Updated machine status',
      entity_type: 'machine',
      entity_id: machineId,
      details: 'Status changed to down',
    },
  })

  adminToken = await loginAs('admin@test.com')
  customerToken = await loginAs('customer@test.com')
  engineerToken = await loginAs('engineer@test.com')
})

afterAll(async () => {
  await prisma.$disconnect()
})

// -------------------------------------------------------------------------
// GET /activity-log
// -------------------------------------------------------------------------

it('GET /activity-log - admin sees activity log entries', async () => {
  const res = await request(app)
    .get('/api/v1/activity-log')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const entries = res.body.data as Array<{ action: string }>
  expect(entries.length).toBeGreaterThanOrEqual(1)
  expect(entries[0].action).toBe('Updated machine status')
})

it('GET /activity-log - engineer is forbidden (403)', async () => {
  const res = await request(app)
    .get('/api/v1/activity-log')
    .set('Authorization', `Bearer ${engineerToken}`)
  expect(res.status).toBe(403)
})

it('GET /activity-log - customer is forbidden (403)', async () => {
  const res = await request(app)
    .get('/api/v1/activity-log')
    .set('Authorization', `Bearer ${customerToken}`)
  expect(res.status).toBe(403)
})

it('GET /activity-log - unauthenticated returns 401', async () => {
  const res = await request(app).get('/api/v1/activity-log')
  expect(res.status).toBe(401)
})

// -------------------------------------------------------------------------
// logActivity helper
// -------------------------------------------------------------------------

it('logActivity - inserts a row into activity_log', async () => {
  logActivity(adminId, 'test_action', 'user', adminId, 'test details')

  // Give the fire-and-forget a tick to complete
  await new Promise((r) => setTimeout(r, 50))

  const rows = await prisma.activityLog.findMany({
    where: { user_id: adminId, action: 'test_action' },
  })
  expect(rows).toHaveLength(1)
  expect(rows[0].action).toBe('test_action')
  expect(rows[0].entity_type).toBe('user')
  expect(rows[0].details).toBe('test details')
})
