import type { Page } from '@playwright/test'

/**
 * Wipe IndexedDB + localStorage on the next navigation so each test starts
 * from a virgin app. Call before any `page.goto(...)`.
 */
/**
 * Wipe IndexedDB + localStorage exactly once per test, before the very first
 * navigation. Subsequent navigations (reload, etc.) keep the data so we can
 * exercise persistence-sensitive flows.
 */
export const startFresh = async (page: Page): Promise<void> => {
  await page.addInitScript(() => {
    const KEY = '__garap_wiped'
    if (sessionStorage.getItem(KEY)) return
    sessionStorage.setItem(KEY, '1')
    const wipe = async () => {
      try {
        const dbs = await indexedDB.databases?.()
        if (dbs) {
          await Promise.all(
            dbs.map(
              (d) =>
                new Promise<void>((resolve) => {
                  if (!d.name) return resolve()
                  const req = indexedDB.deleteDatabase(d.name)
                  req.onsuccess = req.onerror = req.onblocked = () => resolve()
                }),
            ),
          )
        }
      } catch {
        /* private mode etc. — ignore */
      }
      try {
        localStorage.clear()
      } catch {
        /* noop */
      }
    }
    void wipe()
  })
}

export const addItemToFirstCard = async (page: Page, text: string): Promise<void> => {
  const input = page.getByPlaceholder('Add a task…').first()
  await input.click()
  await input.fill(text)
  await input.press('Enter')
}
