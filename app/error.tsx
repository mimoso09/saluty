'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Saluty UI error:', error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '24px',
        gap: '20px',
      }}
    >
      <div style={{ fontSize: '56px', lineHeight: 1 }} aria-hidden>
        ⚠️
      </div>
      <h1 style={{ fontSize: '22px', fontWeight: 800 }}>
        Algo salió mal
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '320px' }}>
        Tuvimos un problema mostrando esta pantalla. Puedes intentarlo de nuevo.
      </p>
      <button onClick={reset} className="btn-primary" style={{ maxWidth: '240px' }}>
        Reintentar
      </button>
    </main>
  );
}
