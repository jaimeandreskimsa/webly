import type { Config } from 'drizzle-kit'
import { loadEnvConfig } from '@next/env'

loadEnvConfig(process.cwd())

export default {
  schema: './lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: '127.0.0.1',
    port: 5432,
    database: 'webtory',
    user: 'jaimegomez',
    ssl: false,
  },
} satisfies Config
