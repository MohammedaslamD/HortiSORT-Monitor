import request from 'supertest'
import bcrypt from 'bcrypt'
import { app } from '../app.ts'
import { prisma, truncateAll } from './helpers.ts'

let testUserId: number

beforeEach(async () => {
  await truncateAll()
  const hash = await bcrypt.hash('password_123', 12)
  const user = await prisma.user.create({
    data: {
      name: 'Test Admin',
      email: 'admin@test.com',
      phone: '0000000000',
      password_hash: hash,
      role: 'admin',
    },
  })
  testUserId = user.id
})

afterAll(async () => {
  await prisma.$disconnect()
})

it('POST /auth/login - valid credentials returns accessToken and user', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'password_123' })
  expect(res.status).toBe(200)
  expect(res.body.data.accessToken).toBeDefined()
  expect(res.body.data.user.email).toBe('admin@test.com')
  expect(res.body.data.user.password_hash).toBeUndefined()
  expect(res.headers['set-cookie']).toBeDefined() // refresh token cookie
})

it('POST /auth/login - wrong password returns 401', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'wrong' })
  expect(res.status).toBe(401)
})

it('POST /auth/login - non-existent email returns 401', async () => {
  const res = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'nobody@test.com', password: 'password_123' })
  expect(res.status).toBe(401)
})

it('GET /auth/me - valid token returns user', async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'password_123' })
  const { accessToken } = loginRes.body.data as { accessToken: string }

  const meRes = await request(app)
    .get('/api/v1/auth/me')
    .set('Authorization', `Bearer ${accessToken}`)
  expect(meRes.status).toBe(200)
  expect(meRes.body.data.id).toBe(testUserId)
})

it('GET /auth/me - no token returns 401', async () => {
  const res = await request(app).get('/api/v1/auth/me')
  expect(res.status).toBe(401)
})

it('POST /auth/refresh - valid cookie returns new accessToken', async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'password_123' })
  const cookie = loginRes.headers['set-cookie'] as string[]

  const refreshRes = await request(app)
    .post('/api/v1/auth/refresh')
    .set('Cookie', cookie)
  expect(refreshRes.status).toBe(200)
  expect(refreshRes.body.data.accessToken).toBeDefined()
})

it('POST /auth/logout - clears the refresh token cookie', async () => {
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@test.com', password: 'password_123' })
  const { accessToken } = loginRes.body.data as { accessToken: string }
  const cookie = loginRes.headers['set-cookie'] as string[]

  const logoutRes = await request(app)
    .post('/api/v1/auth/logout')
    .set('Authorization', `Bearer ${accessToken}`)
    .set('Cookie', cookie)
  expect(logoutRes.status).toBe(200)
  // Verify cookie is cleared (Max-Age=0 or empty value)
  const setCookie = (logoutRes.headers['set-cookie'] as string[]).join(';')
  expect(setCookie).toMatch(/refresh_token=;|Max-Age=0/)
})
