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
