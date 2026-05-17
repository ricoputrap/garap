import { expect, test } from '@playwright/test'
import { addItemToFirstCard, startFresh } from './helpers'

test('export JSON, import a different snapshot, data is replaced', async ({ page }) => {
  await startFresh(page)
  await page.goto('/')

  // Seed dataset A.
  await page.getByRole('button', { name: /create your first board/i }).click()
  // Rename the board so we can tell snapshots apart.
  await page.getByRole('button', { name: /edit board name/i }).first().click()
  const boardInput = page.getByLabel('Edit board name')
  await boardInput.fill('Dataset A')
  await boardInput.press('Enter')

  await page.getByRole('link', { name: /open/i }).first().click()
  await page.getByRole('button', { name: /add a card/i }).click()
  const cardInput = page.getByLabel('Edit card title')
  await cardInput.fill('Card A')
  await cardInput.press('Enter')
  await addItemToFirstCard(page, 'Item A')

  // Capture an export by intercepting the download click.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /export backup/i }).click(),
  ])
  const path = await download.path()
  expect(path).toBeTruthy()

  // Build a different snapshot in code and import it.
  const replacement = {
    version: 1,
    exportedAt: Date.now(),
    boards: [{ id: 'b-x', name: 'Dataset B', createdAt: 1 }],
    cards: [{ id: 'c-x', boardId: 'b-x', title: 'Card B', createdAt: 2 }],
    items: [
      {
        id: 'i-x',
        cardId: 'c-x',
        name: 'Item B',
        completed: false,
        completedAt: null,
        createdAt: 3,
      },
    ],
    todayRefs: [],
    weekRefs: [],
  }

  await page.getByRole('button', { name: /import backup/i }).click()
  const fileInput = page.locator('#import-file')
  await fileInput.setInputFiles({
    name: 'replace.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(replacement)),
  })
  await page.getByRole('button', { name: /replace all data/i }).click()

  // We were viewing Dataset A's board which no longer exists; head to index
  // so the imported board surfaces in the list.
  await page.getByRole('link', { name: /all boards/i }).click()
  await expect(page.getByRole('heading', { name: 'Dataset B' })).toBeVisible()
  await expect(page.getByText('Dataset A')).toHaveCount(0)
})

test('import rejects malformed JSON inline', async ({ page }) => {
  await startFresh(page)
  await page.goto('/')

  await page.getByRole('button', { name: /import backup/i }).click()
  await page.locator('#import-file').setInputFiles({
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not json'),
  })
  await page.getByRole('button', { name: /replace all data/i }).click()

  await expect(page.getByRole('alert')).toContainText(/not valid json/i)
})
