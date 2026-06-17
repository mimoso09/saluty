'use client';
// ============================================================
// Saluty — Scan Page (Food Analyzer)
// ============================================================
import { useState, useRef, useCallback, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AuthGuard from '@/components/AuthGuard';
import BarcodeScanner, { type ScanPayload } from '@/components/BarcodeScanner';
import AnalyzingState from '@/components/AnalyzingState';
import { saveAnalysis } from '@/lib/history';
import { streamAnalyze } from '@/lib/streamAnalyze';
import { useUser } from '@/lib/auth';
import styles from './scan.module.css';
import type { InputType } from '@/types/analysis';

type Tab = 'barcode' | 'image' | 'text' | 'ingredients' | 'nutrition_table';

const TABS: { id: Tab; label: string; emoji: string; placeholder: string }[] = [
  { id: 'barcode', label: 'Escanear', emoji: '📷', placeholder: '' },
  { id: 'image', label: 'Foto', emoji: '🖼️', placeholder: '' },
  { id: 'text', label: 'Texto', emoji: '✏️', placeholder: 'Ej: Leche entera Lala, Coca-Cola 600 ml, Doritos Nacho…' },
  { id: 'ingredients', label: 'Ingredientes', emoji: '📋', placeholder: 'Pega la lista completa de ingredientes del producto…' },
  { id: 'nutrition_table', label: 'Tabla', emoji: '📊', placeholder: 'Pega la tabla nutrimental: calorías, proteínas, carbohidratos, grasas, sodio…' },
];

const TIPS: Record<Tab, string> = {
  barcode: 'Apunta al código de barras. Combinamos el código, la base de datos y la foto para más precisión.',
  image: 'Para mejor análisis, fotografía la etiqueta trasera con los ingredientes.',
  text: 'Incluye marca y presentación. Ejemplo: "Yogurt griego Danone 0 % sin azúcar".',
  ingredients: 'Pega los ingredientes tal como aparecen en el envase, con aditivos y cantidades.',
  nutrition_table: 'Incluye toda la tabla: calorías, proteínas, carbohidratos, grasas, azúcares y sodio.',
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useUser();
  const initialTab = (searchParams.get('tab') as Tab) || 'barcode';

  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [textContent, setTextContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState('image/jpeg');
  const [barcodeValue, setBarcodeValue] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [requestingCamera, setRequestingCamera] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingPartial, setStreamingPartial] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup camera stream if the page is unmounted while scanning
  useEffect(() => {
    return () => {
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  const handleImageSelect = useCallback((file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('Selecciona un archivo de imagen (JPG, PNG o WebP).');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setError('La imagen supera los 5 MB. Usa una más pequeña.');
      return;
    }
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      setImageBase64(result.split(',')[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleImageSelect(file);
    },
    [handleImageSelect]
  );

  const handleScannerResult = useCallback((payload: ScanPayload) => {
    setBarcodeValue(payload.barcode || null);
    setImageBase64(payload.imageBase64);
    setImageMime(payload.mimeType);
    setImagePreview(`data:${payload.mimeType};base64,${payload.imageBase64}`);
    setScannerOpen(false);
    setCameraStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const closeScanner = useCallback(() => {
    setScannerOpen(false);
    setCameraStream((prev) => {
      prev?.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const openCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no soporta acceso a la cámara.');
      return;
    }
    setRequestingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      setCameraStream(stream);
      setScannerOpen(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo acceder a la cámara';
      let friendly = msg;
      if (/permission|denied|notallowed/i.test(msg)) {
        friendly = 'Permiso de cámara denegado. Habilítalo en los ajustes de tu navegador.';
      } else if (/notfound|devicesnotfound/i.test(msg)) {
        friendly = 'No se detectó cámara en este dispositivo.';
      } else if (/secure|https/i.test(msg)) {
        friendly = 'La cámara requiere HTTPS. Abre la app desde un enlace seguro.';
      }
      setError(friendly);
    } finally {
      setRequestingCamera(false);
    }
  }, []);

  const resetScan = () => {
    setBarcodeValue(null);
    setImageBase64(null);
    setImagePreview(null);
  };

  const handleAnalyze = async () => {
    setError(null);

    let body: {
      type: InputType;
      content: string;
      mimeType?: string;
      barcode?: string;
    };

    if (activeTab === 'barcode') {
      if (!imageBase64 && !barcodeValue) {
        setError('Escanea un código o captura una foto antes de analizar.');
        return;
      }
      body = barcodeValue
        ? { type: 'barcode', content: imageBase64 || '', mimeType: imageMime, barcode: barcodeValue }
        : { type: 'image', content: imageBase64!, mimeType: imageMime };
    } else if (activeTab === 'image') {
      if (!imageBase64) {
        setError('Selecciona o toma una foto del producto.');
        return;
      }
      body = { type: 'image', content: imageBase64, mimeType: imageMime };
    } else {
      if (!textContent.trim()) {
        setError('Ingresa información del alimento antes de continuar.');
        return;
      }
      body = { type: activeTab, content: textContent.trim() };
    }

    setIsLoading(true);
    setStreamingPartial('');
    abortRef.current = new AbortController();
    try {
      const result = await streamAnalyze(
        { ...body, userId: user?.id },
        {
          onProgress: (partial) => setStreamingPartial(partial),
        },
        abortRef.current.signal
      );
      const stored = saveAnalysis(result);
      router.push(`/result/${stored.id}`);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') {
        setError(null);
      } else {
        const msg = err instanceof Error ? err.message : 'Error al analizar';
        setError(msg);
      }
      setIsLoading(false);
    }
  };

  const cancelAnalysis = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
    setStreamingPartial('');
  };

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  if (isLoading) {
    return (
      <>
        <main className={`page-content ${styles.scan}`}>
          <AnalyzingState partial={streamingPartial} onCancel={cancelAnalysis} />
        </main>
        <Navigation />
      </>
    );
  }

  return (
    <>
      <main className={`page-content ${styles.scan}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Analizar</h1>
          <p className={styles.subtitle}>¿Qué vas a evaluar hoy?</p>
        </header>

        <div className={styles.tabs} role="tablist" aria-label="Tipo de análisis">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => {
                setActiveTab(tab.id);
                setError(null);
              }}
            >
              <span className={styles.tabEmoji} aria-hidden>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.inputArea}>
          {activeTab === 'barcode' ? (
            scannerOpen && cameraStream ? (
              <BarcodeScanner stream={cameraStream} onScan={handleScannerResult} onCancel={closeScanner} />
            ) : imagePreview ? (
              <div className={styles.scanResult}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Captura del producto" className={styles.imagePreview} />
                <div className={styles.scanResultMeta}>
                  {barcodeValue ? (
                    <p className={styles.scanResultText}>
                      <strong>Código:</strong> {barcodeValue}
                    </p>
                  ) : (
                    <p className={styles.scanResultText}>Foto capturada (sin código de barras)</p>
                  )}
                  <div className={styles.scanResultActions}>
                    <button type="button" className={styles.linkBtn} onClick={() => { resetScan(); openCamera(); }}>
                      Escanear otro
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button type="button" className={styles.openScanner} onClick={openCamera} disabled={requestingCamera}>
                <div className={styles.imageIcon} aria-hidden>📷</div>
                <p className={styles.imageTitle}>{requestingCamera ? 'Solicitando permiso…' : 'Abrir cámara'}</p>
                <p className={styles.imageHint}>Apunta al código de barras del producto</p>
              </button>
            )
          ) : activeTab === 'image' ? (
            <div
              className={`${styles.imageZone} ${imagePreview ? styles.imageZoneWithPhoto : ''}`}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              aria-label="Seleccionar imagen"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
            >
              {imagePreview ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Vista previa" className={styles.imagePreview} />
                  <div className={styles.imageOverlay}>
                    <span>Tocar para cambiar</span>
                  </div>
                </>
              ) : (
                <div className={styles.imageEmpty}>
                  <div className={styles.imageIcon} aria-hidden>🖼️</div>
                  <p className={styles.imageTitle}>Sube una foto</p>
                  <p className={styles.imageHint}>
                    Arrastra una imagen o toca para seleccionar
                  </p>
                  <p className={styles.imageFormats}>JPG, PNG o WebP • máx 5 MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImageSelect(f);
                  e.target.value = '';
                }}
              />
            </div>
          ) : (
            <textarea
              className="form-textarea"
              placeholder={currentTab.placeholder}
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={6}
              id="food-input"
              aria-label={currentTab.label}
            />
          )}
        </div>

        <div className={`glass-card ${styles.tipBox}`}>
          <span className={styles.tipIcon} aria-hidden>💡</span>
          <p className={styles.tipText}>{TIPS[activeTab]}</p>
        </div>

        {error && (
          <div className={styles.errorMsg} role="alert">
            <span aria-hidden>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <button
          id="analyze-btn"
          className="btn-primary"
          onClick={handleAnalyze}
          type="button"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Obtener mi Score Saluty
        </button>
      </main>
      <Navigation />
    </>
  );
}

export default function ScanPage() {
  return (
    <AuthGuard>
      <Suspense
        fallback={
          <div className="page-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <div className="spinner spinner-lg" />
          </div>
        }
      >
        <ScanContent />
      </Suspense>
    </AuthGuard>
  );
}
