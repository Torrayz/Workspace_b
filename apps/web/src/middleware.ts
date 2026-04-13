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
  
  // Cek custom auth cookie (untuk custom nomor_induk login)
  const authUserCookie = request.cookies.get('auth_user')?.value;
  let authUser = null;
  if (authUserCookie) {
    try {
      authUser = JSON.parse(authUserCookie);
      console.log('[MIDDLEWARE] authUser cookie found:', authUser);
    } catch (_e) {
      console.log('[MIDDLEWARE] Failed to parse authUser cookie');
    }
  }

  // ── Public routes ──────────────────────────────────────────────────────
  if (pathname === '/login' || pathname === '/') {
    if (session || authUser) {
      const role = (session?.user?.user_metadata?.role as string) || authUser?.role || 'user';
      console.log('[MIDDLEWARE] Logged-in user on login page, role:', role);

      // User role → JANGAN redirect ke dashboard (mobile only)
      // Biarkan di halaman login dengan pesan error, hapus cookie
      if (role === 'user') {
        console.log('[MIDDLEWARE] User role on login page — clearing cookie, showing mobile_only message');
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('error', 'mobile_only');
        const redirectResponse = NextResponse.redirect(loginUrl);
        // Hapus auth cookie agar tidak loop
        redirectResponse.cookies.set('auth_user', '', { maxAge: 0, path: '/' });
        redirectResponse.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
        return redirectResponse;
      }

      // Admin/superadmin → redirect ke dashboard
      return redirectToDashboard(request, role);
    }
    return response;
  }

  // ── Protected routes: /dashboard/* ─────────────────────────────────────
  if (pathname.startsWith('/dashboard')) {
    if (!session && !authUser) {
      console.log('[MIDDLEWARE] No session/authUser, redirecting to login');
      // Belum login → redirect ke /login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = (session?.user?.user_metadata?.role as string) || authUser?.role || 'user';
    console.log(`[MIDDLEWARE] Dashboard access: pathname=${pathname}, role=${role}`);

    // User role hanya bisa akses via mobile — tolak akses web + clear cookie
    if (role === 'user') {
      console.log('[MIDDLEWARE] User role denied web access — mobile only');
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('error', 'mobile_only');
      const redirectResponse = NextResponse.redirect(loginUrl);
      // Hapus auth cookie agar tidak loop
      redirectResponse.cookies.set('auth_user', '', { maxAge: 0, path: '/' });
      redirectResponse.cookies.set('auth_token', '', { maxAge: 0, path: '/' });
      return redirectResponse;
    }

    // Cek akses role-based
    if (pathname.startsWith('/dashboard/super') && role !== 'superadmin') {
      console.log('[MIDDLEWARE] Not superadmin, redirecting');
      return redirectToDashboard(request, role);
    }
    if (pathname.startsWith('/dashboard/admin') && !['admin', 'superadmin'].includes(role)) {
      console.log('[MIDDLEWARE] Not admin/superadmin, redirecting');
      return redirectToDashboard(request, role);
    }

    console.log('[MIDDLEWARE] Allowing access to', pathname);
    return response;
  }

  return response;
}

/** Redirect ke dashboard berdasarkan role — hanya admin/superadmin */
function redirectToDashboard(request: NextRequest, role: string): NextResponse {
  const dashboardMap: Record<string, string> = {
    superadmin: '/dashboard/super',
    admin: '/dashboard/admin',
  };
  // User role tidak punya dashboard web — jangan redirect
  const target = dashboardMap[role];
  if (!target) {
    // Fallback: kirim ke login dengan error
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('error', 'mobile_only');
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.redirect(new URL(target, request.url));
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/dashboard/:path*',
  ],
};
