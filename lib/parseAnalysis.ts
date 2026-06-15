// ============================================================
// Saluty — Analysis Response Parser
// ============================================================
import type { AnalysisResult, ProcessingLevel } from '@/types/analysis';

/**
 * Parses Claude's raw JSON response into a typed AnalysisResult.
 * Handles edge cases like markdown fences or extra text.
 */
export function parseAnalysisResponse(raw: string): AnalysisResult {
  // Strip markdown code fences if Claude adds them
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

  // Validate saluty score (null when Claude can't honestly evaluate)
  let score: number | null;
  if (parsed.salutyScore === null || parsed.salutyScore === undefined) {
    score = null;
  } else {
    const n = Number(parsed.salutyScore);
    score = isNaN(n) ? null : Math.max(1, Math.min(10, Math.round(n)));
  }

  // Normalize processing level
  const validLevels: ProcessingLevel[] = [
    'natural',
    'mínimamente procesado',
    'procesado',
    'ultraprocesado',
  ];
  const level = validLevels.includes(parsed.processingLevel as ProcessingLevel)
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
      severity: ['low', 'medium', 'high'].includes(ing.severity as string)
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

function toNumber(val: unknown): number | undefined {
  const n = Number(val);
  return isNaN(n) ? undefined : n;
}
