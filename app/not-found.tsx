import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
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
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          overflow: 'hidden',
          background: '#fff',
          boxShadow: '0 8px 28px rgba(0, 212, 170, 0.28)',
        }}
        aria-hidden
      >
        <Image src="/logo.jpg" alt="" width={80} height={80} priority />
      </div>
      <h1 style={{ fontSize: '24px', fontWeight: 800 }}>
        Esta página no existe
      </h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: '320px' }}>
        Quizá el enlace cambió o el contenido ya no está disponible.
      </p>
      <Link href="/" className="btn-primary" style={{ maxWidth: '240px' }}>
        Volver al inicio
      </Link>
    </main>
  );
}
