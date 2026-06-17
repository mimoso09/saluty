'use client';
// ============================================================
// Saluty — Result Page (Animated Score + Full Analysis)
// ============================================================
import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '@/components/Navigation';
import ScoreRing from '@/components/ScoreRing';
import { useAnalysisById, type StoredAnalysis } from '@/lib/history';
import styles from './result.module.css';
import {
  getScoreLabel,
  getScoreColor,
  getProcessingLevelColor,
  getSeverityColor,
} from '@/types/analysis';

export default function ResultPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const result = useAnalysisById(params.id);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (result === null) {
      const timer = setTimeout(() => {
        // Give the store one tick to hydrate before redirecting
        router.replace('/scan');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [result, router]);

  if (!result) {
    return (
      <div className={styles.loadingState}>
        <div className="spinner spinner-lg" />
        <p>Cargando análisis…</p>
      </div>
    );
  }

  const scoreColor = getScoreColor(result.salutyScore);
  const processingColor = getProcessingLevelColor(result.processingLevel);

  return (
    <>
      <main className={`page-content ${styles.result}`}>
        <div className={styles.topBar}>
          <button
            onClick={() => router.back()}
            className={styles.iconBtn}
            aria-label="Volver"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <span className={styles.topLabel}>Resultado</span>
          <Link href="/scan" className={styles.newAnalysis}>
            Nuevo
          </Link>
        </div>

        <section className={`${styles.scoreHero} animate-scale-in`}>
          <ScoreRing score={result.salutyScore} color={scoreColor} />
          <div className={styles.scoreInfo}>
            <h1 className={styles.productName}>{result.productName}</h1>
            <div className={styles.scoreMeta}>
              <span className={styles.scoreLabel} style={{ color: scoreColor }}>
                {getScoreLabel(result.salutyScore)}
              </span>
              <span
                className={`badge ${styles.processingBadge}`}
                style={{
                  color: processingColor,
                  background: `${processingColor}1f`,
                  borderColor: `${processingColor}33`,
                }}
              >
                {result.processingLevel}
              </span>
            </div>
          </div>
        </section>

        <section className={`glass-card ${styles.section} animate-fade-in`}>
          <h2 className={styles.sectionTitle}>
            <span aria-hidden>📊</span> Análisis nutricional
          </h2>
          <p className={styles.sectionText}>{result.nutritionalAnalysis.summary}</p>

          {hasMacros(result) && (
            <div className={styles.macroGrid}>
              {result.nutritionalAnalysis.calories !== undefined && (
                <MacroChip label="Calorías" value={result.nutritionalAnalysis.calories} unit="kcal" />
              )}
              {result.nutritionalAnalysis.protein !== undefined && (
                <MacroChip label="Proteína" value={result.nutritionalAnalysis.protein} unit="g" />
              )}
              {result.nutritionalAnalysis.carbs !== undefined && (
                <MacroChip label="Carbohidratos" value={result.nutritionalAnalysis.carbs} unit="g" />
              )}
              {result.nutritionalAnalysis.fat !== undefined && (
                <MacroChip label="Grasa total" value={result.nutritionalAnalysis.fat} unit="g" />
              )}
              {result.nutritionalAnalysis.fiber !== undefined && (
                <MacroChip label="Fibra" value={result.nutritionalAnalysis.fiber} unit="g" color="var(--score-good)" />
              )}
              {result.nutritionalAnalysis.sugar !== undefined && (
                <MacroChip
                  label="Azúcar"
                  value={result.nutritionalAnalysis.sugar}
                  unit="g"
                  color={result.nutritionalAnalysis.sugar > 10 ? 'var(--score-bad)' : 'var(--text-primary)'}
                />
              )}
              {result.nutritionalAnalysis.sodium !== undefined && (
                <MacroChip
                  label="Sodio"
                  value={result.nutritionalAnalysis.sodium}
                  unit="mg"
                  color={result.nutritionalAnalysis.sodium > 400 ? 'var(--score-bad)' : 'var(--text-primary)'}
                />
              )}
            </div>
          )}
        </section>

        {result.macroImpact && hasImpact(result.macroImpact) && (
          <section className={`glass-card ${styles.section} animate-fade-in`}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden>❤️</span> Impacto en tu salud
            </h2>
            <div className={styles.impactList}>
              {result.macroImpact.cholesterol && (
                <ImpactRow label="Colesterol" value={result.macroImpact.cholesterol} />
              )}
              {result.macroImpact.triglycerides && (
                <ImpactRow label="Triglicéridos" value={result.macroImpact.triglycerides} />
              )}
              {result.macroImpact.bloodSugar && (
                <ImpactRow label="Glucosa" value={result.macroImpact.bloodSugar} />
              )}
            </div>
          </section>
        )}

        {result.problematicIngredients.length > 0 && (
          <section className={`glass-card ${styles.section} animate-fade-in`}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden>⚠️</span> Ingredientes a vigilar
            </h2>
            <div className={styles.ingredientList}>
              {result.problematicIngredients.map((ing, i) => (
                <div key={i} className={styles.ingredient} style={{ borderLeftColor: getSeverityColor(ing.severity) }}>
                  <div className={styles.ingredientHeader}>
                    <span
                      className={styles.severityDot}
                      style={{ background: getSeverityColor(ing.severity) }}
                    />
                    <span className={styles.ingredientName}>{ing.name}</span>
                  </div>
                  <p className={styles.ingredientReason}>{ing.reason}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.healthyAlternatives.length > 0 && (
          <section className={`glass-card ${styles.section} animate-fade-in`}>
            <h2 className={styles.sectionTitle}>
              <span aria-hidden>🥗</span> Alternativas más saludables
            </h2>
            <div className={styles.alternativeList}>
              {result.healthyAlternatives.map((alt, i) => (
                <div key={i} className={styles.alternative}>
                  <div className={styles.altIcon} aria-hidden>✓</div>
                  <div>
                    <p className={styles.altName}>{alt.name}</p>
                    <p className={styles.altReason}>{alt.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {result.salutyTip && (
          <section className={`${styles.tipSection} animate-fade-in`}>
            <div className={styles.tipCard}>
              <div className={styles.tipHeader}>
                <span className={styles.tipEmoji} aria-hidden>💡</span>
                <span className={styles.tipTitle}>Consejo Saluty</span>
              </div>
              <p className={styles.tipText}>{result.salutyTip}</p>
            </div>
          </section>
        )}

        <div className={styles.ctaRow}>
          <Link href="/scan" className="btn-primary">
            Analizar otro alimento
          </Link>
        </div>
      </main>
      <Navigation />
    </>
  );
}

function hasMacros(r: StoredAnalysis): boolean {
  const n = r.nutritionalAnalysis;
  return (
    n.calories !== undefined ||
    n.protein !== undefined ||
    n.carbs !== undefined ||
    n.fat !== undefined ||
    n.fiber !== undefined ||
    n.sugar !== undefined ||
    n.sodium !== undefined
  );
}

function hasImpact(m: { cholesterol?: string; triglycerides?: string; bloodSugar?: string }): boolean {
  return !!(m.cholesterol || m.triglycerides || m.bloodSugar);
}

function MacroChip({ label, value, unit, color }: { label: string; value: number; unit: string; color?: string }) {
  return (
    <div className={styles.macroChip}>
      <span className={styles.macroValue} style={{ color: color || 'var(--text-primary)' }}>
        {value}
        <span className={styles.macroUnit}>{unit}</span>
      </span>
      <span className={styles.macroLabel}>{label}</span>
    </div>
  );
}

function ImpactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.impactRow}>
      <span className={styles.impactLabel}>{label}</span>
      <span className={styles.impactValue}>{value}</span>
    </div>
  );
}
