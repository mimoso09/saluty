'use client';
// ============================================================
// Saluty — Live barcode scanner (camera + ZXing)
// ============================================================
import { useEffect, useRef, useState, useCallback } from 'react';
import { BrowserMultiFormatReader, type IScannerControls } from '@zxing/browser';
import { BarcodeFormat, DecodeHintType } from '@zxing/library';
import styles from './BarcodeScanner.module.css';

export type ScanPayload = {
  barcode: string;
  imageBase64: string;
  mimeType: string;
};

type Props = {
  onScan: (payload: ScanPayload) => void;
  onCancel: () => void;
  stream: MediaStream;
};

export default function BarcodeScanner({ onScan, onCancel, stream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const handledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const captureFrame = useCallback((): { base64: string; mimeType: string } | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    const mimeType = 'image/jpeg';
    const dataUrl = canvas.toDataURL(mimeType, 0.85);
    return { base64: dataUrl.split(',')[1], mimeType };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.EAN_13,
      BarcodeFormat.EAN_8,
      BarcodeFormat.UPC_A,
      BarcodeFormat.UPC_E,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39,
      BarcodeFormat.ITF,
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);
    const reader = new BrowserMultiFormatReader(hints);

    let cancelled = false;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.muted = true;
    if (video.srcObject !== stream) video.srcObject = stream;

    const onLoaded = () => { if (!cancelled) setReady(true); };
    video.addEventListener('loadedmetadata', onLoaded);
    if (video.readyState >= 1) onLoaded();

    video.play().catch(() => { /* iOS may report AbortError if a previous play() is still pending; ignore */ });

    reader.decodeFromVideoElement(video, (result) => {
      if (cancelled || handledRef.current) return;
      if (!result) return;
      const frame = captureFrame();
      if (!frame) return;
      handledRef.current = true;
      controlsRef.current?.stop();
      onScan({ barcode: result.getText(), imageBase64: frame.base64, mimeType: frame.mimeType });
    }).then((controls) => {
      if (cancelled) {
        controls.stop();
        return;
      }
      controlsRef.current = controls;
    }).catch((e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Error al iniciar el lector';
      if (!cancelled) setError(msg);
    });

    return () => {
      cancelled = true;
      video.removeEventListener('loadedmetadata', onLoaded);
      controlsRef.current?.stop();
      // NOTE: do NOT stop the stream tracks here — the parent owns the stream
      // lifecycle. Stopping here would break React Strict Mode's double-mount.
    };
  }, [captureFrame, onScan, stream]);

  const handleManualCapture = () => {
    if (handledRef.current) return;
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setError('La cámara aún no muestra imagen. Espera un instante e intenta otra vez.');
      return;
    }
    const frame = captureFrame();
    if (!frame) {
      setError('No se pudo capturar la imagen.');
      return;
    }
    handledRef.current = true;
    controlsRef.current?.stop();
    onScan({ barcode: '', imageBase64: frame.base64, mimeType: frame.mimeType });
  };

  return (
    <div className={styles.wrap}>
      <div className={styles.viewport}>
        <video ref={videoRef} className={styles.video} playsInline muted autoPlay />
        <div className={styles.frame} aria-hidden="true">
          <div className={styles.targetBox} />
          <div className={styles.scanLine} />
        </div>

        <button type="button" className={styles.closeBtn} onClick={onCancel} aria-label="Cerrar cámara">
          ✕
        </button>

        <div className={styles.shutterArea}>
          <button type="button" className={styles.shutter} onClick={handleManualCapture} aria-label="Tomar foto">
            <span className={styles.shutterInner} />
          </button>
        </div>

        {!ready && !error && (
          <div className={styles.status}>
            <div className="spinner" /> Iniciando cámara…
          </div>
        )}
        {error && (
          <div className={styles.statusError}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}
      </div>

      <p className={styles.hint}>
        Apunta al <strong>código de barras</strong> para escaneo automático, o toca el botón para <strong>tomar foto</strong> del producto.
      </p>
    </div>
  );
}
