import { expect, test, type Page } from '@playwright/test'
import { addItemToFirstCard, startFresh } from './helpers'

const seedAndCompleteInToday = async (page: Page, text: string) => {
  await page.goto('/')
  await page.getByRole('button', { name: /create your first board/i }).click()
  await page.getByRole('link', { name: /open/i }).first().click()
  await page.getByRole('button', { name: /add a card/i }).click()
  const titleInput = page.getByLabel('Edit card title')
  await titleInput.fill('Card')
  await titleInput.press('Enter')
  await addItemToFirstCard(page, text)
  await page.getByRole('button', { name: 'Add to Today' }).first().click()
  const panel = page.locator('aside')
  await panel.getByRole('checkbox').first().click()
}

const triggerBoundaryClear = async (page: Page) => {
  // Force a today-boundary clear by invoking the service directly via window.
  // The app exposes nothing for tests, so reach into Dexie through page.evaluate.
  await page.evaluate(async () => {
    const mod = await import('/src/services/history/snapshot.ts')
    await mod.snapshotAndClearToday(Date.now())
  })
}

test('completed Today item appears in History after boundary clear', async ({ page }) => {
  await startFresh(page)
  await seedAndCompleteInToday(page, 'Ship Garap')

  await triggerBoundaryClear(page)

  await page.getByRole('link', { name: 'History' }).click()
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible()
  await expect(page.getByText('Ship Garap')).toBeVisible()
  await expect(page.getByText('1 done')).toBeVisible()
})

test('History empty state shows when nothing recorded', async ({ page }) => {
  await startFresh(page)
  await page.goto('/')
  await page.getByRole('link', { name: 'History' }).click()
  await expect(page.getByText(/Nothing recorded yet/i)).toBeVisible()
})
