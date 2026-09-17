// Task 832 I0 probe D — verify the R1/R2 assumptions against the real running app (guest, fixture
// server): (1) desktop-1024 header login Button is visible (visibleFrom="md"); (2) mobile
// hamburger opens MobileNavDrawer (role=dialog) then its own login Button; (3) clicking that
// button closes the nav drawer and leaves exactly one dialog containing input[type=email]
// (AuthSheet) within 1000ms.
import { chromium } from 'playwright'
import { readFileSync } from 'node:fs'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const LOCALES = ['sq', 'en', 'uk', 'it']
const VIEWPORTS = [
  { name: 'mobile-320', width: 320, height: 812 },
  { name: 'mobile-375', width: 375, height: 812 },
  { name: 'mobile-390', width: 390, height: 844 },
  { name: 'desktop-1024', width: 1024, height: 768 },
]

function loadLabels(locale) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
  return { loginLabel: messages.nav.login, openMenuLabel: messages.common.aria_open_menu }
}

const browser = await chromium.launch({ headless: true })
const out = []

for (const locale of LOCALES) {
  const { loginLabel, openMenuLabel } = loadLabels(locale)
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } })
    const row = { locale, vp: vp.name, loginLabel, openMenuLabel }
    try {
      await page.goto(`${BASE_URL}/${locale}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(500)
      if (vp.width >= 768) {
        const loginBtn = page.locator('header.site-header').getByRole('button', { name: loginLabel, exact: true }).first()
        row.desktopLoginCount = await loginBtn.count()
        row.desktopLoginDisplay = row.desktopLoginCount > 0 ? await loginBtn.evaluate((el) => getComputedStyle(el).display) : null
        if (row.desktopLoginCount > 0) {
          await loginBtn.click({ timeout: 10000 })
          await page.waitForTimeout(1000)
          row.dialogCountAfterClick = await page.evaluate(() => document.querySelectorAll('[role="dialog"], [role="alertdialog"]').length)
          row.emailFieldPresent = await page.evaluate(() => !!document.querySelector('[role="dialog"] input[type="email"]'))
        }
      } else {
        const hamburger = page.locator('header.site-header').getByRole('button', { name: openMenuLabel, exact: true }).first()
        row.hamburgerCount = await hamburger.count()
        if (row.hamburgerCount > 0) {
          await hamburger.click({ timeout: 10000 })
          await page.waitForSelector('[role="dialog"], [role="alertdialog"]', { timeout: 5000 }).catch(() => {})
          row.dialogCountAfterHamburger = await page.evaluate(() => document.querySelectorAll('[role="dialog"], [role="alertdialog"]').length)
          const drawerLoginBtn = page.locator('[role="dialog"], [role="alertdialog"]').getByRole('button', { name: loginLabel, exact: true }).first()
          row.drawerLoginCount = await drawerLoginBtn.count()
          if (row.drawerLoginCount > 0) {
            await drawerLoginBtn.click({ timeout: 10000 })
            await page.waitForTimeout(1000)
            row.dialogCountAfterLoginClick = await page.evaluate(() => document.querySelectorAll('[role="dialog"], [role="alertdialog"]').length)
            row.emailFieldPresent = await page.evaluate(() => !!document.querySelector('[role="dialog"] input[type="email"]'))
          }
        }
      }
    } catch (err) {
      row.error = String(err.message ?? err).slice(0, 300)
    } finally {
      await page.close()
    }
    out.push(row)
  }
}

await browser.close()
console.log(JSON.stringify(out, null, 2))
