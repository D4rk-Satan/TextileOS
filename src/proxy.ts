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

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/dashboard/:path*', '/superadmin/:path*'],
};
