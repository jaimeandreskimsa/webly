import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { db, usuarios } from '@/lib/db'
import { z } from 'zod'
import { authConfig } from './auth.config'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password } = parsed.data

        const [usuario] = await db
          .select()
          .from(usuarios)
          .where(eq(usuarios.email, email))
          .limit(1)

        if (!usuario) return null

        const passwordValido = await bcrypt.compare(password, usuario.password)
        if (!passwordValido) return null

        if (!usuario.activo) return null

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          nombre: usuario.nombre,
          plan: usuario.plan,
          rol: usuario.rol,
        }
      },
    }),
  ],
})
