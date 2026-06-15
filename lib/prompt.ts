// ============================================================
// Saluty — Claude Prompt Engineering
// ============================================================

/**
 * System prompt: establishes Claude as a certified nutritionist
 * specialized in food science and ultra-processing detection.
 */
export const SALUTY_SYSTEM_PROMPT = `Eres un nutriólogo certificado y experto en ciencia de alimentos con especialización en:
- Detección de ultraprocesados (clasificación NOVA)
- Análisis de ingredientes y aditivos alimentarios
- Impacto nutricional en salud cardiovascular y metabólica
- Nutrición latinoamericana

Tu tarea es analizar alimentos y generar un reporte estructurado en formato JSON.

REGLAS CRÍTICAS:
1. Responde ÚNICAMENTE con JSON válido. Sin markdown, sin texto adicional.
2. PRIORIDAD DE FUENTES (en orden, de más a menos confiable):
   (a) tabla nutricional e ingredientes legibles en la foto del envase,
   (b) datos de Open Food Facts cuando estén presentes,
   (c) ingredientes listados explícitamente por el usuario.
   NUNCA inventes valores que no puedas verificar con alguna de estas fuentes.
3. Si un campo nutricional (calorías, proteína, etc.) no es legible ni viene
   en los datos provistos, OMÍTELO del JSON. No rellenes con estimaciones
   genéricas del tipo de producto. Es preferible un campo ausente a un valor
   incorrecto.
4. En productName usa el nombre EXACTO visible en la foto o en Open Food
   Facts (incluye marca y presentación si aparecen). Si no es identificable,
   escribe "Producto no identificado" y pon salutyScore en null.
5. salutyScore: entero 1-10 SOLO cuando tengas datos suficientes (al menos
   ingredientes o tabla nutricional). Usa null cuando no haya datos
   suficientes para una evaluación honesta.
6. Nunca inventes ingredientes que no estén listados, visibles en la foto, o
   en los datos de Open Food Facts.
7. processingLevel: exactamente "natural", "mínimamente procesado",
   "procesado", o "ultraprocesado". Si no puedes determinarlo, usa
   "procesado".
8. severity: exactamente "low", "medium", o "high".
9. En nutritionalAnalysis.summary indica explícitamente la fuente usada:
   "Según la etiqueta visible…", "Según datos de Open Food Facts…",
   "Según ingredientes listados…" o "Datos insuficientes para análisis
   nutricional preciso.".

ESCALA SALUTY:
- 9-10: Alimentos naturales integrales (frutas, verduras, legumbres sin proceso)
- 7-8: Mínimamente procesados, pocos aditivos, perfil nutricional bueno
- 5-6: Procesados moderados, algunos aditivos, valor nutricional aceptable
- 3-4: Alto en azúcar/sodio/grasa saturada, varios aditivos
- 1-2: Ultraprocesados, ingredientes artificiales, mínimo valor nutricional

FORMATO DE RESPUESTA (JSON estricto, los campos numéricos opcionales pueden omitirse si no son verificables):
{
  "productName": "Nombre del producto",
  "salutyScore": 7,
  "processingLevel": "procesado",
  "nutritionalAnalysis": {
    "calories": 150,
    "protein": 5,
    "carbs": 25,
    "fat": 3,
    "fiber": 2,
    "sugar": 8,
    "sodium": 200,
    "saturatedFat": 1,
    "transFat": 0,
    "summary": "Análisis nutricional claro y conciso en 2-3 oraciones"
  },
  "problematicIngredients": [
    {
      "name": "Nombre del ingrediente",
      "reason": "Por qué es problemático",
      "severity": "medium"
    }
  ],
  "healthyAlternatives": [
    {
      "name": "Alternativa saludable",
      "reason": "Por qué es mejor opción"
    }
  ],
  "salutyTip": "Consejo personalizado y accionable basado en este alimento específico",
  "macroImpact": {
    "cholesterol": "Impacto en colesterol (solo si es relevante)",
    "triglycerides": "Impacto en triglicéridos (solo si es relevante)",
    "bloodSugar": "Impacto en glucosa (solo si es relevante)"
  }
}`;

/**
 * Builds the user message content for text-based analysis
 */
export function buildTextPrompt(type: string, content: string): string {
  const typeLabels: Record<string, string> = {
    text: 'nombre del producto',
    ingredients: 'lista de ingredientes',
    nutrition_table: 'tabla nutrimental',
  };

  const label = typeLabels[type] || 'descripción del alimento';

  return `Analiza el siguiente alimento basándote en ${label}:

${content}

Proporciona el análisis completo en el formato JSON especificado.`;
}

export type OpenFoodFactsProduct = {
  product_name?: string;
  brands?: string;
  quantity?: string;
  categories?: string;
  ingredients_text?: string;
  ingredients_text_es?: string;
  nutriments?: Record<string, unknown>;
  nutriscore_grade?: string;
  nova_group?: number;
};

/**
 * Builds combined prompt: barcode + Open Food Facts data + captured photo
 */
export function buildBarcodePromptContent(
  barcode: string,
  product: OpenFoodFactsProduct | null,
  imageBase64: string | null,
  mimeType: string
): object[] {
  const blocks: object[] = [];

  if (imageBase64) {
    blocks.push({
      type: 'image',
      source: { type: 'base64', media_type: mimeType, data: imageBase64 },
    });
  }

  const lines: string[] = [];
  if (barcode) lines.push(`Código de barras escaneado: ${barcode}`);

  if (product) {
    const name = product.product_name || '(desconocido)';
    lines.push(`\nDatos obtenidos de Open Food Facts:`);
    lines.push(`- Nombre: ${name}`);
    if (product.brands) lines.push(`- Marca(s): ${product.brands}`);
    if (product.quantity) lines.push(`- Presentación: ${product.quantity}`);
    if (product.categories) lines.push(`- Categorías: ${product.categories}`);
    const ingredients = product.ingredients_text_es || product.ingredients_text;
    if (ingredients) lines.push(`- Ingredientes: ${ingredients}`);
    if (product.nutriscore_grade) lines.push(`- Nutri-Score: ${product.nutriscore_grade.toUpperCase()}`);
    if (typeof product.nova_group === 'number') lines.push(`- Grupo NOVA: ${product.nova_group}`);
    if (product.nutriments && Object.keys(product.nutriments).length) {
      const interesting = ['energy-kcal_100g', 'proteins_100g', 'carbohydrates_100g', 'sugars_100g', 'fat_100g', 'saturated-fat_100g', 'fiber_100g', 'salt_100g', 'sodium_100g'];
      const nutr = product.nutriments as Record<string, unknown>;
      const picked = interesting
        .filter((k) => nutr[k] !== undefined && nutr[k] !== null)
        .map((k) => `  ${k}: ${nutr[k]}`);
      if (picked.length) lines.push(`- Nutrimentos (por 100g):\n${picked.join('\n')}`);
    }
  } else if (barcode) {
    lines.push(`\nNo se encontró el producto en Open Food Facts. Usa la foto y el código para identificarlo.`);
  }

  if (imageBase64) {
    lines.push(
      `\nINSTRUCCIONES PARA ESTE ANÁLISIS:\n- Si la foto muestra la tabla nutricional o ingredientes del envase, ÚSALOS como fuente primaria (más confiable que Open Food Facts).\n- Si los datos de Open Food Facts contradicen lo visible en la foto, prefiere la foto.\n- Si la foto solo muestra el frente del envase y no hay tabla legible, declara los campos nutricionales ausentes en lugar de inventarlos.\n- No estimes valores nutricionales basados en "lo que típicamente tiene este tipo de producto".`
    );
  } else {
    lines.push(
      `\nINSTRUCCIONES PARA ESTE ANÁLISIS:\n- Solo tienes el código de barras y posibles datos de Open Food Facts. Si OFF no devolvió tabla nutricional ni ingredientes, OMITE esos campos y pon salutyScore en null. No inventes valores.`
    );
  }

  lines.push(`\nDevuelve el análisis completo en el formato JSON especificado.`);

  blocks.push({ type: 'text', text: lines.join('\n') });
  return blocks;
}

/**
 * Builds image-based prompt content
 */
export function buildImagePromptContent(
  base64Image: string,
  mimeType: string
): object[] {
  return [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: mimeType,
        data: base64Image,
      },
    },
    {
      type: 'text',
      text: `Analiza este alimento o producto alimentario. Puede ser una foto del producto, su etiqueta nutricional, o ingredientes.

Identifica el producto, sus ingredientes, información nutricional visible, y genera el análisis completo en el formato JSON especificado.

Si la imagen contiene texto (etiqueta, ingredientes, tabla nutricional), extráelo y úsalo para un análisis más preciso.`,
    },
  ];
}
