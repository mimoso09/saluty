'use client';
// ============================================================
// Saluty — Score Ring (Animated SVG)
// ============================================================
import { useEffect, useState } from 'react';
import styles from './ScoreRing.module.css';

interface ScoreRingProps {
  score: number | null;
  color: string;
}

export default function ScoreRing({ score, color }: ScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animated, setAnimated] = useState(false);

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = score === null ? 0 : (score / 10) * circumference;
  const offset = circumference - progress;

  useEffect(() => {
    if (score === null) {
      setAnimated(false);
      setAnimatedScore(0);
      return;
    }
    const target = score;
    const timer = setTimeout(() => {
      setAnimated(true);
      let current = 0;
      const step = target / 25;
      const interval = setInterval(() => {
        current += step;
        if (current >= target) {
          setAnimatedScore(target);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.floor(current));
        }
      }, 30);
    }, 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className={styles.wrapper}>
      <svg width="180" height="180" viewBox="0 0 180 180" className={styles.svg}>
        {/* Background track */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
        />
        {/* Progress arc */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          transform="rotate(-90 90 90)"
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)',
            filter: `drop-shadow(0 0 8px ${color}60)`,
          }}
        />
        {/* Score number */}
        <text
          x="90"
          y={score === null ? '98' : '82'}
          textAnchor="middle"
          fill={color}
          fontSize={score === null ? '52' : '36'}
          fontWeight="800"
          fontFamily="Space Grotesk, Inter, sans-serif"
          style={{ letterSpacing: '-1px' }}
        >
          {score === null ? '?' : animatedScore}
        </text>
        {/* /10 */}
        {score !== null && (
          <text
            x="90"
            y="104"
            textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontSize="14"
            fontWeight="500"
            fontFamily="Inter, sans-serif"
          >
            / 10
          </text>
        )}
      </svg>
      {/* Glow effect */}
      <div
        className={styles.glow}
        style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 70%)` }}
      />
    </div>
  );
}
