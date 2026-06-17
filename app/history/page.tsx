'use client';
// ============================================================
// Saluty — History Page (per-device)
// ============================================================
import { useMemo } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import AuthGuard from '@/components/AuthGuard';
import { useHistory, deleteAnalysis, type StoredAnalysis } from '@/lib/history';
import { getScoreColor } from '@/types/analysis';
import styles from './history.module.css';

function formatRelative(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Ahora mismo';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}

function HistoryContent() {
  const history = useHistory();

  const grouped = useMemo(() => {
    const map = new Map<string, StoredAnalysis[]>();
    for (const item of history) {
      const key = formatRelative(item.analyzedAt);
      const bucket = key.startsWith('Hace ') && key.endsWith('días')
        ? 'Esta semana'
        : key === 'Ayer' || key.startsWith('Hace ') && (key.endsWith('h') || key.endsWith('min'))
          ? 'Hoy'
          : key === 'Ahora mismo'
            ? 'Hoy'
            : 'Anteriores';
      if (!map.has(bucket)) map.set(bucket, []);
      map.get(bucket)!.push(item);
    }
    return Array.from(map.entries());
  }, [history]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('¿Eliminar este análisis del historial?')) return;
    deleteAnalysis(id);
  };

  return (
    <>
      <main className={`page-content ${styles.history}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Historial</h1>
          <p className={styles.subtitle}>
            {history.length === 0
              ? 'Aquí aparecerán tus análisis'
              : `${history.length} ${history.length === 1 ? 'análisis' : 'análisis'} guardado${history.length === 1 ? '' : 's'}`}
          </p>
        </header>

        {history.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden>📭</div>
            <p className={styles.emptyTitle}>Aún no hay análisis</p>
            <p className={styles.emptyDesc}>
              Analiza tu primer alimento para ver su Score Saluty y consejos personalizados.
            </p>
            <Link href="/scan" className="btn-primary" style={{ marginTop: 16, maxWidth: 260 }}>
              Analizar un alimento
            </Link>
          </div>
        ) : (
          <div className={styles.groupList}>
            {grouped.map(([bucket, items]) => (
              <section key={bucket} className={styles.group}>
                <p className="section-label">{bucket}</p>
                <div className={styles.historyList}>
                  {items.map((item) => {
                    const color = getScoreColor(item.salutyScore);
                    return (
                      <Link
                        href={`/result/${item.id}`}
                        key={item.id}
                        className={`glass-card ${styles.historyCard}`}
                      >
                        <div className={styles.cardLeft}>
                          <p className={styles.productName}>{item.productName}</p>
                          <p className={styles.date}>
                            {formatRelative(item.analyzedAt)} • {item.processingLevel}
                          </p>
                        </div>
                        <div className={styles.cardRight}>
                          <div
                            className={styles.scoreBadge}
                            style={{ background: `${color}1f`, color, borderColor: `${color}40` }}
                          >
                            <span className={styles.scoreNum}>{item.salutyScore ?? '?'}</span>
                            {item.salutyScore !== null && <span className={styles.scoreDen}>/10</span>}
                          </div>
                          <button
                            type="button"
                            className={styles.deleteBtn}
                            onClick={(e) => handleDelete(item.id, e)}
                            aria-label={`Eliminar ${item.productName}`}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6l-2 14a2 2 0 01-2 2H9a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
      <Navigation />
    </>
  );
}

export default function HistoryPage() {
  return (
    <AuthGuard>
      <HistoryContent />
    </AuthGuard>
  );
}
