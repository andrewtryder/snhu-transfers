import { Honeybadger } from '@honeybadger-io/react'
import { HONEYBADGER_FILTERS } from './honeybadger.filters.js'

/**
 * Browser runtime config for Honeybadger.
 * Safely no-ops when NEXT_PUBLIC_HONEYBADGER_API_KEY is absent.
 */
const apiKey = process.env.NEXT_PUBLIC_HONEYBADGER_API_KEY

if (apiKey) {
  Honeybadger.configure({
    apiKey,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    revision: process.env.VERCEL_GIT_COMMIT_SHA,
    projectRoot: 'webpack://_N_E/./',
    filters: HONEYBADGER_FILTERS,
    ignoreBrowserExtensionErrors: true,
  })

  // Drop opaque unhandled-rejection noise (empty / unspecified reasons) that
  // Honeybadger documents as crawler/extension chatter, not actionable app bugs.
  Honeybadger.beforeNotify((notice) => {
    if (
      /UnhandledPromiseRejectionWarning: \{\}/.test(notice.message) ||
      /UnhandledPromiseRejectionWarning: Unspecified reason/.test(notice.message)
    ) {
      return false
    }
  })
}
