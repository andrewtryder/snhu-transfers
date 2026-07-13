import Honeybadger from '@honeybadger-io/js'
import { HONEYBADGER_FILTERS } from './honeybadger.filters.js'

/**
 * Server runtime config for Honeybadger.
 * Uses the server-only API key; never expose HONEYBADGER_API_KEY to the client.
 */
Honeybadger.configure({
  apiKey: process.env.HONEYBADGER_API_KEY,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  revision: process.env.VERCEL_GIT_COMMIT_SHA,
  projectRoot: 'webpack:///./',
  filters: HONEYBADGER_FILTERS,
})
