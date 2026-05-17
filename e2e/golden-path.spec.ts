import { expect, test } from '@playwright/test'
import { addItemToFirstCard, startFresh } from './helpers'

test('create board → add card → add items → check one off', async ({ page }) => {
  await startFresh(page)
  await page.goto('/')

  // Empty-state CTA visible on fresh load.
  await expect(page.getByRole('heading', { name: /a blank page/i })).toBeVisible()

  await page.getByRole('button', { name: /create your first board/i }).click()
  await expect(page.getByRole('heading', { name: 'Untitled board' })).toBeVisible()

  await page.getByRole('link', { name: /open/i }).first().click()
  await expect(page.getByRole('button', { name: /add a card/i })).toBeVisible()

  await page.getByRole('button', { name: /add a card/i }).click()
  const titleInput = page.getByLabel('Edit card title')
  await titleInput.fill('Sprint')
  await titleInput.press('Enter')
  await expect(page.getByRole('heading', { name: 'Sprint' })).toBeVisible()

  await addItemToFirstCard(page, 'Ship Garap')
  await addItemToFirstCard(page, 'Write docs')
  await expect(page.getByText('Ship Garap')).toBeVisible()
  await expect(page.getByText('Write docs')).toBeVisible()

  // Tick the first item. After click, completed items sort to the bottom of
  // the card and gain a strikethrough — assert on that visible state.
  await page.getByRole('checkbox').first().click()
  await expect(page.getByText('Ship Garap')).toHaveClass(/line-through/)
})

test('empty-state CTA visible on fresh load', async ({ page }) => {
  await startFresh(page)
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /your boards/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /create your first board/i })).toBeVisible()
})
