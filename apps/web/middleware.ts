import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // If logged in but DOB not submitted, force to complete-profile
    // (except the complete-profile page itself and auth routes)
    if (
      token &&
      !token.dobSubmitted &&
      !path.startsWith('/auth/complete-profile') &&
      !path.startsWith('/api/')
    ) {
      return NextResponse.redirect(new URL('/auth/complete-profile', req.url))
    }

    // Admin routes: require admin role
    if (path.startsWith('/admin') && token?.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname
        // Public routes don't require auth
        if (
          path === '/' ||
          path.startsWith('/stories') ||
          path.startsWith('/genres') ||
          path.startsWith('/auth') ||
          path.startsWith('/api/auth') ||
          path.startsWith('/uploads')
        ) {
          return true
        }
        // Protected routes require token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
