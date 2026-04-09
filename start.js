// Wrapper para asegurar que Next.js standalone usa el PORT de Railway
process.env.PORT = process.env.PORT || '3000'
console.log(`Starting server on port ${process.env.PORT}`)
require('./.next/standalone/server.js')
