'use client';
// ============================================================
// Saluty — Scan Page (Food Analyzer)
// ============================================================
import { useState, useRef, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Navigation from '@/components/Navigation';
import AuthGuard from '@/components/AuthGuard';
import BarcodeScanner, { type ScanPayload } from '@/components/BarcodeScanner';
import styles from './scan.module.css';
import type { AnalysisResult, InputType } from '@/types/analysis';

type Tab = 'barcode' | 'image' | 'text' | 'ingredients' | 'nutrition_table';

const TABS: { id: Tab; label: string; emoji: string; placeholder: string }[] = [
  {
    id: 'barcode',
    label: 'Escanear',
    emoji: '📷',
    placeholder: '',
  },
  {
    id: 'image',
    label: 'Foto',
    emoji: '🖼️',
    placeholder: '',
  },
  {
    id: 'text',
    label: 'Texto',
    emoji: '✏️',
    placeholder: 'Ej: Leche entera Lala, Coca-Cola 600ml, Doritos Nacho...',
  },
  {
    id: 'ingredients',
    label: 'Ingredientes',
    emoji: '📋',
    placeholder: 'Pega la lista completa de ingredientes del producto...',
  },
  {
    id: 'nutrition_table',
    label: 'Tabla',
    emoji: '📊',
    placeholder: 'Pega la tabla nutrimental: calorías, proteínas, carbohidratos, grasas, sodio...',
  },
];

function ScanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageMime(file.type);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setImagePreview(result);
      const base64 = result.split(',')[1];
      setImageBase64(base64);
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
      if (prev) prev.getTracks().forEach((t) => t.stop());
      return null;
    });
  }, []);

  const closeScanner = useCallback(() => {
    setScannerOpen(false);
    if (cameraStream) cameraStream.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
  }, [cameraStream]);

  const openCamera = useCallback(async () => {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Tu navegador no soporta acceso a la cámara.');
      return;
    }
    setRequestingCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setScannerOpen(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'No se pudo acceder a la cámara';
      let friendly = msg;
      if (/permission|denied|notallowed/i.test(msg)) friendly = 'Permiso de cámara denegado. Abre Ajustes de Safari → Cámara → Permitir.';
      else if (/notfound|devicesnotfound/i.test(msg)) friendly = 'No se detectó cámara en este dispositivo.';
      else if (/secure|https/i.test(msg)) friendly = 'La cámara requiere HTTPS. Usa el enlace HTTPS, no HTTP.';
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
      if (barcodeValue) {
        body = {
          type: 'barcode',
          content: imageBase64 || '',
          mimeType: imageMime,
          barcode: barcodeValue,
        };
      } else {
        body = { type: 'image', content: imageBase64!, mimeType: imageMime };
      }
    } else if (activeTab === 'image') {
      if (!imageBase64) {
        setError('Por favor selecciona una imagen.');
        return;
      }
      body = { type: 'image', content: imageBase64, mimeType: imageMime };
    } else {
      if (!textContent.trim()) {
        setError('Por favor ingresa información para analizar.');
        return;
      }
      body = { type: activeTab, content: textContent };
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Análisis falló');
      const result: AnalysisResult = data.result;
      sessionStorage.setItem('saluty_result', JSON.stringify(result));
      router.push('/result/latest');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al analizar';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const currentTab = TABS.find((t) => t.id === activeTab)!;

  return (
    <>
      <main className={`page-content ${styles.scan}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>Analizar</h1>
          <p className={styles.subtitle}>¿Qué vas a evaluar hoy?</p>
        </header>

        <div className={styles.tabs} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
              onClick={() => { setActiveTab(tab.id); setError(null); }}
            >
              <span>{tab.emoji}</span>
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
                <img src={imagePreview} alt="Captura" className={styles.imagePreview} />
                <div className={styles.scanResultMeta}>
                  {barcodeValue ? (
                    <p>
                      <strong>Código:</strong> {barcodeValue}
                    </p>
                  ) : (
                    <p className={styles.imageHint}>Foto capturada (sin código de barras)</p>
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
                <div className={styles.imageIcon}>📷</div>
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
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Vista previa" className={styles.imagePreview} />
                  <div className={styles.imageOverlay}>
                    <span>Cambiar imagen</span>
                  </div>
                </>
              ) : (
                <div className={styles.imageEmpty}>
                  <div className={styles.imageIcon}>🖼️</div>
                  <p className={styles.imageTitle}>Sube una foto</p>
                  <p className={styles.imageHint}>
                    Arrastra una imagen o toca para seleccionar
                  </p>
                  <p className={styles.imageFormats}>JPG, PNG, WebP • máx 5MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
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
            />
          )}
        </div>

        <div className={`glass-card ${styles.tipBox}`}>
          <span className={styles.tipIcon}>💡</span>
          <p className={styles.tipText}>
            {activeTab === 'barcode' && 'Apunta al código de barras. Combinamos el código, datos del producto y la foto para un análisis más preciso.'}
            {activeTab === 'image' && 'Usa foto de la etiqueta trasera con los ingredientes para mejor análisis.'}
            {activeTab === 'text' && 'Incluye la marca y presentación. Ej: "Yogurt griego Danone 0% sin azúcar".'}
            {activeTab === 'ingredients' && 'Pega exactamente como aparece en el envase, incluyendo aditivos y cantidades.'}
            {activeTab === 'nutrition_table' && 'Incluye toda la tabla: calorías, proteínas, carbohidratos, grasas, azúcares y sodio.'}
          </p>
        </div>

        {error && (
          <div className={styles.errorMsg}>
            <span>⚠️</span> {error}
          </div>
        )}

        <button
          id="analyze-btn"
          className="btn-primary"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner" />
              Analizando con IA...
            </>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Obtener mi Score Saluty
            </>
          )}
        </button>
      </main>
      <Navigation />
    </>
  );
}

export default function ScanPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="page-content" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'80vh',color:'var(--text-muted)'}}>Cargando...</div>}>
        <ScanContent />
      </Suspense>
    </AuthGuard>
  );
}
