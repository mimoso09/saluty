// ============================================================
// Saluty — POST /api/analyze
// Calls Claude to analyze a food product and returns AnalysisResult
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { getClaudeClient, CLAUDE_MODEL } from '@/lib/claude';
import {
  SALUTY_SYSTEM_PROMPT,
  buildTextPrompt,
  buildImagePromptContent,
  buildBarcodePromptContent,
  type OpenFoodFactsProduct,
} from '@/lib/prompt';
import { parseAnalysisResponse } from '@/lib/parseAnalysis';
import { createServiceClient } from '@/lib/supabase';
import type { AnalysisRequest } from '@/types/analysis';

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
  try {
    const body = (await request.json()) as AnalysisRequest & { userId?: string };
    const { type, content, mimeType, barcode, userId } = body;

    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 });
    }
    if (type !== 'barcode' && !content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    if (type === 'barcode' && !barcode && !content) {
      return NextResponse.json(
        { error: 'barcode or content (photo) is required for barcode scans' },
        { status: 400 }
      );
    }

    const client = getClaudeClient();

    let messageContent:
      | string
      | Array<{ type: string; [key: string]: unknown }>;

    if (type === 'barcode') {
      const product = barcode ? await fetchOpenFoodFacts(barcode) : null;
      messageContent = buildBarcodePromptContent(
        barcode || '',
        product,
        content || null,
        mimeType || 'image/jpeg'
      ) as Array<{ type: string; [key: string]: unknown }>;
    } else if (type === 'image') {
      messageContent = buildImagePromptContent(
        content,
        mimeType || 'image/jpeg'
      ) as Array<{ type: string; [key: string]: unknown }>;
    } else {
      messageContent = buildTextPrompt(type, content);
    }

    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: SALUTY_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: messageContent as Parameters<
            typeof client.messages.create
          >[0]['messages'][0]['content'],
        },
      ],
    });

    const rawText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('');

    const result = parseAnalysisResponse(rawText);

    if (userId) {
      try {
        const supabase = createServiceClient();
        await supabase.from('analyses').insert({
          user_id: userId,
          product_name: result.productName,
          input_type: type,
          saluty_score: result.salutyScore,
          processing_level: result.processingLevel,
          analysis_json: result,
          raw_input: type === 'barcode' ? barcode : type !== 'image' ? content : null,
        });
      } catch (dbError) {
        console.error('Failed to save analysis:', dbError);
      }
    }

    return NextResponse.json({ success: true, result });
  } catch (error: unknown) {
    console.error('Analysis error:', error);
    const message =
      error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
