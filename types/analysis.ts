// ============================================================
// Saluty — TypeScript Types
// ============================================================

export type ProcessingLevel =
  | 'natural'
  | 'mínimamente procesado'
  | 'procesado'
  | 'ultraprocesado';

export type InputType = 'image' | 'text' | 'ingredients' | 'nutrition_table' | 'barcode';

export interface ProblematicIngredient {
  name: string;
  reason: string;
  severity: 'low' | 'medium' | 'high';
}

export interface NutritionalAnalysis {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  saturatedFat?: number;
  transFat?: number;
  summary: string;
}

export interface HealthAlternative {
  name: string;
  reason: string;
}

export interface MacroImpact {
  cholesterol?: string;
  triglycerides?: string;
  bloodSugar?: string;
}

export interface AnalysisResult {
  id?: string;
  productName: string;
  salutyScore: number | null;
  processingLevel: ProcessingLevel;
  nutritionalAnalysis: NutritionalAnalysis;
  problematicIngredients: ProblematicIngredient[];
  healthyAlternatives: HealthAlternative[];
  salutyTip: string;
  macroImpact?: MacroImpact;
  analyzedAt?: string;
}

export interface AnalysisRequest {
  type: InputType;
  content: string; // text, ingredients, nutrition table, or base64 image
  mimeType?: string; // for images
  barcode?: string; // EAN/UPC code (used with type='barcode'); content holds the captured photo base64
}

export interface AnalysisRecord {
  id: string;
  user_id: string;
  product_name: string;
  input_type: InputType;
  image_url?: string;
  raw_input?: string;
  saluty_score: number | null;
  processing_level: ProcessingLevel;
  analysis_json: AnalysisResult;
  created_at: string;
}

export function getScoreColor(score: number | null): string {
  if (score === null) return 'var(--text-muted)';
  if (score >= 8) return 'var(--score-excellent)';
  if (score >= 6) return 'var(--score-good)';
  if (score >= 4) return 'var(--score-regular)';
  if (score >= 2) return 'var(--score-bad)';
  return 'var(--score-terrible)';
}

export function getScoreLabel(score: number | null): string {
  if (score === null) return 'Datos insuficientes';
  if (score >= 8) return 'Muy saludable';
  if (score >= 6) return 'Moderado';
  if (score >= 4) return 'Regular';
  if (score >= 2) return 'Poco saludable';
  return 'Ultraprocesado';
}

export function getProcessingLevelColor(level: ProcessingLevel): string {
  const map: Record<ProcessingLevel, string> = {
    natural: 'var(--score-excellent)',
    'mínimamente procesado': 'var(--score-good)',
    procesado: 'var(--score-regular)',
    ultraprocesado: 'var(--score-terrible)',
  };
  return map[level];
}

export function getSeverityColor(severity: 'low' | 'medium' | 'high'): string {
  const map = {
    low: 'var(--score-good)',
    medium: 'var(--score-regular)',
    high: 'var(--score-terrible)',
  };
  return map[severity];
}
