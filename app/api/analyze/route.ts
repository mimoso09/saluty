// ============================================================
// Saluty — POST /api/analyze (Server-Sent Events streaming)
// Streams Claude's structured analysis tool call progressively.
// ============================================================
import { NextRequest } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude';
import {
  SALUTY_SYSTEM_PROMPT,
  buildTextPrompt,
  buildImagePromptContent,
  buildBarcodePromptContent,
  type OpenFoodFactsProduct,
} from '@/lib/prompt';
import { SALUTY_TOOL, SALUTY_TOOL_NAME } from '@/lib/analysisTool';
import { normalizeAnalysis } from '@/lib/parseAnalysis';
import { createServiceClient, isSupabaseConfigured } from '@/lib/supabase';
import type { AnalysisRequest } from '@/types/analysis';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BASE64_LENGTH = 8 * 1024 * 1024; // ~6 MB decoded

async function fetchOpenFoodFacts(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json?fields=product_name,brands,quantity,categories,ingredients_text,ingredients_text_es,nutriments,nutriscore_grade,nova_group`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Saluty/0.1 (https://saluty.app)' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { status?: number; product?: OpenFoodFactsProduct };
    if (json.status !== 1 || !json.product) return null;
    return json.product;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  let body: AnalysisRequest & { userId?: string };
  try {
    body = (await request.json()) as AnalysisRequest & { userId?: string };
  } catch {
    return jsonError(400, 'Cuerpo de la solicitud inválido.');
  }

  const { type, content, mimeType, barcode, userId } = body;

  if (!type) return jsonError(400, 'Falta el tipo de análisis.');
  if (type !== 'barcode' && !content) return jsonError(400, 'Falta el contenido a analizar.');
  if (type === 'barcode' && !barcode && !content) {
    return jsonError(400, 'Se requiere código de barras o foto para escanear.');
  }
  if ((type === 'image' || (type === 'barcode' && content)) && content.length > MAX_BASE64_LENGTH) {
    return jsonError(413, 'La imagen es demasiado grande (máx ~6 MB).');
  }

  let messageContent: string | Array<{ type: string; [key: string]: unknown }>;

  if (type === 'barcode') {
    const product = barcode ? await fetchOpenFoodFacts(barcode) : null;
    messageContent = buildBarcodePromptContent(
      barcode || '',
      product,
      content || null,
      mimeType || 'image/jpeg'
    ) as Array<{ type: string; [key: string]: unknown }>;
  } else if (type === 'image') {
    messageContent = buildImagePromptContent(content, mimeType || 'image/jpeg') as Array<{
      type: string;
      [key: string]: unknown;
    }>;
  } else {
    messageContent = buildTextPrompt(type, content);
  }

  const client = getClaudeClient();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      try {
        send('started', { ts: Date.now() });

        const aiStream = client.messages.stream({
          model: CLAUDE_MODEL,
          max_tokens: 2000,
          system: SALUTY_SYSTEM_PROMPT,
          tools: [SALUTY_TOOL],
          tool_choice: { type: 'tool', name: SALUTY_TOOL_NAME },
          messages: [
            {
              role: 'user',
              content: messageContent as Parameters<
                typeof client.messages.create
              >[0]['messages'][0]['content'],
            },
          ],
        });

        let accumulated = '';
        let throttle = 0;

        for await (const event of aiStream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'input_json_delta'
          ) {
            accumulated += event.delta.partial_json;
            // Throttle progress events to ~10/s to avoid flooding
            const now = Date.now();
            if (now - throttle > 100) {
              throttle = now;
              send('progress', { partial: accumulated });
            }
          }
        }

        const finalMessage = await aiStream.finalMessage();
        const toolUse = finalMessage.content.find(
          (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
        );
        if (!toolUse) throw new Error('Claude no devolvió un análisis estructurado.');

        const result = normalizeAnalysis(toolUse.input as Record<string, unknown>);

        // Persist if Supabase is configured AND we have a userId
        if (userId && isSupabaseConfigured()) {
          try {
            const supabase = createServiceClient();
            await supabase.from('analyses').insert({
              user_id: userId,
              product_name: result.productName,
              input_type: type,
              saluty_score: result.salutyScore,
              processing_level: result.processingLevel,
              analysis_json: result,
              raw_input:
                type === 'barcode' ? barcode : type !== 'image' ? content : null,
            });
          } catch (dbError) {
            console.error('Failed to save analysis:', dbError);
          }
        }

        send('complete', { result });
        controller.close();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Error al analizar';
        console.error('Analysis stream error:', err);
        send('error', { message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function jsonError(status: number, message: string) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
