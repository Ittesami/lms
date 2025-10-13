import { NextResponse } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Public paths that don't need authentication
  const publicPaths = ['/login', '/register'];
  const isPublicPath = publicPaths.includes(pathname);

  // Root path - redirect to login or dashboard based on auth
  if (pathname === '/') {
    if (token) {
      const userData = await verifyToken(token);
      if (userData) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If trying to access protected route without token
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (isPublicPath && token) {
    const userData = await verifyToken(token);
    if (userData) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Verify token for protected routes
  if (!isPublicPath && token) {
    const userData = await verifyToken(token);
    if (!userData) {
      // Invalid token, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
};