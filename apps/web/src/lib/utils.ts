// ============================================================================
// Utility: cn (classnames merge) — pengganti clsx + tailwind-merge
// ============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge CSS class names dengan conflict resolution untuk Tailwind */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
