// ============================================================
// Saluty — Home Page
// ============================================================
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import AuthGuard from '@/components/AuthGuard';
import styles from './home.module.css';

const SAMPLE_FOODS = [
  { emoji: '🍎', name: 'Manzana', score: 9, color: '#00d4aa' },
  { emoji: '🥤', name: 'Refresco Cola', score: 2, color: '#ef4444' },
  { emoji: '🥑', name: 'Aguacate', score: 9, color: '#00d4aa' },
  { emoji: '🍫', name: 'Chocolate Leche', score: 4, color: '#f97316' },
  { emoji: '🥣', name: 'Granola', score: 6, color: '#facc15' },
  { emoji: '🍕', name: 'Pizza', score: 3, color: '#f97316' },
];

export default function HomePage() {
  return (
    <AuthGuard>
      <main className={`page-content ${styles.home}`}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>🥗</span>
            <span className={styles.logoText}>Saluty</span>
          </div>
          <Link href="/profile" className={styles.avatarBtn} aria-label="Perfil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </header>

        {/* Hero */}
        <section className={`${styles.hero} animate-fade-in`}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            Análisis con IA
          </div>
          <h1 className={styles.heroTitle}>
            ¿Qué tan{' '}
            <span className="gradient-text">saludable</span>
            {' '}es tu comida?
          </h1>
          <p className={styles.heroSubtitle}>
            Sube una foto, escribe el nombre o pega los ingredientes.
            Nuestra IA analiza todo al instante.
          </p>
          <Link href="/scan" className={`btn-primary ${styles.heroBtn}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Analizar ahora
          </Link>
        </section>

        {/* Quick actions */}
        <section className={styles.quickActions}>
          <p className="section-label">Analizar con</p>
          <div className={styles.actionGrid}>
            <Link href="/scan?tab=image" className={`glass-card ${styles.actionCard}`}>
              <span className={styles.actionEmoji}>📸</span>
              <span className={styles.actionLabel}>Foto</span>
            </Link>
            <Link href="/scan?tab=text" className={`glass-card ${styles.actionCard}`}>
              <span className={styles.actionEmoji}>✏️</span>
              <span className={styles.actionLabel}>Texto</span>
            </Link>
            <Link href="/scan?tab=ingredients" className={`glass-card ${styles.actionCard}`}>
              <span className={styles.actionEmoji}>📋</span>
              <span className={styles.actionLabel}>Ingredientes</span>
            </Link>
            <Link href="/scan?tab=nutrition_table" className={`glass-card ${styles.actionCard}`}>
              <span className={styles.actionEmoji}>📊</span>
              <span className={styles.actionLabel}>Tabla</span>
            </Link>
          </div>
        </section>

        {/* How it works */}
        <section className={styles.howItWorks}>
          <p className="section-label">Cómo funciona</p>
          <div className={`glass-card ${styles.stepsCard}`}>
            {[
              { step: '1', title: 'Ingresa tu comida', desc: 'Foto, nombre, ingredientes o tabla nutricional' },
              { step: '2', title: 'IA analiza todo', desc: 'Claude evalúa nutrición, procesamiento e ingredientes' },
              { step: '3', title: 'Recibe tu Score', desc: 'Calificación del 1-10 con explicación y alternativas' },
            ].map((item, i) => (
              <div key={i} className={styles.step}>
                <div className={styles.stepNum}>{item.step}</div>
                <div>
                  <p className={styles.stepTitle}>{item.title}</p>
                  <p className={styles.stepDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Sample scores */}
        <section className={styles.sampleSection}>
          <div className={styles.sampleHeader}>
            <p className="section-label">Ejemplos de análisis</p>
            <Link href="/history" className={styles.seeAll}>Ver historial →</Link>
          </div>
          <div className={styles.sampleScroll}>
            {SAMPLE_FOODS.map((food, i) => (
              <div key={i} className={`glass-card ${styles.sampleCard}`}>
                <span className={styles.sampleEmoji}>{food.emoji}</span>
                <p className={styles.sampleName}>{food.name}</p>
                <div className={styles.sampleScore} style={{ color: food.color }}>
                  <span className={styles.sampleScoreNum}>{food.score}</span>
                  <span className={styles.sampleScoreDen}>/10</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Navigation />
    </AuthGuard>
  );
}
