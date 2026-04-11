// ============================================================================
// PageContainer — Content wrapper with max-width and padding
// ============================================================================

import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  /** Page heading yang ditampilkan di atas konten */
  title?: string;
  /** Sub-heading / deskripsi halaman */
  description?: string;
  /** Konten tambahan di sebelah kanan judul (tombol, filter, dsb) */
  actions?: React.ReactNode;
}

export function PageContainer({
  children,
  className,
  title,
  description,
  actions,
}: PageContainerProps) {
  return (
    <main
      className={cn(
        'mx-auto w-full max-w-content p-section-gap animate-fade-in',
        className,
      )}
    >
      {/* Page header */}
      {(title || actions) && (
        <div className="mb-section-gap flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h1 className="text-page-heading text-text-primary dark:text-gray-100">
                {title}
              </h1>
            )}
            {description && (
              <p className="mt-1 text-sm text-text-secondary dark:text-gray-400">
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}

      {children}
    </main>
  );
}
