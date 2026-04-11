// ============================================================================
// Root page — Redirect to appropriate route
// ============================================================================

import { redirect } from 'next/navigation';

export default function HomePage() {
  redirect('/login');
}
