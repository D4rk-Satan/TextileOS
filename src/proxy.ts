import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const role = request.cookies.get('user_role')?.value;
  const path = request.nextUrl.pathname;

  // 1. Protect Super Admin routes
  if (path.startsWith('/superadmin')) {
    if (role !== 'SuperAdmin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Protect Dashboard routes
  if (path.startsWith('/dashboard')) {
    if (!role) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Redirect logged-in users away from auth pages
  if (path === '/login' || path === '/signup') {
    if (role === 'SuperAdmin') {
      return NextResponse.redirect(new URL('/superadmin', request.url));
    }
    if (role) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/superadmin/:path*', '/login', '/signup'],
};
