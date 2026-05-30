import { type NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Check if user has an auth token or demo mode enabled
  const token = request.cookies.get('sb-access-token')?.value;
  const demoMode = request.cookies.get('demo_mode')?.value === 'true';
  
  // Protect (app) routes — (app) route group has no URL prefix
  const protectedPaths = ['/buildings', '/map', '/field', '/dashboard', '/file', '/values', '/declaration'];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));
  if (isProtected) {
    if (!token && !demoMode) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif).*)',
  ],
};
