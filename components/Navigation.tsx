'use client';
// ============================================================
// Saluty — Bottom Navigation Bar
// ============================================================
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navigation.module.css';

type NavItem = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  icon: (active: boolean) => React.ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Inicio',
    match: (p) => p === '/',
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9,22 9,12 15,12 15,22" />
      </svg>
    ),
  },
  {
    href: '/scan',
    label: 'Analizar',
    match: (p) => p.startsWith('/scan') || p.startsWith('/result'),
    icon: () => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
  {
    href: '/history',
    label: 'Historial',
    match: (p) => p.startsWith('/history'),
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <polyline points="12,7 12,12 16,14" />
      </svg>
    ),
  },
  {
    href: '/profile',
    label: 'Perfil',
    match: (p) => p.startsWith('/profile'),
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

export default function Navigation() {
  const pathname = usePathname() || '/';

  return (
    <nav className={styles.nav} aria-label="Navegación principal">
      {NAV_ITEMS.map((item) => {
        const isActive = item.match(pathname);
        const isScan = item.href === '/scan';

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${isActive ? styles.active : ''} ${isScan ? styles.scanItem : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className={styles.iconWrap}>
              {isScan ? (
                <span className={`${styles.scanButton} ${isActive ? styles.scanButtonActive : ''}`}>
                  {item.icon(isActive)}
                </span>
              ) : (
                item.icon(isActive)
              )}
            </span>
            {!isScan && <span className={styles.label}>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
