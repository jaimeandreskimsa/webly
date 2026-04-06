/**
 * Script para asignar rol de admin a un usuario por email
 * Uso: npx tsx scripts/make-admin.ts tu@email.com
 */

import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { eq } from 'drizzle-orm'
import * as schema from '../lib/db/schema'

async function main() {
  const email = process.argv[2]

  if (!email) {
    console.error('❌ Debes pasar un email como argumento')
    console.error('   Uso: npx tsx scripts/make-admin.ts tu@email.com')
    process.exit(1)
  }

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL no está configurada en .env.local')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
  const db = drizzle(pool, { schema })

  const [usuario] = await db
    .select()
    .from(schema.usuarios)
    .where(eq(schema.usuarios.email, email))
    .limit(1)

  if (!usuario) {
    console.error(`❌ No se encontró usuario con email: ${email}`)
    process.exit(1)
  }

  await db
    .update(schema.usuarios)
    .set({ rol: 'admin', updatedAt: new Date() })
    .where(eq(schema.usuarios.email, email))

  console.log(`✅ Usuario "${usuario.nombre}" (${email}) ahora es ADMIN`)
  console.log(`   Accede al panel en: /admin`)
  process.exit(0)
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
