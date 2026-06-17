// ============================================================
// Saluty — Anthropic tool schema for structured analysis output
// ============================================================
import type Anthropic from '@anthropic-ai/sdk';

export const SALUTY_TOOL_NAME = 'submit_saluty_analysis';

export const SALUTY_TOOL: Anthropic.Messages.Tool = {
  name: SALUTY_TOOL_NAME,
  description:
    'Entrega el análisis nutricional estructurado del alimento o producto evaluado.',
  input_schema: {
    type: 'object',
    properties: {
      productName: {
        type: 'string',
        description:
          'Nombre EXACTO visible en la foto o en Open Food Facts (incluye marca y presentación si están disponibles). Si no se identifica, usa "Producto no identificado".',
      },
      salutyScore: {
        type: ['integer', 'null'],
        minimum: 1,
        maximum: 10,
        description:
          'Calificación 1-10 SOLO cuando hay datos suficientes (ingredientes o tabla nutricional). null si no hay datos suficientes.',
      },
      processingLevel: {
        type: 'string',
        enum: [
          'natural',
          'mínimamente procesado',
          'procesado',
          'ultraprocesado',
        ],
      },
      nutritionalAnalysis: {
        type: 'object',
        properties: {
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
          fiber: { type: 'number' },
          sugar: { type: 'number' },
          sodium: { type: 'number' },
          saturatedFat: { type: 'number' },
          transFat: { type: 'number' },
          summary: {
            type: 'string',
            description:
              'Análisis nutricional claro y conciso (2-3 oraciones). Indica la fuente usada: "Según la etiqueta visible…", "Según datos de Open Food Facts…", etc.',
          },
        },
        required: ['summary'],
      },
      problematicIngredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            reason: { type: 'string' },
            severity: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: ['name', 'reason', 'severity'],
        },
      },
      healthyAlternatives: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            reason: { type: 'string' },
          },
          required: ['name', 'reason'],
        },
      },
      salutyTip: {
        type: 'string',
        description:
          'Consejo personalizado, accionable y específico para este alimento.',
      },
      macroImpact: {
        type: 'object',
        properties: {
          cholesterol: { type: 'string' },
          triglycerides: { type: 'string' },
          bloodSugar: { type: 'string' },
        },
      },
    },
    required: [
      'productName',
      'processingLevel',
      'nutritionalAnalysis',
      'problematicIngredients',
      'healthyAlternatives',
      'salutyTip',
    ],
  },
};
