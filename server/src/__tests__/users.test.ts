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
let adminToken: string
let engineerToken: string

beforeEach(async () => {
  await truncateAll()

  const admin = await createUser({ name: 'Admin', email: 'admin@test.com', role: 'admin' })
  const customer = await createUser({ name: 'Customer', email: 'customer@test.com', role: 'customer' })
  const engineer = await createUser({ name: 'Engineer', email: 'engineer@test.com', role: 'engineer' })

  adminId = admin.id
  customerId = customer.id
  engineerId = engineer.id

  adminToken = await loginAs('admin@test.com')
  engineerToken = await loginAs('engineer@test.com')
})

afterAll(async () => {
  await prisma.$disconnect()
})

// -------------------------------------------------------------------------
// GET /users
// -------------------------------------------------------------------------

it('GET /users - admin can list all users, response excludes password_hash', async () => {
  const res = await request(app)
    .get('/api/v1/users')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const users = res.body.data as Array<Record<string, unknown>>
  expect(users.length).toBeGreaterThanOrEqual(3)
  // Verify no user object exposes password_hash
  for (const u of users) {
    expect(u).not.toHaveProperty('password_hash')
  }
})

it('GET /users - engineer is forbidden (403)', async () => {
  const res = await request(app)
    .get('/api/v1/users')
    .set('Authorization', `Bearer ${engineerToken}`)
  expect(res.status).toBe(403)
})

it('GET /users - unauthenticated returns 401', async () => {
  const res = await request(app).get('/api/v1/users')
  expect(res.status).toBe(401)
})

// -------------------------------------------------------------------------
// GET /users/:id
// -------------------------------------------------------------------------

it('GET /users/:id - admin can get a user by ID', async () => {
  const res = await request(app)
    .get(`/api/v1/users/${engineerId}`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const user = res.body.data as { id: number; name: string; role: string }
  expect(user.id).toBe(engineerId)
  expect(user.role).toBe('engineer')
  expect(user).not.toHaveProperty('password_hash')
})

it('GET /users/:id - engineer is forbidden (403)', async () => {
  const res = await request(app)
    .get(`/api/v1/users/${customerId}`)
    .set('Authorization', `Bearer ${engineerToken}`)
  expect(res.status).toBe(403)
})

it('GET /users/:id - non-existent user returns 404', async () => {
  const res = await request(app)
    .get('/api/v1/users/99999')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(404)
})

// -------------------------------------------------------------------------
// PATCH /users/:id/active
// -------------------------------------------------------------------------

it('PATCH /users/:id/active - admin can toggle user is_active', async () => {
  // Engineer is is_active=true by default
  const res = await request(app)
    .patch(`/api/v1/users/${engineerId}/active`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const user = res.body.data as { is_active: boolean }
  expect(user.is_active).toBe(false)

  // Toggle back
  const res2 = await request(app)
    .patch(`/api/v1/users/${engineerId}/active`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res2.status).toBe(200)
  const user2 = res2.body.data as { is_active: boolean }
  expect(user2.is_active).toBe(true)
})

it('PATCH /users/:id/active - engineer is forbidden (403)', async () => {
  const res = await request(app)
    .patch(`/api/v1/users/${customerId}/active`)
    .set('Authorization', `Bearer ${engineerToken}`)
  expect(res.status).toBe(403)
})

// -------------------------------------------------------------------------
// Activity log on user toggle
// -------------------------------------------------------------------------

it('PATCH /users/:id/active - writes an activity log entry', async () => {
  await request(app)
    .patch(`/api/v1/users/${engineerId}/active`)
    .set('Authorization', `Bearer ${adminToken}`)

  await new Promise((r) => setTimeout(r, 50))

  const logs = await prisma.activityLog.findMany({
    where: { entity_type: 'user', entity_id: engineerId, action: 'user_toggled_active' },
  })
  expect(logs.length).toBeGreaterThanOrEqual(1)
})

// ── POST /users ──────────────────────────────────────────────────────────────
describe('POST /users', () => {
  it('creates a new user and returns it without password_hash', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New User',
        email: 'newuser@test.com',
        phone: '9000000001',
        role: 'engineer',
        password: 'password123',
      })
    expect(res.status).toBe(201)
    expect(res.body.data.email).toBe('newuser@test.com')
    expect(res.body.data.password_hash).toBeUndefined()
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Bad User' })
    expect(res.status).toBe(400)
  })

  it('returns 409 on duplicate email', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Dup',
        email: 'admin@test.com',
        phone: '9000000002',
        role: 'admin',
        password: 'password123',
      })
    expect(res.status).toBe(409)
  })

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({
        name: 'X',
        email: 'x@x.com',
        phone: '9000000003',
        role: 'engineer',
        password: 'password123',
      })
    expect(res.status).toBe(403)
  })
})

// ── PATCH /users/:id ──────────────────────────────────────────────────────────
describe('PATCH /users/:id', () => {
  it('updates name, phone, whatsapp, role and returns updated user', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${engineerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Updated Name', phone: '9999999999', role: 'engineer' })
    expect(res.status).toBe(200)
    expect(res.body.data.name).toBe('Updated Name')
    expect(res.body.data.phone).toBe('9999999999')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${engineerId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: '' })
    expect(res.status).toBe(400)
  })

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${engineerId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ name: 'X', phone: '9000000004', role: 'engineer' })
    expect(res.status).toBe(403)
  })
})

// ── PATCH /users/:id/machines ─────────────────────────────────────────────────
describe('PATCH /users/:id/machines', () => {
  it('assigns machines to a customer and returns updated count', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${customerId}/machines`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ machine_ids: [] })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('updated')
  })

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .patch(`/api/v1/users/${customerId}/machines`)
      .set('Authorization', `Bearer ${engineerToken}`)
      .send({ machine_ids: [] })
    expect(res.status).toBe(403)
  })
})

// ── DELETE /users/:id ─────────────────────────────────────────────────────────
describe('DELETE /users/:id', () => {
  it('deletes a user with no associated records', async () => {
    // Create a fresh user with no records
    const fresh = await createUser({ name: 'ToDelete', email: 'todelete@test.com', role: 'engineer' })
    const res = await request(app)
      .delete(`/api/v1/users/${fresh.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data.deleted).toBe(true)
  })

  it('returns 409 when user has associated records', async () => {
    // Create a fresh engineer then a machine linked to them
    const eng = await createUser({ name: 'EngWithRecords', email: 'eng.records@test.com', role: 'engineer' })
    // Create a machine assigned to this engineer to trigger the machineCount > 0 guard
    await prisma.machine.create({
      data: {
        machine_code: `MC-${Date.now()}`,
        machine_name: 'Test Machine',
        model: 'HS-500',
        serial_number: `SN-${Date.now()}`,
        customer_id: customerId,
        engineer_id: eng.id,
        location: 'Test Location',
        city: 'Mumbai',
        state: 'Maharashtra',
        grading_features: 'Size',
        num_lanes: 2,
        software_version: 'v1.0',
        installation_date: new Date('2024-01-01'),
        last_updated_by: adminId,
      },
    })
    const res = await request(app)
      .delete(`/api/v1/users/${eng.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(409)
  })

  it('returns 403 when trying to delete self', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(403)
  })

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .delete(`/api/v1/users/${customerId}`)
      .set('Authorization', `Bearer ${engineerToken}`)
    expect(res.status).toBe(403)
  })
})
