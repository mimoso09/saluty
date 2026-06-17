'use client';
// ============================================================
// Saluty — Launch splash screen
// Plays once per full page load (~4s) and fades out.
// ============================================================
import { useEffect, useState } from 'react';
import Image from 'next/image';
import styles from './SplashScreen.module.css';

const TOTAL_MS = 4000;
const FADE_MS = 600;

export default function SplashScreen() {
  const [phase, setPhase] = useState<'showing' | 'fading' | 'gone'>('showing');

  useEffect(() => {
    const fadeTimer = setTimeout(() => setPhase('fading'), TOTAL_MS - FADE_MS);
    const goneTimer = setTimeout(() => setPhase('gone'), TOTAL_MS);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      className={`${styles.splash} ${phase === 'fading' ? styles.fading : ''}`}
      role="status"
      aria-live="polite"
      aria-label="Cargando Saluty"
    >
      <div className={styles.glow} aria-hidden />
      <div className={styles.content}>
        <div className={styles.logoWrap}>
          <Image
            src="/logo.jpg"
            alt=""
            width={120}
            height={120}
            priority
            className={styles.logo}
          />
        </div>
        <h1 className={styles.brandName}>
          Salu<span className="gradient-text">ty</span>
        </h1>
        <p className={styles.tag}>Evalúa lo que comes con IA</p>
      </div>
      <div className={styles.progressWrap} aria-hidden>
        <div className={styles.progressBar} />
      </div>
    </div>
  );
}
