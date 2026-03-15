import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../app.ts'
import { prisma, truncateAll } from './helpers.ts'

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
      machine_code: 'HS-MH-001',
      machine_name: 'History Test Machine',
      model: 'HS-300',
      serial_number: 'SN-MH-001',
      customer_id: customerId,
      engineer_id: engineerId,
      location: 'Warehouse C',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      grading_features: 'Color',
      num_lanes: 3,
      software_version: 'v3.0.0',
      installation_date: new Date('2023-01-01'),
      status: 'running',
      last_updated_by: adminId,
    },
  })
  machineId = machine.id

  adminToken = await loginAs('admin@test.com')
})

afterAll(async () => {
  await prisma.$disconnect()
})

// -------------------------------------------------------------------------
// GET /machine-history/:machineId
// -------------------------------------------------------------------------

it('GET /machine-history/:id - returns history entries ordered by created_at desc', async () => {
  await prisma.machineHistory.create({
    data: {
      machine_id: machineId,
      change_type: 'status_change',
      old_value: 'idle',
      new_value: 'running',
      changed_by: adminId,
      notes: 'Started production',
    },
  })

  await prisma.machineHistory.create({
    data: {
      machine_id: machineId,
      change_type: 'location_change',
      old_value: 'Warehouse A',
      new_value: 'Warehouse C',
      changed_by: adminId,
    },
  })

  const res = await request(app)
    .get(`/api/v1/machine-history/${machineId}`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const history = res.body.data as Array<{ change_type: string; created_at: string }>
  expect(history).toHaveLength(2)
  // Should be ordered desc — later entry first
  expect(new Date(history[0].created_at).getTime()).toBeGreaterThanOrEqual(
    new Date(history[1].created_at).getTime(),
  )
})

it('GET /machine-history/:id - returns empty array for machine with no history', async () => {
  const res = await request(app)
    .get(`/api/v1/machine-history/${machineId}`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  expect(res.body.data).toHaveLength(0)
})

it('GET /machine-history/:id - unauthenticated returns 401', async () => {
  const res = await request(app).get(`/api/v1/machine-history/${machineId}`)
  expect(res.status).toBe(401)
})
