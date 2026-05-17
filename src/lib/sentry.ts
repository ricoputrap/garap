/**
 * Sentry init placeholder. Wired only in production builds; dev/test are no-ops.
 * Full implementation arrives with the Sentry dependency in a later PR per PRD.
 */
export const initSentry = (): void => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    // Intentionally deferred — see PRD § Error Reporting (Sentry).
  }
}
