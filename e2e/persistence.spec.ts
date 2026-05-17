import { expect, test } from '@playwright/test'
import { addItemToFirstCard, startFresh } from './helpers'

test('boards and items survive a reload (IndexedDB persistence)', async ({ page }) => {
  await startFresh(page)
  await page.goto('/')

  await page.getByRole('button', { name: /create your first board/i }).click()
  await page.getByRole('link', { name: /open/i }).first().click()
  await page.getByRole('button', { name: /add a card/i }).click()
  const titleInput = page.getByLabel('Edit card title')
  await titleInput.fill('Persist')
  await titleInput.press('Enter')
  await addItemToFirstCard(page, 'Stay alive')
  await expect(page.getByText('Stay alive')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { name: 'Persist' })).toBeVisible()
  await expect(page.getByText('Stay alive')).toBeVisible()
})

test('viewports under 768px show the bigger-screen message', async ({ page }) => {
  await startFresh(page)
  await page.setViewportSize({ width: 600, height: 800 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /bring a bigger screen/i })).toBeVisible()
  await expect(page.getByRole('link', { name: /open/i })).toHaveCount(0)
})
