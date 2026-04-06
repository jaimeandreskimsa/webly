const { Pool } = require('pg')
const pool = new Pool({ connectionString: 'postgresql://jaimegomez@127.0.0.1:5432/webtory' })

async function run() {
  await pool.query(`ALTER TYPE plan ADD VALUE IF NOT EXISTS 'broker'`)
  console.log('✓ Added broker to plan enum')

  await pool.query(`
    CREATE TABLE IF NOT EXISTS propiedades (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
      titulo text NOT NULL,
      descripcion text,
      precio integer,
      moneda text NOT NULL DEFAULT 'CLP',
      tipo text NOT NULL DEFAULT 'venta',
      tipo_propiedad text NOT NULL DEFAULT 'casa',
      superficie integer,
      habitaciones integer,
      banos integer,
      estacionamientos integer,
      ubicacion text,
      ciudad text,
      imagenes jsonb DEFAULT '[]',
      destacada boolean DEFAULT false,
      activa boolean DEFAULT true,
      created_at timestamp DEFAULT now() NOT NULL,
      updated_at timestamp DEFAULT now() NOT NULL
    )
  `)
  console.log('✓ Created propiedades table')
  await pool.end()
}

run().catch(e => { console.error(e.message); process.exit(1) })
