'use client';
// ============================================================
// Saluty — History Page
// ============================================================
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import AuthGuard from '@/components/AuthGuard';
import styles from './history.module.css';
import { getScoreColor, getScoreLabel } from '@/types/analysis';

function HistoryContent() {
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // In a real app, we'd fetch from /api/history using Supabase Auth
    // For MVP demo without full auth setup, we'll load from localStorage if we saved any
    // or just show empty state.
    const run = async () => {
      setIsLoading(true);
      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));

      const stored = sessionStorage.getItem('saluty_result');
      if (stored) {
        setHistory([JSON.parse(stored)]);
      }

      setIsLoading(false);
    };
    run();
  }, []);

  return (
    <>
      <main className={`page-content ${styles.history}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Historial</h1>
          <p className={styles.subtitle}>Tus alimentos analizados recientemente</p>
        </header>

        {isLoading ? (
          <div className={styles.emptyState}>
            <div className="spinner" />
          </div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📭</div>
            <p className={styles.emptyTitle}>Aún no hay análisis</p>
            <p className={styles.emptyDesc}>
              Sube tu primer alimento para ver su Score Saluty y análisis nutricional.
            </p>
            <Link href="/scan" className="btn-primary" style={{ marginTop: 16 }}>
              Analizar un alimento
            </Link>
          </div>
        ) : (
          <div className={styles.historyList}>
            {history.map((item, i) => (
              <Link href="/result/latest" key={i} className={`glass-card ${styles.historyCard}`}>
                <div className={styles.cardLeft}>
                  <p className={styles.productName}>{item.productName}</p>
                  <p className={styles.date}>Hoy</p>
                </div>
                <div className={styles.cardRight}>
                  <div className={styles.scoreBadge} style={{ background: `${getScoreColor(item.salutyScore)}20`, color: getScoreColor(item.salutyScore) }}>
                    <span className={styles.scoreNum}>{item.salutyScore ?? '?'}</span>
                    {item.salutyScore !== null && <span className={styles.scoreDen}>/10</span>}
                  </div>
                </div>
              </Link>
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
