// ============================================================
// Saluty — Home Page
// ============================================================
import Image from 'next/image';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import AuthGuard from '@/components/AuthGuard';
import styles from './home.module.css';

const SAMPLE_FOODS = [
  { emoji: '🥑', name: 'Aguacate', score: 9, color: 'var(--score-excellent)' },
  { emoji: '🥣', name: 'Granola natural', score: 7, color: 'var(--score-good)' },
  { emoji: '🍫', name: 'Chocolate con leche', score: 4, color: 'var(--score-bad)' },
  { emoji: '🥤', name: 'Refresco cola', score: 2, color: 'var(--score-terrible)' },
  { emoji: '🥗', name: 'Ensalada verde', score: 10, color: 'var(--score-excellent)' },
  { emoji: '🍕', name: 'Pizza congelada', score: 3, color: 'var(--score-bad)' },
];

const QUICK_ACTIONS = [
  { tab: 'barcode', emoji: '📷', label: 'Escanear', desc: 'Código de barras' },
  { tab: 'image', emoji: '🖼️', label: 'Foto', desc: 'Etiqueta o producto' },
  { tab: 'text', emoji: '✏️', label: 'Texto', desc: 'Nombre o marca' },
  { tab: 'ingredients', emoji: '📋', label: 'Lista', desc: 'Ingredientes' },
];

const STEPS = [
  {
    step: '1',
    title: 'Ingresa tu comida',
    desc: 'Una foto, el código de barras, el nombre o los ingredientes.',
  },
  {
    step: '2',
    title: 'La IA analiza al instante',
    desc: 'Evaluamos nutrición, ingredientes y nivel de procesamiento.',
  },
  {
    step: '3',
    title: 'Recibe tu Score',
    desc: 'Una calificación clara del 1 al 10 con alternativas más saludables.',
  },
];

export default function HomePage() {
  return (
    <AuthGuard>
      <main className={`page-content ${styles.home}`}>
        <header className={styles.header}>
          <div className={styles.logo}>
            <span className={styles.logoIcon} aria-hidden>
              <Image src="/logo.jpg" alt="" width={36} height={36} priority />
            </span>
            <span className={styles.logoText}>Saluty</span>
          </div>
          <Link href="/profile" className={styles.avatarBtn} aria-label="Ver perfil">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </Link>
        </header>

        <section className={`${styles.hero} animate-fade-in`}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} aria-hidden />
            Análisis con IA
          </div>
          <h1 className={styles.heroTitle}>
            ¿Qué tan{' '}
            <span className="gradient-text">saludable</span>
            {' '}es lo que comes?
          </h1>
          <p className={styles.heroSubtitle}>
            Descubre en segundos el impacto real de cada alimento. Sin etiquetas confusas.
          </p>
          <Link href="/scan" className={`btn-primary ${styles.heroBtn}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Analizar ahora
          </Link>
        </section>

        <section className={styles.quickActions}>
          <p className="section-label">Empezar con</p>
          <div className={`${styles.actionGrid} stagger`}>
            {QUICK_ACTIONS.map((a) => (
              <Link
                key={a.tab}
                href={`/scan?tab=${a.tab}`}
                className={`glass-card ${styles.actionCard} animate-fade-in`}
              >
                <span className={styles.actionEmoji} aria-hidden>{a.emoji}</span>
                <span className={styles.actionLabel}>{a.label}</span>
                <span className={styles.actionDesc}>{a.desc}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.howItWorks}>
          <p className="section-label">Cómo funciona</p>
          <div className={`glass-card ${styles.stepsCard}`}>
            {STEPS.map((item) => (
              <div key={item.step} className={styles.step}>
                <div className={styles.stepNum}>{item.step}</div>
                <div>
                  <p className={styles.stepTitle}>{item.title}</p>
                  <p className={styles.stepDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sampleSection}>
          <div className={styles.sampleHeader}>
            <p className="section-label">Ejemplos reales</p>
            <Link href="/history" className={styles.seeAll}>
              Mi historial
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          </div>
          <div className={styles.sampleScroll}>
            {SAMPLE_FOODS.map((food) => (
              <div key={food.name} className={`glass-card ${styles.sampleCard}`}>
                <span className={styles.sampleEmoji} aria-hidden>{food.emoji}</span>
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
