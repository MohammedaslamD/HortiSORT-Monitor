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
      machine_code: 'HS-TEST-001',
      machine_name: 'Test Machine',
      model: 'HS-500',
      serial_number: 'SN-001',
      customer_id: customerId,
      engineer_id: engineerId,
      location: 'Warehouse A',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      grading_features: 'Size, Color',
      num_lanes: 4,
      software_version: 'v2.0.0',
      installation_date: new Date('2024-01-01'),
      status: 'running',
      last_updated_by: adminId,
    },
  })
  machineId = machine.id

  // Create a second machine for admin visibility test
  await prisma.machine.create({
    data: {
      machine_code: 'HS-TEST-002',
      machine_name: 'Test Machine 2',
      model: 'HS-300',
      serial_number: 'SN-002',
      customer_id: customerId,
      engineer_id: engineerId,
      location: 'Warehouse B',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      grading_features: 'Weight',
      num_lanes: 2,
      software_version: 'v1.0.0',
      installation_date: new Date('2023-06-01'),
      status: 'idle',
      last_updated_by: adminId,
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
// GET /machines
// -------------------------------------------------------------------------

it('GET /machines - admin sees all machines', async () => {
  const res = await request(app)
    .get('/api/v1/machines')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  expect(res.body.data).toHaveLength(2)
})

it('GET /machines - customer sees only their machines', async () => {
  const res = await request(app)
    .get('/api/v1/machines')
    .set('Authorization', `Bearer ${customerToken}`)
  expect(res.status).toBe(200)
  // Both machines belong to this customer
  expect(res.body.data).toHaveLength(2)
  ;(res.body.data as Array<{ customer_id: number }>).forEach((m) => {
    expect(m.customer_id).toBe(customerId)
  })
})

it('GET /machines - unauthenticated returns 401', async () => {
  const res = await request(app).get('/api/v1/machines')
  expect(res.status).toBe(401)
})

it('GET /machines - filter by status returns matching machines', async () => {
  const res = await request(app)
    .get('/api/v1/machines?status=running')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const machines = res.body.data as Array<{ status: string }>
  expect(machines.length).toBeGreaterThan(0)
  machines.forEach((m) => expect(m.status).toBe('running'))
})

// -------------------------------------------------------------------------
// GET /machines/stats
// -------------------------------------------------------------------------

it('GET /machines/stats - returns status counts', async () => {
  const res = await request(app)
    .get('/api/v1/machines/stats')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const stats = res.body.data as {
    running: number
    idle: number
    down: number
    offline: number
    total: number
  }
  expect(stats.running).toBe(1)
  expect(stats.idle).toBe(1)
  expect(stats.total).toBe(2)
})

// -------------------------------------------------------------------------
// GET /machines/:id
// -------------------------------------------------------------------------

it('GET /machines/:id - returns machine with relations', async () => {
  const res = await request(app)
    .get(`/api/v1/machines/${machineId}`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const machine = res.body.data as { id: number; customer: { name: string }; engineer: { name: string } }
  expect(machine.id).toBe(machineId)
  expect(machine.customer.name).toBe('Customer')
  expect(machine.engineer.name).toBe('Engineer')
})

it('GET /machines/:id - non-existent machine returns 404', async () => {
  const res = await request(app)
    .get('/api/v1/machines/99999')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(404)
})

// -------------------------------------------------------------------------
// PATCH /machines/:id/status
// -------------------------------------------------------------------------

it('PATCH /machines/:id/status - engineer can update status', async () => {
  const res = await request(app)
    .patch(`/api/v1/machines/${machineId}/status`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({ status: 'down' })
  expect(res.status).toBe(200)
  expect((res.body.data as { status: string }).status).toBe('down')
})

it('PATCH /machines/:id/status - customer cannot update status (403)', async () => {
  const res = await request(app)
    .patch(`/api/v1/machines/${machineId}/status`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ status: 'down' })
  expect(res.status).toBe(403)
})

it('PATCH /machines/:id/status - invalid status returns 400', async () => {
  const res = await request(app)
    .patch(`/api/v1/machines/${machineId}/status`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ status: 'broken' })
  expect(res.status).toBe(400)
})

// -------------------------------------------------------------------------
// Machine history auto-recording
// -------------------------------------------------------------------------

it('PATCH /machines/:id/status - creates a machine history record', async () => {
  await request(app)
    .patch(`/api/v1/machines/${machineId}/status`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({ status: 'idle' })

  const history = await prisma.machineHistory.findMany({
    where: { machine_id: machineId, change_type: 'status_change' },
  })
  expect(history).toHaveLength(1)
  expect(history[0].old_value).toBe('running')
  expect(history[0].new_value).toBe('idle')
  expect(history[0].changed_by).toBe(engineerId)
})

// -------------------------------------------------------------------------
// Activity log on machine status update
// -------------------------------------------------------------------------

it('PATCH /machines/:id/status - writes an activity log entry', async () => {
  await request(app)
    .patch(`/api/v1/machines/${machineId}/status`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({ status: 'idle' })

  await new Promise((r) => setTimeout(r, 50))

  const logs = await prisma.activityLog.findMany({
    where: { entity_type: 'machine', entity_id: machineId },
  })
  expect(logs.length).toBeGreaterThanOrEqual(1)
  expect(logs[0].action).toBe('status_updated')
})
