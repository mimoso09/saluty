export const metadata = { title: 'Sin conexión — Saluty' };

export default function OfflinePage() {
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
      <div style={{ fontSize: '64px', lineHeight: 1 }} aria-hidden>
        📡
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 800 }}>Estás sin conexión</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '320px' }}>
        Puedes seguir viendo tu historial guardado. Cuando vuelvas a tener
        internet, los nuevos análisis funcionarán de nuevo.
      </p>
      <a href="/history" className="btn-primary" style={{ maxWidth: '260px' }}>
        Ver mi historial
      </a>
    </main>
  );
}
