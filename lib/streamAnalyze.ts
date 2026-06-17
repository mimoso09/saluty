// ============================================================
// Saluty — Client-side SSE consumer for /api/analyze
// ============================================================
'use client';

import type { AnalysisRequest, AnalysisResult } from '@/types/analysis';

export type StreamHandlers = {
  onStarted?: () => void;
  onProgress?: (partial: string) => void;
  onComplete?: (result: AnalysisResult) => void;
  onError?: (message: string) => void;
};

/**
 * POST the analysis request and parse the SSE stream from /api/analyze.
 * Resolves with the final AnalysisResult, or rejects on transport / API error.
 */
export async function streamAnalyze(
  body: AnalysisRequest & { userId?: string },
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<AnalysisResult> {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
    body: JSON.stringify(body),
    signal,
  });

  if (!res.ok || !res.body) {
    let msg = `Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) msg = data.error;
    } catch {
      /* keep status-based msg */
    }
    throw new Error(msg);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result: AnalysisResult | null = null;
  let errored: string | null = null;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const raw of events) {
        if (!raw.trim()) continue;
        let eventName = 'message';
        let dataLine = '';
        for (const line of raw.split('\n')) {
          if (line.startsWith('event: ')) eventName = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataLine += line.slice(6);
        }
        if (!dataLine) continue;
        let data: unknown;
        try {
          data = JSON.parse(dataLine);
        } catch {
          continue;
        }

        switch (eventName) {
          case 'started':
            handlers.onStarted?.();
            break;
          case 'progress':
            if (typeof (data as { partial?: string }).partial === 'string') {
              handlers.onProgress?.((data as { partial: string }).partial);
            }
            break;
          case 'complete':
            result = (data as { result: AnalysisResult }).result;
            handlers.onComplete?.(result);
            break;
          case 'error':
            errored = (data as { message: string }).message;
            handlers.onError?.(errored);
            break;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  if (errored) throw new Error(errored);
  if (!result) throw new Error('La respuesta terminó sin un resultado.');
  return result;
}
