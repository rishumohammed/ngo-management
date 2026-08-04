import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Volunteer trying to access admin portal
    if (path.startsWith('/admin') && token?.isVolunteer) {
      return NextResponse.redirect(new URL('/volunteer/dashboard', req.url))
    }

    // Admin trying to access volunteer portal
    if (path.startsWith('/volunteer') && !token?.isVolunteer) {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/admin/:path*', '/volunteer/:path*'],
}
