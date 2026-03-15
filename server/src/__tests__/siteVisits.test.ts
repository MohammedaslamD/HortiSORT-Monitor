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
      machine_code: 'HS-SV-001',
      machine_name: 'SiteVisit Test Machine',
      model: 'HS-500',
      serial_number: 'SN-SV-001',
      customer_id: customerId,
      engineer_id: engineerId,
      location: 'Warehouse B',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      grading_features: 'Size',
      num_lanes: 2,
      software_version: 'v1.0.0',
      installation_date: new Date('2024-06-01'),
      status: 'idle',
      last_updated_by: adminId,
    },
  })
  machineId = machine.id

  adminToken = await loginAs('admin@test.com')
  customerToken = await loginAs('customer@test.com')
  engineerToken = await loginAs('engineer@test.com')
})

afterAll(async () => {
  await prisma.$disconnect()
})

// -------------------------------------------------------------------------
// GET /site-visits
// -------------------------------------------------------------------------

it('GET /site-visits - engineer sees only their own visits', async () => {
  // Seed one visit for engineer, one for a different engineer
  const otherEngineer = await createUser({
    name: 'Other Engineer',
    email: 'other@test.com',
    role: 'engineer',
  })

  await prisma.siteVisit.create({
    data: {
      machine_id: machineId,
      engineer_id: engineerId,
      visit_date: new Date('2025-01-10'),
      visit_purpose: 'routine',
      findings: 'All OK',
      actions_taken: 'None',
    },
  })

  await prisma.siteVisit.create({
    data: {
      machine_id: machineId,
      engineer_id: otherEngineer.id,
      visit_date: new Date('2025-01-11'),
      visit_purpose: 'ticket',
      findings: 'Sensor fault',
      actions_taken: 'Replaced sensor',
    },
  })

  const res = await request(app)
    .get('/api/v1/site-visits')
    .set('Authorization', `Bearer ${engineerToken}`)
  expect(res.status).toBe(200)
  const visits = res.body.data as Array<{ engineer_id: number }>
  expect(visits).toHaveLength(1)
  expect(visits[0].engineer_id).toBe(engineerId)
})

it('GET /site-visits - admin sees all visits', async () => {
  await prisma.siteVisit.createMany({
    data: [
      {
        machine_id: machineId,
        engineer_id: engineerId,
        visit_date: new Date('2025-02-01'),
        visit_purpose: 'routine',
        findings: 'Normal',
        actions_taken: 'Lubrication',
      },
      {
        machine_id: machineId,
        engineer_id: engineerId,
        visit_date: new Date('2025-02-05'),
        visit_purpose: 'installation',
        findings: 'Installed',
        actions_taken: 'Setup complete',
      },
    ],
  })

  const res = await request(app)
    .get('/api/v1/site-visits')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  expect((res.body.data as unknown[]).length).toBeGreaterThanOrEqual(2)
})

it('GET /site-visits - unauthenticated returns 401', async () => {
  const res = await request(app).get('/api/v1/site-visits')
  expect(res.status).toBe(401)
})

// -------------------------------------------------------------------------
// POST /site-visits
// -------------------------------------------------------------------------

it('POST /site-visits - engineer can create a site visit', async () => {
  const res = await request(app)
    .post('/api/v1/site-visits')
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({
      machine_id: machineId,
      engineer_id: engineerId,
      visit_date: '2025-03-15',
      visit_purpose: 'routine',
      findings: 'All systems operational',
      actions_taken: 'Cleaned filters',
    })
  expect(res.status).toBe(201)
  const visit = res.body.data as {
    machine_id: number
    engineer_id: number
    visit_purpose: string
  }
  expect(visit.machine_id).toBe(machineId)
  expect(visit.engineer_id).toBe(engineerId)
  expect(visit.visit_purpose).toBe('routine')
})

it('POST /site-visits - customer cannot create a site visit (403)', async () => {
  const res = await request(app)
    .post('/api/v1/site-visits')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      machine_id: machineId,
      engineer_id: engineerId,
      visit_date: '2025-03-20',
      visit_purpose: 'routine',
      findings: 'Looks fine',
      actions_taken: 'None',
    })
  expect(res.status).toBe(403)
})
