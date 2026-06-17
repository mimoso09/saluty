'use client';
// ============================================================
// Saluty — Animated streaming-analysis state
// Reveals fields progressively as Claude streams JSON.
// ============================================================
import { useEffect, useRef, useState } from 'react';
import { peekStringField, peekNumberField } from '@/lib/parseAnalysis';
import { getScoreColor, getScoreLabel } from '@/types/analysis';
import styles from './AnalyzingState.module.css';

interface Props {
  partial: string;
  onCancel?: () => void;
}

const STAGES = [
  { label: 'Recibiendo datos', detail: 'Conectando con la IA' },
  { label: 'Identificando producto', detail: 'Buscando marca y presentación' },
  { label: 'Evaluando ingredientes', detail: 'Detectando aditivos y procesamiento' },
  { label: 'Calculando Score', detail: 'Comparando contra estándares NOVA' },
  { label: 'Generando consejo', detail: 'Personalizando recomendaciones' },
];

export default function AnalyzingState({ partial, onCancel }: Props) {
  const productName = peekStringField(partial, 'productName');
  const score = peekNumberField(partial, 'salutyScore');
  const processingLevel = peekStringField(partial, 'processingLevel');
  const summary = peekStringField(partial, 'summary');

  const [stage, setStage] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = performance.now();
    const id = setInterval(() => {
      const elapsed = performance.now() - (startRef.current ?? performance.now());
      const next = Math.min(STAGES.length - 1, Math.floor(elapsed / 1500));
      setStage(next);
    }, 250);
    return () => clearInterval(id);
  }, []);

  // Promote stage based on what's already revealed
  const effectiveStage = productName
    ? score !== null
      ? summary
        ? 4
        : 3
      : 2
    : stage;

  const scoreColor = score !== null ? getScoreColor(score) : 'var(--brand-primary)';

  return (
    <div className={styles.wrap} role="status" aria-live="polite">
      <div className={styles.orb}>
        <div className={styles.orbCore} style={{ background: scoreColor }} />
        <div className={styles.orbRing} />
        <div className={styles.orbRing} style={{ animationDelay: '0.7s' }} />
      </div>

      <div className={styles.title}>
        {productName ? (
          <>
            <span className={styles.titleLabel}>Analizando</span>
            <span className={styles.titleValue}>{productName}</span>
          </>
        ) : (
          <span className={styles.titleLabel}>Analizando con IA…</span>
        )}
      </div>

      {score !== null && (
        <div className={`${styles.scoreReveal} ${styles.fadeIn}`}>
          <span className={styles.scoreNum} style={{ color: scoreColor }}>
            {score}
          </span>
          <span className={styles.scoreDen}>/10</span>
          <span className={styles.scoreLabel} style={{ color: scoreColor }}>
            {getScoreLabel(score)}
          </span>
        </div>
      )}

      {processingLevel && (
        <div className={`${styles.metaRow} ${styles.fadeIn}`}>
          <span className={styles.metaPill}>{processingLevel}</span>
        </div>
      )}

      {summary && (
        <p className={`${styles.summary} ${styles.fadeIn}`}>{summary}</p>
      )}

      <ol className={styles.stages}>
        {STAGES.map((s, i) => {
          const status =
            i < effectiveStage ? 'done' : i === effectiveStage ? 'active' : 'pending';
          return (
            <li key={s.label} className={`${styles.stage} ${styles[status]}`}>
              <span className={styles.stageDot} aria-hidden>
                {status === 'done' ? '✓' : status === 'active' ? '' : ''}
              </span>
              <span className={styles.stageText}>
                <span className={styles.stageLabel}>{s.label}</span>
                <span className={styles.stageDetail}>{s.detail}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {onCancel && (
        <button type="button" onClick={onCancel} className={styles.cancelBtn}>
          Cancelar
        </button>
      )}
    </div>
  );
}
