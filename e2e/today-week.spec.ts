import { expect, test, type Page } from '@playwright/test'
import { addItemToFirstCard, startFresh } from './helpers'

const seedBoardWithItem = async (page: Page, text: string) => {
  await page.goto('/')
  await page.getByRole('button', { name: /create your first board/i }).click()
  await page.getByRole('link', { name: /open/i }).first().click()
  await page.getByRole('button', { name: /add a card/i }).click()
  const titleInput = page.getByLabel('Edit card title')
  await titleInput.fill('Card')
  await titleInput.press('Enter')
  await addItemToFirstCard(page, text)
}

test('add item to Today; check in Today; card row reflects completed', async ({ page }) => {
  await startFresh(page)
  await seedBoardWithItem(page, 'Ship Garap')

  await page.getByRole('button', { name: 'Add to Today' }).first().click()

  // Panel shows the item under the Today tab (default).
  const panel = page.getByRole('complementary').or(page.locator('aside'))
  await expect(panel.getByText('Ship Garap')).toBeVisible()

  // Tick in panel; card-side row gets strikethrough class.
  await panel.getByRole('checkbox').first().click()
  await expect(page.locator('main').getByText('Ship Garap')).toHaveClass(/line-through/)
})

test('add item to Week; remove from Week; item remains in card', async ({ page }) => {
  await startFresh(page)
  await seedBoardWithItem(page, 'Read papers')

  await page.getByRole('button', { name: 'Add to Week' }).first().click()
  await page.getByRole('tab', { name: 'Week' }).click()
  const panel = page.locator('aside')
  await expect(panel.getByText('Read papers')).toBeVisible()

  await panel.getByRole('button', { name: /remove from week/i }).first().click()
  await expect(panel.getByText('Read papers')).toHaveCount(0)

  // Item still on the card.
  await expect(page.locator('main').getByText('Read papers')).toBeVisible()
})

test('add same item to Today and Week independently; both lists show it', async ({ page }) => {
  await startFresh(page)
  await seedBoardWithItem(page, 'Plan day')

  await page.getByRole('button', { name: 'Add to Today' }).first().click()
  await page.getByRole('button', { name: 'Add to Week' }).first().click()

  const panel = page.locator('aside')
  await expect(panel.getByText('Plan day')).toBeVisible()

  await page.getByRole('tab', { name: 'Week' }).click()
  await expect(panel.getByText('Plan day')).toBeVisible()
})

test('active tab persists across reload', async ({ page }) => {
  await startFresh(page)
  await page.goto('/')
  await page.getByRole('tab', { name: 'Week' }).click()
  await page.reload()
  await expect(page.getByRole('tab', { name: 'Week' })).toHaveAttribute('data-state', 'active')
})
