import pg from 'pg'
const { Pool } = pg
const pool = new Pool({ connectionString: 'postgresql://postgres:czlDYMmQOAIHousOibUhsMmAQDYVleWD@maglev.proxy.rlwy.net:23088/railway', ssl: { rejectUnauthorized: false } })
await pool.query("DELETE FROM versiones_sitio WHERE sitio_id = 'd01918d3-c2c5-469d-a139-e0928b118255'")
await pool.query("DELETE FROM sitios WHERE id = 'd01918d3-c2c5-469d-a139-e0928b118255'")
console.log('Sitio duplicado eliminado')
await pool.query("UPDATE sitios SET updated_at = NOW() WHERE id = '31d2a035-170a-477b-927e-05d28067f847'")
console.log('UPERLAND subido al tope')
const { rows } = await pool.query("SELECT id, nombre, estado FROM sitios WHERE user_id = '51f24019-e19f-4bbc-b8e9-cd79b772a379'")
console.log('Sitios de Leo:', rows)
await pool.end()
