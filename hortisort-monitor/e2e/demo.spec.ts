import { test, expect } from '@playwright/test'

const EMAIL = 'aslam@hortisort.com'
const PASSWORD = 'password_123'

test('HortiSort Phase B demo walkthrough', async ({ page }) => {

  // ── 1. Login ───────────────────────────────────────────────────────────────
  await page.goto('/')
  await page.waitForSelector('input[type="email"]', { state: 'visible' })
  await page.waitForTimeout(500)
  await page.fill('input[type="email"]', EMAIL)
  await page.fill('input[type="password"]', PASSWORD)
  await page.waitForTimeout(500)
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard', { timeout: 10000 })
  await page.waitForTimeout(1500)

  // ── 2. Theme toggle: light → dark → light ──────────────────────────────────
  const toggle = page.getByLabel(/switch to (light|dark) theme/i)
  await toggle.click()
  await page.waitForTimeout(1200)
  await toggle.click()
  await page.waitForTimeout(1200)

  // ── 3. NotificationBell ────────────────────────────────────────────────────
  await page.getByLabel('Notifications').click()
  await expect(page.getByTestId('notification-panel')).toBeVisible()
  await page.waitForTimeout(2000)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)

  // ── 4. Operator Console ────────────────────────────────────────────────────
  await page.getByRole('button', { name: /operator console/i }).click()
  await expect(page.getByText(/HortiSort Operator Console/i)).toBeVisible()
  await page.waitForTimeout(3000)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(1000)

  // ── 5. Machines page ───────────────────────────────────────────────────────
  await page.getByRole('link', { name: /machines/i }).first().click()
  await page.waitForURL('**/machines')
  await page.waitForTimeout(1500)

  // ── 6. Machine detail ──────────────────────────────────────────────────────
  const machineRow = page.getByRole('row').nth(1)
  await machineRow.click()
  await page.waitForTimeout(2000)
  await page.goBack()
  await page.waitForTimeout(1000)

  // ── 7. Tickets page ────────────────────────────────────────────────────────
  await page.getByRole('link', { name: /tickets/i }).first().click()
  await page.waitForTimeout(1500)

  // ── 8. Ticket detail ──────────────────────────────────────────────────────
  const ticketRow = page.getByRole('row').nth(1)
  if (await ticketRow.isVisible()) {
    await ticketRow.click()
    await page.waitForTimeout(2000)
    await page.goBack()
    await page.waitForTimeout(1000)
  }

  // ── 9. Daily Logs ──────────────────────────────────────────────────────────
  await page.getByRole('link', { name: /daily logs/i }).first().click()
  await page.waitForTimeout(1500)

  // ── 10. Site Visits ────────────────────────────────────────────────────────
  await page.getByRole('link', { name: /site visits/i }).first().click()
  await page.waitForTimeout(1500)

  // ── 11. Admin ─────────────────────────────────────────────────────────────
  const adminLink = page.getByRole('link', { name: /admin/i }).first()
  if (await adminLink.isVisible()) {
    await adminLink.click()
    await page.waitForTimeout(1500)
  }

  // Keep browser open at the end so you can explore
  await page.waitForTimeout(5000)
})
