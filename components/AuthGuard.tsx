'use client';
// ============================================================
// Saluty — Auth guard. Redirects unauthenticated users to /login.
// ============================================================
import { useEffect, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/lib/auth';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading && !user) {
      const from = encodeURIComponent(pathname || '/');
      router.replace(`/login?from=${from}`);
    }
  }, [loading, user, pathname, router]);

  if (loading || !user) {
    return (
      <div
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-live="polite"
        aria-busy="true"
      >
        <div className="spinner spinner-lg" />
      </div>
    );
  }

  return <>{children}</>;
}
