'use client';
// ============================================================
// Saluty — Login / Sign up
// ============================================================
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthError, signIn, signUp, useUser } from '@/lib/auth';
import styles from './login.module.css';

type Mode = 'signin' | 'signup';

function LoginContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading } = useUser();

  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = params.get('from') || '/';

  useEffect(() => {
    if (!loading && user) router.replace(from);
  }, [loading, user, from, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'signup') {
        signUp({ name, email, password });
      } else {
        signIn({ email, password });
      }
      router.replace(from);
    } catch (err) {
      const msg = err instanceof AuthError ? err.message : err instanceof Error ? err.message : 'Algo salió mal.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.shell}>
      <div className={styles.glow} aria-hidden />

      <div className={styles.brand}>
        <div className={styles.logoBadge}>
          <span aria-hidden>🥗</span>
        </div>
        <h1 className={styles.brandName}>
          Salu<span className="gradient-text">ty</span>
        </h1>
        <p className={styles.brandTag}>Evalúa lo que comes con IA</p>
      </div>

      <div className={styles.card}>
        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            className={`${styles.tab} ${mode === 'signin' ? styles.tabActive : ''}`}
            onClick={() => { setMode('signin'); setError(null); }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
            onClick={() => { setMode('signup'); setError(null); }}
          >
            Crear cuenta
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          {mode === 'signup' && (
            <label className={styles.field}>
              <span className={styles.label}>Nombre</span>
              <input
                type="text"
                className={styles.input}
                placeholder="¿Cómo te llamas?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                autoCapitalize="words"
              />
            </label>
          )}

          <label className={styles.field}>
            <span className={styles.label}>Correo</span>
            <input
              type="email"
              className={styles.input}
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={mode === 'signup' ? 'email' : 'username'}
              inputMode="email"
              autoCapitalize="none"
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Contraseña</span>
            <div className={styles.pwdWrap}>
              <input
                type={showPwd ? 'text' : 'password'}
                className={styles.input}
                placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
              <button
                type="button"
                className={styles.pwdToggle}
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPwd ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          {error && (
            <div className={styles.error} role="alert">
              <span aria-hidden>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className={`btn-primary ${styles.submit}`} disabled={submitting}>
            {submitting ? (
              <>
                <div className="spinner" />
                Procesando…
              </>
            ) : mode === 'signup' ? 'Crear mi cuenta' : 'Entrar'}
          </button>
        </form>

        <p className={styles.swap}>
          {mode === 'signin' ? (
            <>¿No tienes cuenta? <button type="button" className={styles.swapBtn} onClick={() => { setMode('signup'); setError(null); }}>Regístrate</button></>
          ) : (
            <>¿Ya tienes cuenta? <button type="button" className={styles.swapBtn} onClick={() => { setMode('signin'); setError(null); }}>Inicia sesión</button></>
          )}
        </p>
      </div>

      <p className={styles.footer}>
        Al continuar aceptas que esta es una versión demo y tu cuenta se guarda solo en este dispositivo.
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
