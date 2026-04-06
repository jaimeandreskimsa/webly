require('dotenv').config({ path: '.env.local' })
const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function migrate() {
  const client = await pool.connect()
  try {
    await client.query(`
      ALTER TABLE suscripciones
      ADD COLUMN IF NOT EXISTS sitio_id UUID REFERENCES sitios(id) ON DELETE CASCADE
    `)
    console.log('✓ Added sitio_id to suscripciones')
  } finally {
    client.release()
    await pool.end()
  }
}

migrate().catch(console.error)
