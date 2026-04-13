// ============================================================================
// API Route: POST /api/auth/logout
// Hapus cookie auth_user untuk logout
// ============================================================================

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  
  // Hapus custom auth cookie
  cookieStore.set('auth_user', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  return NextResponse.json({ success: true });
}
