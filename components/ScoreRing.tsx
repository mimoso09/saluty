'use client';
// ============================================================
// Saluty — Score Ring (Animated SVG)
// ============================================================
import { useEffect, useRef, useState } from 'react';
import styles from './ScoreRing.module.css';

interface ScoreRingProps {
  score: number | null;
  color: string;
  size?: number;
}

export default function ScoreRing({ score, color, size = 188 }: ScoreRingProps) {
  const stroke = 14;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = score === null ? circumference : circumference - (score / 10) * circumference;
  const center = size / 2;

  const displayedScore = useAnimatedNumber(score ?? 0, 900);

  return (
    <div className={styles.wrapper} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={styles.svg}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${center} ${center})`}
          style={{
            transition: 'stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1)',
            filter: `drop-shadow(0 0 10px ${color}60)`,
          }}
        />
        <text
          x={center}
          y={score === null ? center + 8 : center - 6}
          textAnchor="middle"
          fill={color}
          fontSize={score === null ? '54' : '40'}
          fontWeight="800"
          fontFamily="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif"
          style={{ letterSpacing: '-0.04em' }}
        >
          {score === null ? '?' : displayedScore}
        </text>
        {score !== null && (
          <text
            x={center}
            y={center + 22}
            textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontSize="14"
            fontWeight="600"
            fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
            style={{ letterSpacing: '0.04em' }}
          >
            / 10
          </text>
        )}
      </svg>
      <div
        className={styles.glow}
        style={{ background: `radial-gradient(circle, ${color}26 0%, transparent 70%)` }}
      />
    </div>
  );
}

/**
 * Animates a number from 0 → target using requestAnimationFrame.
 * setState happens inside RAF callbacks, never directly in the effect body.
 */
function useAnimatedNumber(target: number, duration: number): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [target, duration]);

  return value;
}
