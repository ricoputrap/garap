const KEY = 'garap:last-board-route'

export const rememberBoardRoute = (path: string) => {
  try {
    sessionStorage.setItem(KEY, path)
  } catch {
    // sessionStorage unavailable — no-op
  }
}

export const readLastBoardRoute = (): string => {
  try {
    return sessionStorage.getItem(KEY) ?? '/'
  } catch {
    return '/'
  }
}
