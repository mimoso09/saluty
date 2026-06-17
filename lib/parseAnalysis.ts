// ============================================================
// Saluty — Analysis Response Parser / Normalizer
// ============================================================
import type { AnalysisResult, ProcessingLevel } from '@/types/analysis';

const VALID_LEVELS: ProcessingLevel[] = [
  'natural',
  'mínimamente procesado',
  'procesado',
  'ultraprocesado',
];

const VALID_SEVERITIES = ['low', 'medium', 'high'] as const;

/**
 * Normalize the structured object returned by Claude (either from tool_use
 * input or parsed text JSON) into a strict AnalysisResult.
 */
export function normalizeAnalysis(parsed: Record<string, unknown>): AnalysisResult {
  let score: number | null;
  const rawScore = parsed.salutyScore;
  if (rawScore === null || rawScore === undefined) {
    score = null;
  } else {
    const n = Number(rawScore);
    score = Number.isNaN(n) ? null : Math.max(1, Math.min(10, Math.round(n)));
  }

  const level = VALID_LEVELS.includes(parsed.processingLevel as ProcessingLevel)
    ? (parsed.processingLevel as ProcessingLevel)
    : 'procesado';

  const nutritional = (parsed.nutritionalAnalysis as Record<string, unknown>) || {};
  const problematic = Array.isArray(parsed.problematicIngredients)
    ? parsed.problematicIngredients
    : [];
  const alternatives = Array.isArray(parsed.healthyAlternatives)
    ? parsed.healthyAlternatives
    : [];
  const macroImpact = parsed.macroImpact as Record<string, string> | undefined;

  return {
    productName: String(parsed.productName || 'Producto desconocido'),
    salutyScore: score,
    processingLevel: level,
    nutritionalAnalysis: {
      calories: toNumber(nutritional.calories),
      protein: toNumber(nutritional.protein),
      carbs: toNumber(nutritional.carbs),
      fat: toNumber(nutritional.fat),
      fiber: toNumber(nutritional.fiber),
      sugar: toNumber(nutritional.sugar),
      sodium: toNumber(nutritional.sodium),
      saturatedFat: toNumber(nutritional.saturatedFat),
      transFat: toNumber(nutritional.transFat),
      summary: String(nutritional.summary || 'Sin información nutricional disponible.'),
    },
    problematicIngredients: problematic.map((ing: Record<string, unknown>) => ({
      name: String(ing.name || ''),
      reason: String(ing.reason || ''),
      severity: VALID_SEVERITIES.includes(ing.severity as 'low' | 'medium' | 'high')
        ? (ing.severity as 'low' | 'medium' | 'high')
        : 'medium',
    })),
    healthyAlternatives: alternatives.map((alt: Record<string, unknown>) => ({
      name: String(alt.name || ''),
      reason: String(alt.reason || ''),
    })),
    salutyTip: String(parsed.salutyTip || ''),
    macroImpact: macroImpact
      ? {
          cholesterol: macroImpact.cholesterol,
          triglycerides: macroImpact.triglycerides,
          bloodSugar: macroImpact.bloodSugar,
        }
      : undefined,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Legacy parser for raw text JSON responses (kept for compatibility).
 */
export function parseAnalysisResponse(raw: string): AnalysisResult {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Claude returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }
  return normalizeAnalysis(parsed);
}

function toNumber(val: unknown): number | undefined {
  if (val === null || val === undefined) return undefined;
  const n = Number(val);
  return Number.isNaN(n) ? undefined : n;
}

/**
 * Extract a string field from incomplete JSON (used while streaming partial
 * tool input). Returns null if the field isn't yet present.
 */
export function peekStringField(partial: string, field: string): string | null {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, 'i');
  const match = partial.match(re);
  return match ? unescapeJsonString(match[1]) : null;
}

export function peekNumberField(partial: string, field: string): number | null {
  const re = new RegExp(`"${field}"\\s*:\\s*(-?\\d+(?:\\.\\d+)?|null)`, 'i');
  const match = partial.match(re);
  if (!match) return null;
  if (match[1] === 'null') return null;
  const n = Number(match[1]);
  return Number.isNaN(n) ? null : n;
}

function unescapeJsonString(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}
