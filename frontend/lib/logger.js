/**
 * Logger : en production, console.log est no-op pour éviter les fuites.
 */
const isDev = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production'

export const logger = {
  log: (...args) => { if (isDev) console.log(...args) },
  warn: (...args) => { if (isDev) console.warn(...args) },
  error: (...args) => { console.error(...args) },
  info: (...args) => { if (isDev) console.info(...args) }
}
