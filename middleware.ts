import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the user has the mock authentication cookie
  const isAuth = request.cookies.has('demo_auth');
  
  // If they are trying to access the dashboard without the cookie, redirect to login
  if (!isAuth && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/'],
};
