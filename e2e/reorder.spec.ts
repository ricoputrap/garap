import { expect, test, type Locator, type Page } from '@playwright/test'
import { addItemToFirstCard, startFresh } from './helpers'

const dragHandle = async (row: Locator) => row.getByRole('button', { name: 'Reorder task' })

const dragRowOver = async (page: Page, from: Locator, to: Locator) => {
  const handle = await dragHandle(from)
  const fromBox = await handle.boundingBox()
  const toBox = await to.boundingBox()
  if (!fromBox || !toBox) throw new Error('row bounding box missing')

  await page.mouse.move(fromBox.x + fromBox.width / 2, fromBox.y + fromBox.height / 2)
  await page.mouse.down()
  // dnd-kit requires several intermediate moves to register a drag.
  const steps = 10
  const targetX = toBox.x + toBox.width / 2
  const targetY = toBox.y + toBox.height / 2
  for (let i = 1; i <= steps; i += 1) {
    await page.mouse.move(
      fromBox.x + ((targetX - fromBox.x) * i) / steps,
      fromBox.y + ((targetY - fromBox.y) * i) / steps,
      { steps: 2 },
    )
  }
  await page.mouse.up()
}

const setupBoardWithItems = async (page: Page) => {
  await startFresh(page)
  await page.goto('/')
  await page.getByRole('button', { name: /create your first board/i }).click()
  await page.getByRole('link', { name: /open/i }).first().click()
  await page.getByRole('button', { name: /add a card/i }).click()
  const titleInput = page.getByLabel('Edit card title')
  await titleInput.fill('Sprint')
  await titleInput.press('Enter')
  await addItemToFirstCard(page, 'alpha')
  await addItemToFirstCard(page, 'beta')
  await addItemToFirstCard(page, 'gamma')
}

test('drag-reorder inside a card on the board', async ({ page }) => {
  await setupBoardWithItems(page)

  const cardList = page.locator('article').filter({ hasText: 'Sprint' }).locator('ul').first()
  const rowsBefore = await cardList.locator('li').allTextContents()
  expect(rowsBefore.map((s) => s.trim().replace(/\s+/g, ' '))).toEqual(
    expect.arrayContaining(['alpha', 'beta', 'gamma'].map(expect.stringContaining)),
  )

  const alpha = cardList.locator('li').filter({ hasText: 'alpha' })
  const gamma = cardList.locator('li').filter({ hasText: 'gamma' })

  // Drag alpha onto gamma → alpha becomes last.
  await dragRowOver(page, alpha, gamma)

  await expect
    .poll(async () => {
      const rows = await cardList.locator('li').allTextContents()
      return rows.map((s) => s.match(/(alpha|beta|gamma)/)?.[1]).filter(Boolean)
    })
    .toEqual(['beta', 'gamma', 'alpha'])
})

test('drag-reorder inside Today panel', async ({ page }) => {
  await setupBoardWithItems(page)

  // Add all three items to Today.
  const cardList = page.locator('article').filter({ hasText: 'Sprint' }).locator('ul').first()
  for (const name of ['alpha', 'beta', 'gamma']) {
    await cardList
      .locator('li')
      .filter({ hasText: name })
      .getByRole('button', { name: /Add to Today/i })
      .click()
  }

  const panel = page.locator('[role="tabpanel"]').filter({ hasText: 'Sprint' })
  await expect(panel).toBeVisible()
  const alpha = panel.locator('li').filter({ hasText: 'alpha' })
  const gamma = panel.locator('li').filter({ hasText: 'gamma' })

  await dragRowOver(page, alpha, gamma)

  await expect
    .poll(async () => {
      const rows = await panel.locator('li').allTextContents()
      return rows.map((s) => s.match(/(alpha|beta|gamma)/)?.[1]).filter(Boolean)
    })
    .toEqual(['beta', 'gamma', 'alpha'])

  // Board card view stays untouched — alpha still first.
  const boardRows = await cardList.locator('li').allTextContents()
  expect(boardRows[0]).toContain('alpha')
})

test('drag-reorder inside Week panel', async ({ page }) => {
  await setupBoardWithItems(page)

  const cardList = page.locator('article').filter({ hasText: 'Sprint' }).locator('ul').first()
  for (const name of ['alpha', 'beta', 'gamma']) {
    await cardList
      .locator('li')
      .filter({ hasText: name })
      .getByRole('button', { name: /Add to Week/i })
      .click()
  }

  await page.getByRole('tab', { name: 'Week' }).click()

  const panel = page.locator('[role="tabpanel"]').filter({ hasText: 'Sprint' })
  await expect(panel).toBeVisible()
  const alpha = panel.locator('li').filter({ hasText: 'alpha' })
  const gamma = panel.locator('li').filter({ hasText: 'gamma' })

  await dragRowOver(page, alpha, gamma)

  await expect
    .poll(async () => {
      const rows = await panel.locator('li').allTextContents()
      return rows.map((s) => s.match(/(alpha|beta|gamma)/)?.[1]).filter(Boolean)
    })
    .toEqual(['beta', 'gamma', 'alpha'])
})
