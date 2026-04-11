// ============================================================================
// Middleware — Auth check + role-based redirect
// ============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Buat Supabase client untuk middleware
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value, ...(options as Record<string, string>) });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...(options as Record<string, string>) });
        },
        remove(name: string, options: Record<string, unknown>) {
          request.cookies.set({ name, value: '', ...(options as Record<string, string>) });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...(options as Record<string, string>) });
        },
      },
    },
  );

  // Cek session
  const { data: { session } } = await supabase.auth.getSession();

  // ── Public routes ──────────────────────────────────────────────────────
  if (pathname === '/login' || pathname === '/') {
    if (session) {
      // Sudah login → redirect ke dashboard sesuai role
      const role = (session.user?.user_metadata?.role as string) || 'user';
      return redirectToDashboard(request, role);
    }
    return response;
  }

  // ── Protected routes: /dashboard/* ─────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      // Belum login → redirect ke /login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = (session.user?.user_metadata?.role as string) || 'user';

    // Cek akses role-based
    if (pathname.startsWith('/dashboard/super') && role !== 'superadmin') {
      return redirectToDashboard(request, role);
    }
    if (pathname.startsWith('/dashboard/admin') && !['admin', 'superadmin'].includes(role)) {
      return redirectToDashboard(request, role);
    }

    return response;
  }

  return response;
}

/** Redirect ke dashboard berdasarkan role */
function redirectToDashboard(request: NextRequest, role: string): NextResponse {
  const dashboardMap: Record<string, string> = {
    superadmin: '/dashboard/super',
    admin: '/dashboard/admin',
    user: '/dashboard/user',
  };
  const target = dashboardMap[role] || '/dashboard/user';
  return NextResponse.redirect(new URL(target, request.url));
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
  ],
};
