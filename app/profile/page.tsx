'use client';
// ============================================================
// Saluty — Profile Page
// ============================================================
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AuthGuard from '@/components/AuthGuard';
import { signOut, useUser } from '@/lib/auth';
import { useHistory } from '@/lib/history';
import styles from './profile.module.css';

const FREE_QUOTA = 10;

function ProfileContent() {
  const router = useRouter();
  const { user } = useUser();
  const history = useHistory();
  const analysisCount = history.length;
  const avgScore = useMemo(() => {
    const scored = history.filter((h) => h.salutyScore !== null);
    if (scored.length === 0) return null;
    const sum = scored.reduce((acc, h) => acc + (h.salutyScore ?? 0), 0);
    return Math.round((sum / scored.length) * 10) / 10;
  }, [history]);

  const initial = useMemo(
    () => (user?.name || user?.email || '?').trim().charAt(0).toUpperCase(),
    [user]
  );

  const remaining = Math.max(0, FREE_QUOTA - analysisCount);

  const handleLogout = async () => {
    if (!confirm('¿Cerrar sesión en este dispositivo?')) return;
    await signOut();
    router.replace('/login');
  };

  return (
    <>
      <main className={`page-content ${styles.profile}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Perfil</h1>
        </header>

        <section className={`glass-card ${styles.userCard}`}>
          <div className={styles.avatar} aria-hidden>{initial}</div>
          <div className={styles.userInfo}>
            <h2 className={styles.name}>{user?.name || 'Usuario Saluty'}</h2>
            <p className={styles.email}>{user?.email || '—'}</p>
          </div>
          <div className={`${styles.planBadge} ${styles.planFree}`}>Plan Gratis</div>
        </section>

        <div className={styles.statsGrid}>
          <div className={`glass-card ${styles.statCard}`}>
            <span className={styles.statValue}>{analysisCount}</span>
            <span className={styles.statLabel}>Análisis hechos</span>
          </div>
          <div className={`glass-card ${styles.statCard}`}>
            <span className={styles.statValue}>
              {avgScore === null ? '—' : avgScore.toFixed(1)}
            </span>
            <span className={styles.statLabel}>Score promedio</span>
          </div>
          <div className={`glass-card ${styles.statCard}`}>
            <span className={styles.statValue}>{remaining}</span>
            <span className={styles.statLabel}>Disponibles</span>
          </div>
        </div>

        <section className={styles.premiumBox}>
          <div className={styles.premiumHeader}>
            <span className={styles.premiumIcon} aria-hidden>✨</span>
            <h3 className={styles.premiumTitle}>Saluty PRO</h3>
          </div>
          <ul className={styles.premiumFeatures}>
            <li>♾️ Análisis ilimitados</li>
            <li>📊 Historial completo con filtros</li>
            <li>🩺 Seguimiento semanal de macros</li>
            <li>🎯 Alternativas personalizadas</li>
          </ul>
          <button className={`btn-primary ${styles.premiumBtn}`} type="button">
            Actualizar a PRO
          </button>
        </section>

        <section className={styles.settingsSection}>
          <p className="section-label">Configuración</p>
          <div className={styles.settingsList}>
            <button className={`glass-card ${styles.settingItem}`} type="button">
              <span className={styles.settingLabel}>
                <span className={styles.settingIcon} aria-hidden>🔔</span>
                Notificaciones
              </span>
              <span className={styles.arrow} aria-hidden>›</span>
            </button>
            <button className={`glass-card ${styles.settingItem}`} type="button">
              <span className={styles.settingLabel}>
                <span className={styles.settingIcon} aria-hidden>🔒</span>
                Privacidad
              </span>
              <span className={styles.arrow} aria-hidden>›</span>
            </button>
            <button className={`glass-card ${styles.settingItem}`} type="button">
              <span className={styles.settingLabel}>
                <span className={styles.settingIcon} aria-hidden>❓</span>
                Ayuda y soporte
              </span>
              <span className={styles.arrow} aria-hidden>›</span>
            </button>
            <button
              onClick={handleLogout}
              className={`glass-card ${styles.settingItem} ${styles.logoutBtn}`}
              type="button"
            >
              Cerrar sesión
            </button>
          </div>
        </section>

        <p className={styles.versionTag}>Saluty • Versión 0.1 (demo)</p>
      </main>
      <Navigation />
    </>
  );
}

export default function ProfilePage() {
  return (
    <AuthGuard>
      <ProfileContent />
    </AuthGuard>
  );
}
