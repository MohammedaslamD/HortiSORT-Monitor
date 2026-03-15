import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../app.ts'
import { prisma, truncateAll } from './helpers.ts'

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

async function createUser(
  name: string,
  email: string,
  role: 'customer' | 'engineer' | 'admin',
) {
  const hash = await bcrypt.hash('password_123', 12)
  return prisma.user.create({
    data: { name, email, phone: '0000000000', password_hash: hash, role },
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

  const admin = await createUser('Admin', 'admin@test.com', 'admin')
  const customer = await createUser('Customer', 'customer@test.com', 'customer')
  const engineer = await createUser('Engineer', 'engineer@test.com', 'engineer')

  adminId = admin.id
  customerId = customer.id
  engineerId = engineer.id

  const machine = await prisma.machine.create({
    data: {
      machine_code: 'HS-DL-001',
      machine_name: 'Daily Log Machine',
      model: 'HS-500',
      serial_number: 'SN-DL-001',
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

  // Seed a daily log
  await prisma.dailyLog.create({
    data: {
      machine_id: machineId,
      date: new Date('2026-03-14'),
      status: 'running',
      fruit_type: 'Mango',
      tons_processed: 5.2,
      shift_start: '08:00',
      shift_end: '16:00',
      notes: 'Normal operation',
      updated_by: engineerId,
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
// GET /daily-logs
// -------------------------------------------------------------------------

it('GET /daily-logs - admin sees all logs', async () => {
  const res = await request(app)
    .get('/api/v1/daily-logs')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  expect((res.body.data as unknown[]).length).toBeGreaterThanOrEqual(1)
})

it('GET /daily-logs - unauthenticated returns 401', async () => {
  const res = await request(app).get('/api/v1/daily-logs')
  expect(res.status).toBe(401)
})

it('GET /daily-logs - filter by machineId returns only that machine logs', async () => {
  const res = await request(app)
    .get(`/api/v1/daily-logs?machineId=${machineId}`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const logs = res.body.data as Array<{ machine_id: number }>
  logs.forEach((l) => expect(l.machine_id).toBe(machineId))
})

// -------------------------------------------------------------------------
// POST /daily-logs
// -------------------------------------------------------------------------

it('POST /daily-logs - engineer can create a daily log', async () => {
  const res = await request(app)
    .post('/api/v1/daily-logs')
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({
      machine_id: machineId,
      date: '2026-03-15',
      status: 'running',
      fruit_type: 'Banana',
      tons_processed: 3.8,
      shift_start: '06:00',
      shift_end: '14:00',
      notes: 'Good run',
    })
  expect(res.status).toBe(201)
  const log = res.body.data as { machine_id: number; fruit_type: string }
  expect(log.machine_id).toBe(machineId)
  expect(log.fruit_type).toBe('Banana')
})

it('POST /daily-logs - customer cannot create a daily log (403)', async () => {
  const res = await request(app)
    .post('/api/v1/daily-logs')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      machine_id: machineId,
      date: '2026-03-16',
      status: 'running',
      fruit_type: 'Apple',
      tons_processed: 2.0,
      shift_start: '07:00',
      shift_end: '15:00',
      notes: 'Should fail',
    })
  expect(res.status).toBe(403)
})

it('POST /daily-logs - missing required field returns 400', async () => {
  const res = await request(app)
    .post('/api/v1/daily-logs')
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({
      machine_id: machineId,
      // date missing
      status: 'running',
      fruit_type: 'Grapes',
      tons_processed: 1.5,
      shift_start: '09:00',
      shift_end: '17:00',
      notes: 'Missing date',
    })
  expect(res.status).toBe(400)
})
