'use client';
// ============================================================
// Saluty — Profile Page
// ============================================================
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AuthGuard from '@/components/AuthGuard';
import { signOut, useUser } from '@/lib/auth';
import styles from './profile.module.css';

function ProfileContent() {
  const router = useRouter();
  const { user } = useUser();

  const handleLogout = () => {
    signOut();
    router.replace('/login');
  };

  const initial = (user?.name || user?.email || '?').trim().charAt(0).toUpperCase();

  return (
    <>
      <main className={`page-content ${styles.profile}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Perfil</h1>
        </header>

        {/* User Card */}
        <section className={`glass-card ${styles.userCard}`}>
          <div className={styles.avatar} aria-hidden>
            <span style={{ fontWeight: 800, fontSize: 22 }}>{initial}</span>
          </div>
          <div className={styles.userInfo}>
            <h2 className={styles.name}>{user?.name || 'Usuario Saluty'}</h2>
            <p className={styles.email}>{user?.email || '—'}</p>
          </div>
          <div className={`${styles.planBadge} ${styles.planFree}`}>
            Plan Gratis
          </div>
        </section>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={`glass-card ${styles.statCard}`}>
            <span className={styles.statValue}>1</span>
            <span className={styles.statLabel}>Análisis hechos</span>
          </div>
          <div className={`glass-card ${styles.statCard}`}>
            <span className={styles.statValue}>10</span>
            <span className={styles.statLabel}>Disponibles</span>
          </div>
        </div>

        {/* Premium CTA */}
        <section className={styles.premiumBox}>
          <div className={styles.premiumHeader}>
            <span className={styles.premiumIcon}>✨</span>
            <h3 className={styles.premiumTitle}>Saluty PRO</h3>
          </div>
          <ul className={styles.premiumFeatures}>
            <li>♾️ Análisis ilimitados</li>
            <li>📊 Historial completo y filtros</li>
            <li>🩺 Seguimiento de macros</li>
            <li>🎯 Alternativas personalizadas</li>
          </ul>
          <button className={`btn-primary ${styles.premiumBtn}`}>
            Actualizar a PRO
          </button>
        </section>

        {/* Settings */}
        <section className={styles.settingsSection}>
          <p className="section-label">Configuración</p>
          <div className={styles.settingsList}>
            <button className={`glass-card ${styles.settingItem}`}>
              <span>🔔 Notificaciones</span>
              <span className={styles.arrow}>→</span>
            </button>
            <button className={`glass-card ${styles.settingItem}`}>
              <span>🔒 Privacidad</span>
              <span className={styles.arrow}>→</span>
            </button>
            <button className={`glass-card ${styles.settingItem}`}>
              <span>❓ Ayuda y Soporte</span>
              <span className={styles.arrow}>→</span>
            </button>
            <button onClick={handleLogout} className={`glass-card ${styles.settingItem} ${styles.logoutBtn}`}>
              <span>Cerrar sesión</span>
            </button>
          </div>
        </section>
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
