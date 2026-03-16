import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  console.log('Truncating tables...')
  // Delete in FK-safe order
  await prisma.activityLog.deleteMany()
  await prisma.machineHistory.deleteMany()
  await prisma.siteVisit.deleteMany()
  await prisma.ticketComment.deleteMany()
  await prisma.ticket.deleteMany()
  await prisma.dailyLog.deleteMany()
  await prisma.machine.deleteMany()
  await prisma.user.deleteMany()
  console.log('Tables truncated')

  console.log('Seeding database...')

  // -------------------------------------------------------------------------
  // 1. Users
  // -------------------------------------------------------------------------
  const passwordHash = await bcrypt.hash('password_123', 12)

  await prisma.user.createMany({
    data: [
      { id: 1, name: 'Rajesh Patel', email: 'rajesh.patel@agrifresh.com', phone: '+91 98765 43210', whatsapp_number: '+91 98765 43210', password_hash: passwordHash, role: 'customer', is_active: true, created_at: new Date('2024-01-15T10:00:00Z'), updated_at: new Date('2024-01-15T10:00:00Z') },
      { id: 2, name: 'Sunita Reddy', email: 'sunita.reddy@farmexports.in', phone: '+91 87654 32109', password_hash: passwordHash, role: 'customer', is_active: true, created_at: new Date('2024-03-20T10:00:00Z'), updated_at: new Date('2024-03-20T10:00:00Z') },
      { id: 3, name: 'Amit Sharma', email: 'amit.sharma@hortisort.com', phone: '+91 76543 21098', whatsapp_number: '+91 76543 21098', password_hash: passwordHash, role: 'engineer', is_active: true, created_at: new Date('2023-06-01T10:00:00Z'), updated_at: new Date('2023-06-01T10:00:00Z') },
      { id: 4, name: 'Priya Nair', email: 'priya.nair@hortisort.com', phone: '+91 65432 10987', whatsapp_number: '+91 65432 10987', password_hash: passwordHash, role: 'engineer', is_active: true, created_at: new Date('2023-08-15T10:00:00Z'), updated_at: new Date('2023-08-15T10:00:00Z') },
      { id: 5, name: 'Aslam Sheikh', email: 'aslam@hortisort.com', phone: '+91 54321 09876', whatsapp_number: '+91 54321 09876', password_hash: passwordHash, role: 'admin', is_active: true, created_at: new Date('2023-01-01T10:00:00Z'), updated_at: new Date('2023-01-01T10:00:00Z') },
      { id: 6, name: 'Deepa Kulkarni', email: 'deepa.kulkarni@hortisort.com', phone: '+91 43210 98765', password_hash: passwordHash, role: 'admin', is_active: true, created_at: new Date('2023-01-01T10:00:00Z'), updated_at: new Date('2023-01-01T10:00:00Z') },
      { id: 7, name: 'Vikram Mehta', email: 'vikram.mehta@freshpack.in', phone: '+91 99887 76655', whatsapp_number: '+91 99887 76655', password_hash: passwordHash, role: 'customer', is_active: true, created_at: new Date('2025-08-01T10:00:00Z'), updated_at: new Date('2025-08-01T10:00:00Z') },
    ],
    skipDuplicates: true,
  })
  console.log('Users seeded')

  // -------------------------------------------------------------------------
  // 2. Machines
  // -------------------------------------------------------------------------
  await prisma.machine.createMany({
    data: [
      { id: 1, machine_code: 'HS-2024-0001', machine_name: 'HortiSort Pro 500', model: 'HS-500', serial_number: 'SN-500-0001', customer_id: 1, engineer_id: 3, location: 'Survey No 42, Hadapsar Industrial Estate', city: 'Pune', state: 'Maharashtra', country: 'India', grading_features: 'size,color,weight', num_lanes: 8, software_version: 'v2.5', installation_date: new Date('2024-02-10'), status: 'running', last_updated: new Date('2026-03-15T08:30:00Z'), last_updated_by: 3, is_active: true, created_at: new Date('2024-02-10T10:00:00Z'), updated_at: new Date('2026-03-15T08:30:00Z') },
      { id: 2, machine_code: 'HS-2024-0002', machine_name: 'HortiSort 300', model: 'HS-300', serial_number: 'SN-300-0002', customer_id: 1, engineer_id: 3, location: 'Plot 7, MIDC Nashik', city: 'Nashik', state: 'Maharashtra', country: 'India', grading_features: 'size,color', num_lanes: 4, software_version: 'v2.3', installation_date: new Date('2024-04-15'), status: 'running', last_updated: new Date('2026-03-14T16:00:00Z'), last_updated_by: 3, is_active: true, created_at: new Date('2024-04-15T10:00:00Z'), updated_at: new Date('2026-03-14T16:00:00Z') },
      { id: 3, machine_code: 'HS-2024-0003', machine_name: 'HortiSort Pro 500', model: 'HS-500', serial_number: 'SN-500-0003', customer_id: 5, engineer_id: 4, location: 'Shed 12, Vashi APMC Market', city: 'Mumbai', state: 'Maharashtra', country: 'India', grading_features: 'size,color,weight', num_lanes: 8, software_version: 'v2.4', installation_date: new Date('2024-06-20'), status: 'down', last_updated: new Date('2026-03-13T10:00:00Z'), last_updated_by: 4, is_active: true, created_at: new Date('2024-06-20T10:00:00Z'), updated_at: new Date('2026-03-13T10:00:00Z') },
      { id: 4, machine_code: 'HS-2024-0004', machine_name: 'HortiSort 300', model: 'HS-300', serial_number: 'SN-300-0004', customer_id: 5, engineer_id: 4, location: 'Cold Storage Unit 3, Sangli Road', city: 'Kolhapur', state: 'Maharashtra', country: 'India', grading_features: 'size,weight', num_lanes: 4, software_version: 'v2.3', installation_date: new Date('2024-08-05'), status: 'idle', last_updated: new Date('2026-03-12T14:00:00Z'), last_updated_by: 4, is_active: true, created_at: new Date('2024-08-05T10:00:00Z'), updated_at: new Date('2026-03-12T14:00:00Z') },
      { id: 5, machine_code: 'HS-2024-0005', machine_name: 'HortiSort Pro', model: 'HS-Pro', serial_number: 'SN-PRO-0005', customer_id: 5, engineer_id: 3, location: 'Fruit Market Complex, Ratnagiri', city: 'Ratnagiri', state: 'Maharashtra', country: 'India', grading_features: 'size,color,weight', num_lanes: 6, software_version: 'v2.5', installation_date: new Date('2024-10-12'), status: 'running', last_updated: new Date('2026-03-15T07:00:00Z'), last_updated_by: 3, is_active: true, created_at: new Date('2024-10-12T10:00:00Z'), updated_at: new Date('2026-03-15T07:00:00Z') },
      { id: 6, machine_code: 'HS-2025-0006', machine_name: 'HortiSort 500', model: 'HS-500', serial_number: 'SN-500-0006', customer_id: 2, engineer_id: 4, location: 'Plot 23, Jigani Industrial Area', city: 'Bangalore', state: 'Karnataka', country: 'India', grading_features: 'size,color,weight', num_lanes: 8, software_version: 'v2.5', installation_date: new Date('2025-01-18'), status: 'running', last_updated: new Date('2026-03-15T09:00:00Z'), last_updated_by: 4, is_active: true, created_at: new Date('2025-01-18T10:00:00Z'), updated_at: new Date('2026-03-15T09:00:00Z') },
      { id: 7, machine_code: 'HS-2025-0007', machine_name: 'HortiSort 300', model: 'HS-300', serial_number: 'SN-300-0007', customer_id: 2, engineer_id: 3, location: 'Koyambedu Market, Poonamallee High Rd', city: 'Chennai', state: 'Tamil Nadu', country: 'India', grading_features: 'size,color', num_lanes: 4, software_version: 'v2.2', installation_date: new Date('2025-02-25'), status: 'running', last_updated: new Date('2026-03-14T11:00:00Z'), last_updated_by: 3, is_active: true, created_at: new Date('2025-02-25T10:00:00Z'), updated_at: new Date('2026-03-14T11:00:00Z') },
      { id: 8, machine_code: 'HS-2025-0008', machine_name: 'HortiSort Pro', model: 'HS-Pro', serial_number: 'SN-PRO-0008', customer_id: 7, engineer_id: 4, location: 'Azadpur Mandi, GT Karnal Road', city: 'Delhi', state: 'Delhi', country: 'India', grading_features: 'size,color,weight', num_lanes: 6, software_version: 'v2.4', installation_date: new Date('2025-03-10'), status: 'down', last_updated: new Date('2026-03-11T15:00:00Z'), last_updated_by: 4, is_active: true, created_at: new Date('2025-03-10T10:00:00Z'), updated_at: new Date('2026-03-11T15:00:00Z') },
      { id: 9, machine_code: 'HS-2025-0009', machine_name: 'HortiSort 500', model: 'HS-500', serial_number: 'SN-500-0009', customer_id: 5, engineer_id: 3, location: 'Fruit Hub, Bowenpally', city: 'Hyderabad', state: 'Telangana', country: 'India', grading_features: 'size,weight', num_lanes: 6, software_version: 'v2.3', installation_date: new Date('2025-04-08'), status: 'running', last_updated: new Date('2026-03-15T06:30:00Z'), last_updated_by: 3, is_active: true, created_at: new Date('2025-04-08T10:00:00Z'), updated_at: new Date('2026-03-15T06:30:00Z') },
      { id: 10, machine_code: 'HS-2025-0010', machine_name: 'HortiSort 300', model: 'HS-300', serial_number: 'SN-300-0010', customer_id: 5, engineer_id: 4, location: 'Mansarovar Industrial Area', city: 'Jaipur', state: 'Rajasthan', country: 'India', grading_features: 'size', num_lanes: 4, software_version: 'v2.1', installation_date: new Date('2025-05-20'), status: 'idle', last_updated: new Date('2026-03-10T12:00:00Z'), last_updated_by: 4, is_active: true, created_at: new Date('2025-05-20T10:00:00Z'), updated_at: new Date('2026-03-10T12:00:00Z') },
      { id: 11, machine_code: 'HS-2025-0011', machine_name: 'HortiSort Pro 500', model: 'HS-500', serial_number: 'SN-500-0011', customer_id: 5, engineer_id: 3, location: 'GIDC Estate, Vatva', city: 'Ahmedabad', state: 'Gujarat', country: 'India', grading_features: 'size,color,weight', num_lanes: 8, software_version: 'v2.5', installation_date: new Date('2025-06-14'), status: 'offline', last_updated: new Date('2026-03-08T10:00:00Z'), last_updated_by: 3, is_active: true, created_at: new Date('2025-06-14T10:00:00Z'), updated_at: new Date('2026-03-08T10:00:00Z') },
      { id: 12, machine_code: 'HS-2025-0012', machine_name: 'HortiSort Pro', model: 'HS-Pro', serial_number: 'SN-PRO-0012', customer_id: 5, engineer_id: 4, location: 'Wholesale Market, Koramangala', city: 'Nagpur', state: 'Maharashtra', country: 'India', grading_features: 'size,color', num_lanes: 6, software_version: 'v2.4', installation_date: new Date('2025-07-22'), status: 'offline', last_updated: new Date('2026-03-07T09:00:00Z'), last_updated_by: 4, is_active: true, created_at: new Date('2025-07-22T10:00:00Z'), updated_at: new Date('2026-03-07T09:00:00Z') },
    ],
    skipDuplicates: true,
  })
  console.log('Machines seeded')

  // -------------------------------------------------------------------------
  // 3. Daily Logs
  // -------------------------------------------------------------------------
  await prisma.dailyLog.createMany({
    data: [
      { id: 1, machine_id: 1, date: new Date('2026-03-15'), status: 'running', fruit_type: 'Mango', tons_processed: 6.5, shift_start: '06:00', shift_end: '14:00', notes: 'Alphonso season peak. Running at full capacity.', updated_by: 3, created_at: new Date('2026-03-15T08:30:00Z'), updated_at: new Date('2026-03-15T08:30:00Z') },
      { id: 2, machine_id: 2, date: new Date('2026-03-14'), status: 'running', fruit_type: 'Grapes', tons_processed: 4.2, shift_start: '06:00', shift_end: '14:00', notes: 'Thompson seedless batch.', updated_by: 3, created_at: new Date('2026-03-14T16:00:00Z'), updated_at: new Date('2026-03-14T16:00:00Z') },
      { id: 3, machine_id: 5, date: new Date('2026-03-15'), status: 'running', fruit_type: 'Mango', tons_processed: 5.0, shift_start: '06:00', shift_end: '14:00', notes: 'Hapus mangoes from local farms.', updated_by: 3, created_at: new Date('2026-03-15T07:00:00Z'), updated_at: new Date('2026-03-15T07:00:00Z') },
      { id: 4, machine_id: 6, date: new Date('2026-03-15'), status: 'running', fruit_type: 'Tomato', tons_processed: 7.8, shift_start: '06:00', shift_end: '14:00', notes: 'Export quality tomatoes.', updated_by: 4, created_at: new Date('2026-03-15T09:00:00Z'), updated_at: new Date('2026-03-15T09:00:00Z') },
      { id: 5, machine_id: 7, date: new Date('2026-03-14'), status: 'running', fruit_type: 'Banana', tons_processed: 3.5, shift_start: '14:00', shift_end: '22:00', notes: 'Evening shift, Cavendish variety.', updated_by: 3, created_at: new Date('2026-03-14T11:00:00Z'), updated_at: new Date('2026-03-14T11:00:00Z') },
      { id: 6, machine_id: 9, date: new Date('2026-03-15'), status: 'running', fruit_type: 'Pomegranate', tons_processed: 4.0, shift_start: '06:00', shift_end: '14:00', notes: 'Bhagwa variety for export.', updated_by: 3, created_at: new Date('2026-03-15T06:30:00Z'), updated_at: new Date('2026-03-15T06:30:00Z') },
      { id: 7, machine_id: 1, date: new Date('2026-03-14'), status: 'running', fruit_type: 'Mango', tons_processed: 5.8, shift_start: '14:00', shift_end: '22:00', notes: 'Second shift, Kesar mangoes.', updated_by: 3, created_at: new Date('2026-03-14T22:00:00Z'), updated_at: new Date('2026-03-14T22:00:00Z') },
      { id: 8, machine_id: 3, date: new Date('2026-03-13'), status: 'not_running', fruit_type: 'Apple', tons_processed: 0, shift_start: '06:00', shift_end: '06:00', notes: 'Machine down — sensor malfunction.', updated_by: 4, created_at: new Date('2026-03-13T10:00:00Z'), updated_at: new Date('2026-03-13T10:00:00Z') },
      { id: 9, machine_id: 4, date: new Date('2026-03-12'), status: 'maintenance', fruit_type: 'Orange', tons_processed: 0, shift_start: '06:00', shift_end: '14:00', notes: 'Scheduled preventive maintenance.', updated_by: 4, created_at: new Date('2026-03-12T14:00:00Z'), updated_at: new Date('2026-03-12T14:00:00Z') },
      { id: 10, machine_id: 6, date: new Date('2026-03-14'), status: 'running', fruit_type: 'Tomato', tons_processed: 8.0, shift_start: '06:00', shift_end: '14:00', notes: 'Record output day.', updated_by: 4, created_at: new Date('2026-03-14T14:00:00Z'), updated_at: new Date('2026-03-14T14:00:00Z') },
      { id: 11, machine_id: 2, date: new Date('2026-03-13'), status: 'running', fruit_type: 'Pomegranate', tons_processed: 3.2, shift_start: '06:00', shift_end: '14:00', notes: '', updated_by: 3, created_at: new Date('2026-03-13T14:00:00Z'), updated_at: new Date('2026-03-13T14:00:00Z') },
      { id: 12, machine_id: 9, date: new Date('2026-03-14'), status: 'running', fruit_type: 'Guava', tons_processed: 2.8, shift_start: '14:00', shift_end: '22:00', notes: 'Allahabad Safeda variety.', updated_by: 3, created_at: new Date('2026-03-14T22:00:00Z'), updated_at: new Date('2026-03-14T22:00:00Z') },
      { id: 13, machine_id: 5, date: new Date('2026-03-14'), status: 'running', fruit_type: 'Mango', tons_processed: 4.5, shift_start: '14:00', shift_end: '22:00', notes: 'Evening batch.', updated_by: 3, created_at: new Date('2026-03-14T22:00:00Z'), updated_at: new Date('2026-03-14T22:00:00Z') },
      { id: 14, machine_id: 7, date: new Date('2026-03-13'), status: 'running', fruit_type: 'Apple', tons_processed: 1.8, shift_start: '06:00', shift_end: '14:00', notes: 'Shimla apples, small batch.', updated_by: 3, created_at: new Date('2026-03-13T14:00:00Z'), updated_at: new Date('2026-03-13T14:00:00Z') },
      { id: 15, machine_id: 1, date: new Date('2026-03-13'), status: 'running', fruit_type: 'Mango', tons_processed: 6.0, shift_start: '06:00', shift_end: '14:00', notes: 'Consistent output.', updated_by: 3, created_at: new Date('2026-03-13T14:00:00Z'), updated_at: new Date('2026-03-13T14:00:00Z') },
    ],
    skipDuplicates: true,
  })
  console.log('Daily logs seeded')

  // -------------------------------------------------------------------------
  // 4. Tickets
  // -------------------------------------------------------------------------
  await prisma.ticket.createMany({
    data: [
      { id: 1, ticket_number: 'TKT-00001', machine_id: 3, raised_by: 4, assigned_to: 5, severity: 'P1_critical', category: 'sensor', title: 'Sensor calibration error on lane 3', description: 'Color sensor on lane 3 giving inconsistent readings. Machine grading accuracy dropped below 80%. Needs immediate attention.', status: 'open', sla_hours: 4, created_at: new Date('2026-03-13T10:30:00Z'), updated_at: new Date('2026-03-13T10:30:00Z') },
      { id: 2, ticket_number: 'TKT-00002', machine_id: 8, raised_by: 4, assigned_to: 5, severity: 'P1_critical', category: 'hardware', title: 'Conveyor belt misalignment', description: 'Main conveyor belt has shifted causing fruit to fall off at lane 5-6 junction. Machine stopped.', status: 'in_progress', sla_hours: 4, created_at: new Date('2026-03-11T15:00:00Z'), updated_at: new Date('2026-03-12T09:00:00Z') },
      { id: 3, ticket_number: 'TKT-00003', machine_id: 1, raised_by: 3, assigned_to: 6, severity: 'P3_medium', category: 'software', title: 'Software crash during color sorting', description: 'Application crashes intermittently when processing mixed color batch. Error log attached.', status: 'resolved', sla_hours: 24, created_at: new Date('2026-03-08T11:00:00Z'), resolved_at: new Date('2026-03-09T16:00:00Z'), resolution_time_mins: 1740, root_cause: 'Memory leak in color processing module when handling >500 items/min', solution: 'Updated to software v2.5 patch 3 which fixes the memory allocation issue', customer_rating: 4, customer_feedback: 'Fixed quickly, machine running well now. Thanks team!', updated_at: new Date('2026-03-09T16:00:00Z') },
      { id: 4, ticket_number: 'TKT-00004', machine_id: 6, raised_by: 4, assigned_to: 5, severity: 'P2_high', category: 'sensor', title: 'Color camera malfunction', description: 'Primary color camera showing blue tint on all captures. Calibration attempt failed.', status: 'resolved', sla_hours: 8, created_at: new Date('2026-03-05T09:00:00Z'), resolved_at: new Date('2026-03-05T15:30:00Z'), resolution_time_mins: 390, root_cause: 'Camera lens coating degraded due to humidity exposure', solution: 'Replaced camera module with new unit. Added humidity shield.', parts_used: 'Color camera module CM-200, Humidity shield HS-01', customer_rating: 5, customer_feedback: 'Excellent service, same-day resolution!', updated_at: new Date('2026-03-05T15:30:00Z') },
      { id: 5, ticket_number: 'TKT-00005', machine_id: 11, raised_by: 3, assigned_to: 6, severity: 'P2_high', category: 'electrical', title: 'Weight sensor drift after power outage', description: 'Weight readings drifting by 15-20g after recent power outage. Recalibration doesn\'t hold.', status: 'open', sla_hours: 8, created_at: new Date('2026-03-14T08:00:00Z'), updated_at: new Date('2026-03-14T08:00:00Z') },
      { id: 6, ticket_number: 'TKT-00006', machine_id: 2, raised_by: 3, assigned_to: 5, severity: 'P4_low', category: 'hardware', title: 'Display panel flickering', description: 'Operator display panel flickers occasionally. Machine operation not affected.', status: 'closed', sla_hours: 72, created_at: new Date('2026-02-20T10:00:00Z'), resolved_at: new Date('2026-02-25T14:00:00Z'), resolution_time_mins: 7440, root_cause: 'Loose display cable connection', solution: 'Reseated display cable and added cable tie for stability', parts_used: 'Display cable DC-100', customer_rating: 3, customer_feedback: 'Took a while but resolved.', updated_at: new Date('2026-02-26T10:00:00Z') },
      { id: 7, ticket_number: 'TKT-00007', machine_id: 9, raised_by: 3, assigned_to: 6, severity: 'P3_medium', category: 'hardware', title: 'Pneumatic actuator leak', description: 'Air leak detected in lane 2 pneumatic actuator. Sorting speed reduced.', status: 'in_progress', sla_hours: 24, created_at: new Date('2026-03-13T14:00:00Z'), updated_at: new Date('2026-03-14T10:00:00Z') },
      { id: 8, ticket_number: 'TKT-00008', machine_id: 7, raised_by: 3, assigned_to: 5, severity: 'P3_medium', category: 'electrical', title: 'Emergency stop button stuck', description: 'E-stop button on control panel is physically stuck. Had to use secondary stop.', status: 'resolved', sla_hours: 24, created_at: new Date('2026-03-10T09:00:00Z'), resolved_at: new Date('2026-03-10T17:00:00Z'), resolution_time_mins: 480, root_cause: 'Dust accumulation inside e-stop switch mechanism', solution: 'Cleaned switch, replaced spring mechanism, tested multiple times', parts_used: 'E-stop spring kit ES-50', updated_at: new Date('2026-03-10T17:00:00Z') },
      { id: 9, ticket_number: 'TKT-00009', machine_id: 10, raised_by: 4, assigned_to: 6, severity: 'P4_low', category: 'software', title: 'Grading accuracy below threshold', description: 'Size grading showing 5% deviation from expected values on small fruits.', status: 'open', sla_hours: 72, created_at: new Date('2026-03-14T16:00:00Z'), updated_at: new Date('2026-03-14T16:00:00Z') },
      { id: 10, ticket_number: 'TKT-00010', machine_id: 4, raised_by: 4, assigned_to: 5, severity: 'P3_medium', category: 'other', title: 'Network connectivity intermittent', description: 'Machine loses network connection every few hours. Status updates not reaching server.', status: 'reopened', sla_hours: 24, created_at: new Date('2026-03-01T11:00:00Z'), resolved_at: new Date('2026-03-03T10:00:00Z'), resolution_time_mins: 2820, root_cause: 'Faulty ethernet port on machine controller', solution: 'Replaced ethernet port and cable. Switched to WiFi adapter as backup.', parts_used: 'Ethernet port EP-30, WiFi adapter WA-10', reopen_count: 1, reopened_at: new Date('2026-03-12T09:00:00Z'), updated_at: new Date('2026-03-12T09:00:00Z') },
    ],
    skipDuplicates: true,
  })
  console.log('Tickets seeded')

  // -------------------------------------------------------------------------
  // 5. Ticket Comments
  // -------------------------------------------------------------------------
  await prisma.ticketComment.createMany({
    data: [
      { id: 1, ticket_id: 1, user_id: 4, message: 'Checked the sensor — calibration is off by 15%. Attempted recalibration but values drift back within minutes.', created_at: new Date('2026-03-13T11:00:00Z') },
      { id: 2, ticket_id: 1, user_id: 5, message: 'Ordering replacement sensor PS-200. ETA 2 days from Pune warehouse.', created_at: new Date('2026-03-13T12:30:00Z') },
      { id: 3, ticket_id: 1, user_id: 1, message: 'When can we expect the machine to be back online? We have a large order due on Monday.', created_at: new Date('2026-03-13T14:00:00Z') },
      { id: 4, ticket_id: 2, user_id: 4, message: 'Belt tension mechanism is damaged. Need to replace the full tensioner assembly.', created_at: new Date('2026-03-11T16:00:00Z') },
      { id: 5, ticket_id: 2, user_id: 5, message: 'Tensioner assembly dispatched from Mumbai. Should arrive by tomorrow morning.', created_at: new Date('2026-03-11T18:00:00Z') },
      { id: 6, ticket_id: 2, user_id: 5, message: 'This is the second time the belt has had issues. Please check the root cause.', created_at: new Date('2026-03-12T08:00:00Z') },
      { id: 7, ticket_id: 3, user_id: 3, message: 'Reproduced the crash. It happens when batch size exceeds 500 items per minute.', created_at: new Date('2026-03-08T14:00:00Z') },
      { id: 8, ticket_id: 3, user_id: 6, message: 'Patch available. Updating software remotely now.', created_at: new Date('2026-03-09T10:00:00Z') },
      { id: 9, ticket_id: 3, user_id: 3, message: 'Update applied. Running test cycles at 600 items/min — stable after 2 hours.', created_at: new Date('2026-03-09T15:00:00Z') },
      { id: 10, ticket_id: 7, user_id: 3, message: 'Air pressure dropping in lane 2. Suspect worn O-ring in actuator.', created_at: new Date('2026-03-13T15:00:00Z') },
      { id: 11, ticket_id: 7, user_id: 6, message: 'Order placed for O-ring kit OK-25. Will be at site by tomorrow.', created_at: new Date('2026-03-13T17:00:00Z') },
      { id: 12, ticket_id: 10, user_id: 4, message: 'Issue is back. Connection dropping again after ethernet port replacement.', created_at: new Date('2026-03-12T09:30:00Z') },
      { id: 13, ticket_id: 10, user_id: 5, message: 'Could be a switch issue at the facility. Will send engineer to check infrastructure.', created_at: new Date('2026-03-12T11:00:00Z') },
      { id: 14, ticket_id: 5, user_id: 3, message: 'Checked UPS and power supply. Voltage fluctuations detected. Need stabilizer.', created_at: new Date('2026-03-14T10:00:00Z') },
      { id: 15, ticket_id: 5, user_id: 6, message: 'Approved purchase of voltage stabilizer VS-500. Amit, please install on next visit.', created_at: new Date('2026-03-14T14:00:00Z') },
    ],
    skipDuplicates: true,
  })
  console.log('Ticket comments seeded')

  // -------------------------------------------------------------------------
  // 6. Site Visits
  // -------------------------------------------------------------------------
  await prisma.siteVisit.createMany({
    data: [
      { id: 1, machine_id: 3, engineer_id: 4, visit_date: new Date('2026-03-13'), visit_purpose: 'ticket', ticket_id: 1, findings: 'Color sensor on lane 3 completely failed. Internal crystal damaged.', actions_taken: 'Temporary bypass on lane 3. Machine running on remaining 7 lanes.', parts_replaced: 'None yet — awaiting replacement sensor', next_visit_due: new Date('2026-03-16'), created_at: new Date('2026-03-13T11:00:00Z') },
      { id: 2, machine_id: 1, engineer_id: 3, visit_date: new Date('2026-03-10'), visit_purpose: 'routine', findings: 'All systems operational. Minor wear on conveyor rollers.', actions_taken: 'Lubricated all moving parts. Tightened loose bolts on frame.', created_at: new Date('2026-03-10T16:00:00Z') },
      { id: 3, machine_id: 6, engineer_id: 4, visit_date: new Date('2026-03-05'), visit_purpose: 'ticket', ticket_id: 4, findings: 'Camera lens coating degraded. Humidity levels high at site.', actions_taken: 'Replaced camera module. Installed humidity shield over camera housing.', parts_replaced: 'Color camera module CM-200, Humidity shield HS-01', created_at: new Date('2026-03-05T16:00:00Z') },
      { id: 4, machine_id: 12, engineer_id: 4, visit_date: new Date('2026-03-01'), visit_purpose: 'installation', findings: 'New machine installation completed. All 6 lanes tested and calibrated.', actions_taken: 'Full installation, calibration, and operator training.', next_visit_due: new Date('2026-04-01'), created_at: new Date('2026-03-01T17:00:00Z') },
      { id: 5, machine_id: 7, engineer_id: 3, visit_date: new Date('2026-02-28'), visit_purpose: 'training', findings: 'Operator team needs refresher on calibration procedures.', actions_taken: 'Conducted 3-hour training session. Updated SOP documents.', created_at: new Date('2026-02-28T15:00:00Z') },
      { id: 6, machine_id: 9, engineer_id: 3, visit_date: new Date('2026-03-13'), visit_purpose: 'ticket', ticket_id: 7, findings: 'Confirmed air leak in lane 2 pneumatic actuator. O-ring worn out.', actions_taken: 'Reduced lane 2 speed as temporary fix. Ordered replacement O-ring.', parts_replaced: 'None yet — awaiting O-ring kit', next_visit_due: new Date('2026-03-15'), created_at: new Date('2026-03-13T16:00:00Z') },
    ],
    skipDuplicates: true,
  })
  console.log('Site visits seeded')

  // -------------------------------------------------------------------------
  // 7. Machine History
  // -------------------------------------------------------------------------
  await prisma.machineHistory.createMany({
    data: [
      { id: 1, machine_id: 3, change_type: 'status_change', old_value: 'running', new_value: 'down', changed_by: 4, notes: 'Machine stopped due to sensor malfunction', created_at: new Date('2026-03-13T10:00:00Z') },
      { id: 2, machine_id: 8, change_type: 'status_change', old_value: 'running', new_value: 'down', changed_by: 4, notes: 'Conveyor belt failure', created_at: new Date('2026-03-11T15:00:00Z') },
      { id: 3, machine_id: 1, change_type: 'software_update', old_value: 'v2.4', new_value: 'v2.5', changed_by: 3, notes: 'Updated to fix color sorting crash bug', created_at: new Date('2026-03-09T10:00:00Z') },
      { id: 4, machine_id: 6, change_type: 'status_change', old_value: 'down', new_value: 'running', changed_by: 4, notes: 'Camera replaced and tested', created_at: new Date('2026-03-05T15:30:00Z') },
      { id: 5, machine_id: 4, change_type: 'location_change', old_value: 'Warehouse 5, Satara Road, Pune', new_value: 'Cold Storage Unit 3, Sangli Road, Kolhapur', changed_by: 5, notes: 'Customer relocated machine to new processing facility', created_at: new Date('2025-12-15T10:00:00Z') },
      { id: 6, machine_id: 7, change_type: 'engineer_change', old_value: 'Priya Nair (id:4)', new_value: 'Amit Sharma (id:3)', changed_by: 5, notes: 'Zone reassignment — Amit now covers South India', created_at: new Date('2025-11-01T10:00:00Z') },
      { id: 7, machine_id: 11, change_type: 'status_change', old_value: 'running', new_value: 'offline', changed_by: 3, notes: 'No response from machine — possible network or power issue at site', created_at: new Date('2026-03-08T10:00:00Z') },
      { id: 8, machine_id: 2, change_type: 'software_update', old_value: 'v2.2', new_value: 'v2.3', changed_by: 3, notes: 'Routine software update', created_at: new Date('2025-10-20T10:00:00Z') },
      { id: 9, machine_id: 10, change_type: 'status_change', old_value: 'running', new_value: 'idle', changed_by: 4, notes: 'Off-season, no fruit supply at site', created_at: new Date('2026-03-10T12:00:00Z') },
      { id: 10, machine_id: 12, change_type: 'status_change', old_value: 'idle', new_value: 'offline', changed_by: 4, notes: 'Customer reported power shutdown at facility', created_at: new Date('2026-03-07T09:00:00Z') },
    ],
    skipDuplicates: true,
  })
  console.log('Machine history seeded')

  // -------------------------------------------------------------------------
  // 8. Activity Log
  // -------------------------------------------------------------------------
  await prisma.activityLog.createMany({
    data: [
      { id: 1, user_id: 4, action: 'ticket_raised', entity_type: 'ticket', entity_id: 1, details: 'Priya Nair raised P1 ticket TKT-00001 for HS-2024-0003: Sensor calibration error', created_at: new Date('2026-03-13T10:30:00Z') },
      { id: 2, user_id: 4, action: 'status_updated', entity_type: 'machine', entity_id: 3, details: 'Priya Nair updated HS-2024-0003 status from running to down', created_at: new Date('2026-03-13T10:00:00Z') },
      { id: 3, user_id: 3, action: 'status_updated', entity_type: 'machine', entity_id: 1, details: 'Amit Sharma updated HS-2024-0001 status to running — 6.5 tons Mango processed', created_at: new Date('2026-03-15T08:30:00Z') },
      { id: 4, user_id: 6, action: 'ticket_resolved', entity_type: 'ticket', entity_id: 3, details: 'Deepa Kulkarni resolved TKT-00003: Software crash during color sorting', created_at: new Date('2026-03-09T16:00:00Z') },
      { id: 5, user_id: 5, action: 'ticket_resolved', entity_type: 'ticket', entity_id: 4, details: 'Aslam Sheikh resolved TKT-00004: Color camera malfunction', created_at: new Date('2026-03-05T15:30:00Z') },
      { id: 6, user_id: 4, action: 'site_visit_logged', entity_type: 'machine', entity_id: 12, details: 'Priya Nair logged installation visit for HS-2025-0012 at Nagpur', created_at: new Date('2026-03-01T17:00:00Z') },
      { id: 7, user_id: 5, action: 'user_created', entity_type: 'user', entity_id: 2, details: 'Aslam Sheikh created customer account for Sunita Reddy', created_at: new Date('2024-03-20T10:00:00Z') },
      { id: 8, user_id: 3, action: 'software_updated', entity_type: 'machine', entity_id: 1, details: 'Amit Sharma updated HS-2024-0001 software from v2.4 to v2.5', created_at: new Date('2026-03-09T10:00:00Z') },
      { id: 9, user_id: 4, action: 'ticket_reopened', entity_type: 'ticket', entity_id: 10, details: 'Priya Nair reopened TKT-00010: Network connectivity still intermittent', created_at: new Date('2026-03-12T09:00:00Z') },
      { id: 10, user_id: 3, action: 'site_visit_logged', entity_type: 'machine', entity_id: 9, details: 'Amit Sharma logged ticket visit for HS-2025-0009 — pneumatic actuator issue', created_at: new Date('2026-03-13T16:00:00Z') },
    ],
    skipDuplicates: true,
  })
  console.log('Activity log seeded')

  // -------------------------------------------------------------------------
  // Reset auto-increment sequences so future inserts don't collide with seeded IDs
  // -------------------------------------------------------------------------
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('users', 'id'), (SELECT MAX(id) FROM users))`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('machines', 'id'), (SELECT MAX(id) FROM machines))`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('daily_logs', 'id'), (SELECT MAX(id) FROM daily_logs))`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('tickets', 'id'), (SELECT MAX(id) FROM tickets))`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('ticket_comments', 'id'), (SELECT MAX(id) FROM ticket_comments))`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('site_visits', 'id'), (SELECT MAX(id) FROM site_visits))`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('machine_history', 'id'), (SELECT MAX(id) FROM machine_history))`
  await prisma.$executeRaw`SELECT setval(pg_get_serial_sequence('activity_log', 'id'), (SELECT MAX(id) FROM activity_log))`

  console.log('Sequences reset')
  console.log('Database seeded successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
