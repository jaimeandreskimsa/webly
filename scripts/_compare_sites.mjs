// Compara HTML de sitios en producción
import { Pool } from 'pg'
import { writeFileSync } from 'fs'

const DB = 'postgresql://postgres:czlDYMmQOAIHousOibUhsMmAQDYVleWD@maglev.proxy.rlwy.net:23088/railway'
const pool = new Pool({ connectionString: DB, ssl: { rejectUnauthorized: false } })

const { rows } = await pool.query(`
  SELECT s.id, s.nombre, s.plan, s.estado, u.email,
    v.html_completo, v.modelo_usado, v.tokens_usados, v.numero_version,
    length(v.html_completo) as html_len
  FROM sitios s
  JOIN usuarios u ON u.id = s.user_id
  LEFT JOIN versiones_sitio v ON v.sitio_id = s.id AND v.es_actual = true
  ORDER BY s.created_at DESC
`)

for (const r of rows) {
  console.log(`\n── ${r.nombre} (${r.plan}) — ${r.email}`)
  console.log(`   estado: ${r.estado} | modelo: ${r.modelo_usado} | tokens: ${r.tokens_usados} | html: ${r.html_len} chars`)
  if (r.html_completo) {
    writeFileSync(`/tmp/sitio_${r.nombre.replace(/\s/g,'_')}.html`, r.html_completo)
    console.log(`   → guardado en /tmp/sitio_${r.nombre.replace(/\s/g,'_')}.html`)
    // Revisar si tiene logo/imagenes
    const html = r.html_completo
    console.log(`   tiene <img>: ${(html.match(/<img/gi)||[]).length} imgs`)
    console.log(`   tiene gradiente: ${html.includes('gradient')}`)
    console.log(`   tiene animación: ${html.includes('animation') || html.includes('@keyframes')}`)
    console.log(`   tiene logo: ${html.toLowerCase().includes('logo')}`)
    console.log(`   tiene cloudinary: ${html.includes('cloudinary')}`)
  }
}

await pool.end()
