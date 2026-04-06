import type { NextAuthConfig } from 'next-auth'

/**
 * Configuración edge-safe de NextAuth (sin imports de Node.js).
 * Usada en proxy.ts (middleware) para no romper el Edge Runtime.
 */
export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.plan = (user as any).plan
        token.nombre = (user as any).nombre
        token.rol = (user as any).rol
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session.user as any).plan = token.plan
        ;(session.user as any).nombre = token.nombre
        ;(session.user as any).rol = token.rol
      }
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      // Retorna true → el middleware deja pasar; la lógica granular está en proxy.ts
      return true
    },
  },
  providers: [], // Sin providers aquí — se agregan en auth.ts con DB
}
