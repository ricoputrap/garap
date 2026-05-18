import { expect, test } from '@playwright/test'
import { addItemToFirstCard, startFresh } from './helpers'

test.describe('mobile bottom nav', () => {
  test('bottom nav visible on mobile, aside hidden', async ({ page }) => {
    await startFresh(page)
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    await expect(page.locator('aside')).toBeHidden()
  })

  test('tap Today tab navigates to /today and shows the today list', async ({ page }) => {
    await startFresh(page)
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Today' }).click()
    await expect(page).toHaveURL(/\/today$/)
    await expect(page.getByRole('heading', { name: 'Today' })).toBeVisible()
  })

  test('tap Week tab navigates to /week', async ({ page }) => {
    await startFresh(page)
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Week' }).click()
    await expect(page).toHaveURL(/\/week$/)
    await expect(page.getByRole('heading', { name: 'Week' })).toBeVisible()
  })

  test('Board tab returns to last visited board route', async ({ page }) => {
    await startFresh(page)
    await page.goto('/')
    await page.getByRole('button', { name: /create your first board/i }).click()
    await page.getByRole('link', { name: /open/i }).first().click()
    const boardUrl = page.url()

    const nav = page.getByRole('navigation', { name: 'Primary' })
    await nav.getByRole('button', { name: 'Today' }).click()
    await expect(page).toHaveURL(/\/today$/)

    await nav.getByRole('button', { name: 'Board' }).click()
    await expect(page).toHaveURL(boardUrl)
  })

  test('tap Board while on board route resets to /', async ({ page }) => {
    await startFresh(page)
    await page.goto('/')
    await page.getByRole('button', { name: /create your first board/i }).click()
    await page.getByRole('link', { name: /open/i }).first().click()
    await expect(page).toHaveURL(/\/board\//)

    await page
      .getByRole('navigation', { name: 'Primary' })
      .getByRole('button', { name: 'Board' })
      .click()
    await expect(page).toHaveURL(/\/$/)
  })

  test('mobile today route shows item added to Today', async ({ page }) => {
    await startFresh(page)
    await page.goto('/')
    await page.getByRole('button', { name: /create your first board/i }).click()
    await page.getByRole('link', { name: /open/i }).first().click()
    await page.getByRole('button', { name: /add a card/i }).click()
    const titleInput = page.getByLabel('Edit card title')
    await titleInput.fill('Card')
    await titleInput.press('Enter')
    await addItemToFirstCard(page, 'Ship mobile')
    await page.getByRole('button', { name: 'Add to Today' }).first().click()

    await page.getByRole('navigation', { name: 'Primary' }).getByRole('button', { name: 'Today' }).click()
    await expect(page.locator('main').getByText('Ship mobile')).toBeVisible()
  })
})
