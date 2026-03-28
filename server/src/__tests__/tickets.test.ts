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
let ticketId: number
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

  const ticket = await prisma.ticket.create({
    data: {
      ticket_number: `TKT-${Date.now()}`,
      machine_id: machineId,
      raised_by: customerId,
      assigned_to: engineerId,
      severity: 'P2_high',
      category: 'hardware',
      title: 'Sensor issue',
      description: 'Sensor reading inconsistent',
      sla_hours: 8,
    },
  })
  ticketId = ticket.id

  adminToken = await loginAs('admin@test.com')
  customerToken = await loginAs('customer@test.com')
  engineerToken = await loginAs('engineer@test.com')
})

afterAll(async () => {
  await prisma.$disconnect()
})

// -------------------------------------------------------------------------
// GET /tickets
// -------------------------------------------------------------------------

it('GET /tickets - admin sees all tickets', async () => {
  const res = await request(app)
    .get('/api/v1/tickets')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  expect(res.body.data).toHaveLength(1)
})

it('GET /tickets - customer sees their raised tickets', async () => {
  const res = await request(app)
    .get('/api/v1/tickets')
    .set('Authorization', `Bearer ${customerToken}`)
  expect(res.status).toBe(200)
  expect(res.body.data).toHaveLength(1)
  expect((res.body.data as Array<{ raised_by: number }>)[0].raised_by).toBe(customerId)
})

it('GET /tickets - engineer sees their assigned tickets', async () => {
  const res = await request(app)
    .get('/api/v1/tickets')
    .set('Authorization', `Bearer ${engineerToken}`)
  expect(res.status).toBe(200)
  expect(res.body.data).toHaveLength(1)
  expect((res.body.data as Array<{ assigned_to: number }>)[0].assigned_to).toBe(engineerId)
})

it('GET /tickets - unauthenticated returns 401', async () => {
  const res = await request(app).get('/api/v1/tickets')
  expect(res.status).toBe(401)
})

// -------------------------------------------------------------------------
// GET /tickets/stats
// -------------------------------------------------------------------------

it('GET /tickets/stats - returns open count and bySeverity', async () => {
  const res = await request(app)
    .get('/api/v1/tickets/stats')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const stats = res.body.data as { open: number; bySeverity: Record<string, number> }
  expect(stats.open).toBe(1)
  expect(stats.bySeverity.P2_high).toBe(1)
})

// -------------------------------------------------------------------------
// GET /tickets/:id
// -------------------------------------------------------------------------

it('GET /tickets/:id - returns ticket with comments and machine', async () => {
  const res = await request(app)
    .get(`/api/v1/tickets/${ticketId}`)
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(200)
  const ticket = res.body.data as {
    id: number
    machine: { machine_code: string }
    comments: unknown[]
  }
  expect(ticket.id).toBe(ticketId)
  expect(ticket.machine.machine_code).toBe('HS-TEST-001')
  expect(Array.isArray(ticket.comments)).toBe(true)
})

it('GET /tickets/:id - non-existent ticket returns 404', async () => {
  const res = await request(app)
    .get('/api/v1/tickets/99999')
    .set('Authorization', `Bearer ${adminToken}`)
  expect(res.status).toBe(404)
})

// -------------------------------------------------------------------------
// POST /tickets
// -------------------------------------------------------------------------

it('POST /tickets - creates a ticket with correct fields', async () => {
  const res = await request(app)
    .post('/api/v1/tickets')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      machine_id: machineId,
      assigned_to: engineerId,
      severity: 'P1_critical',
      category: 'electrical',
      title: 'Machine down',
      description: 'Complete shutdown',
    })
  expect(res.status).toBe(201)
  const ticket = res.body.data as {
    ticket_number: string
    raised_by: number
    sla_hours: number
    severity: string
  }
  expect(ticket.ticket_number).toMatch(/^TKT-/)
  expect(ticket.raised_by).toBe(customerId)
  expect(ticket.sla_hours).toBe(4) // P1_critical → 4 hours
  expect(ticket.severity).toBe('P1_critical')
})

// -------------------------------------------------------------------------
// PATCH /tickets/:id/status
// -------------------------------------------------------------------------

it('PATCH /tickets/:id/status - engineer can update status to in_progress', async () => {
  const res = await request(app)
    .patch(`/api/v1/tickets/${ticketId}/status`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({ status: 'in_progress' })
  expect(res.status).toBe(200)
  expect((res.body.data as { status: string }).status).toBe('in_progress')
})

it('PATCH /tickets/:id/status - reopened increments reopen_count and sets reopened_at', async () => {
  // First close it
  await request(app)
    .patch(`/api/v1/tickets/${ticketId}/status`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({ status: 'closed' })

  const res = await request(app)
    .patch(`/api/v1/tickets/${ticketId}/status`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({ status: 'reopened' })
  expect(res.status).toBe(200)
  const ticket = res.body.data as { status: string; reopen_count: number; reopened_at: string }
  expect(ticket.status).toBe('reopened')
  expect(ticket.reopen_count).toBe(1)
  expect(ticket.reopened_at).not.toBeNull()
})

it('PATCH /tickets/:id/status - customer cannot update status (403)', async () => {
  const res = await request(app)
    .patch(`/api/v1/tickets/${ticketId}/status`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ status: 'in_progress' })
  expect(res.status).toBe(403)
})

// -------------------------------------------------------------------------
// PATCH /tickets/:id/resolve
// -------------------------------------------------------------------------

it('PATCH /tickets/:id/resolve - sets resolved fields', async () => {
  const res = await request(app)
    .patch(`/api/v1/tickets/${ticketId}/resolve`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({
      root_cause: 'Faulty sensor',
      solution: 'Replaced sensor unit',
      parts_used: 'Sensor XYZ',
    })
  expect(res.status).toBe(200)
  const ticket = res.body.data as {
    status: string
    root_cause: string
    solution: string
    resolved_at: string
    resolution_time_mins: number
  }
  expect(ticket.status).toBe('resolved')
  expect(ticket.root_cause).toBe('Faulty sensor')
  expect(ticket.resolved_at).not.toBeNull()
  expect(typeof ticket.resolution_time_mins).toBe('number')
})

it('PATCH /tickets/:id/resolve - customer cannot resolve ticket (403)', async () => {
  const res = await request(app)
    .patch(`/api/v1/tickets/${ticketId}/resolve`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ root_cause: 'x', solution: 'y' })
  expect(res.status).toBe(403)
})

// -------------------------------------------------------------------------
// POST /tickets/:id/comments
// -------------------------------------------------------------------------

it('POST /tickets/:id/comments - adds a comment to the ticket', async () => {
  const res = await request(app)
    .post(`/api/v1/tickets/${ticketId}/comments`)
    .set('Authorization', `Bearer ${customerToken}`)
    .send({ message: 'Please look into this urgently' })
  expect(res.status).toBe(201)
  const comment = res.body.data as { id: number; ticket_id: number; message: string }
  expect(comment.ticket_id).toBe(ticketId)
  expect(comment.message).toBe('Please look into this urgently')
})

// -------------------------------------------------------------------------
// Activity log writes
// -------------------------------------------------------------------------

it('POST /tickets - writes an activity log entry', async () => {
  const res = await request(app)
    .post('/api/v1/tickets')
    .set('Authorization', `Bearer ${customerToken}`)
    .send({
      machine_id: machineId,
      assigned_to: engineerId,
      severity: 'P3_medium',
      category: 'software',
      title: 'Log test ticket',
      description: 'Checking activity log',
    })
  expect(res.status).toBe(201)

  await new Promise((r) => setTimeout(r, 50))

  const createdTicketId = (res.body.data as { id: number }).id
  const logs = await prisma.activityLog.findMany({
    where: { entity_type: 'ticket', entity_id: createdTicketId },
  })
  expect(logs.length).toBeGreaterThanOrEqual(1)
  expect(logs[0].action).toBe('ticket_created')
})

it('PATCH /tickets/:id/status - writes an activity log entry', async () => {
  await request(app)
    .patch(`/api/v1/tickets/${ticketId}/status`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({ status: 'in_progress' })

  await new Promise((r) => setTimeout(r, 50))

  const logs = await prisma.activityLog.findMany({
    where: { entity_type: 'ticket', entity_id: ticketId, action: 'status_updated' },
  })
  expect(logs.length).toBeGreaterThanOrEqual(1)
})

it('PATCH /tickets/:id/resolve - writes an activity log entry', async () => {
  await request(app)
    .patch(`/api/v1/tickets/${ticketId}/resolve`)
    .set('Authorization', `Bearer ${engineerToken}`)
    .send({ root_cause: 'Faulty sensor', solution: 'Replaced sensor' })

  await new Promise((r) => setTimeout(r, 50))

  const logs = await prisma.activityLog.findMany({
    where: { entity_type: 'ticket', entity_id: ticketId, action: 'ticket_resolved' },
  })
  expect(logs.length).toBeGreaterThanOrEqual(1)
})
