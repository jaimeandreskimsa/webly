import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRol = (req.auth?.user as any)?.rol

  const isAuthRoute = nextUrl.pathname.startsWith('/login') ||
    nextUrl.pathname.startsWith('/registro')
  const isDashboardRoute = nextUrl.pathname.startsWith('/dashboard')
  const isAdminRoute = nextUrl.pathname.startsWith('/admin')
  const isApiAuth = nextUrl.pathname.startsWith('/api/auth')

  if (isApiAuth) return NextResponse.next()

  // Proteger /admin — solo admins
  if (isAdminRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/admin', nextUrl))
    }
    if (userRol !== 'admin') {
      return NextResponse.redirect(new URL('/dashboard', nextUrl))
    }
    return NextResponse.next()
  }

  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', nextUrl))
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
