/**
 * LLM Service for HS Code Classification using Ollama (Qwen2.5)
 */
import { Ollama } from 'ollama';

const DEFAULT_MODEL = 'qwen2.5:7b';
const DEFAULT_TIMEOUT = 60000; // 60 seconds

/**
 * Creates a timeout promise that rejects after specified ms
 */
function createTimeoutPromise(ms) {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );
}

/**
 * Sanitize user input to prevent prompt injection
 * Escapes special characters and removes potential injection patterns
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';

  // Normalize Unicode first to prevent lookalike character bypasses
  let sanitized = input.normalize('NFKC');

  // Limit length to prevent DoS
  sanitized = sanitized.slice(0, 2000);

  // Normalize whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Injection patterns to filter
  const injectionPatterns = [
    /ignore\s*(all|previous|above)\s*instructions?/gi,
    /system\s*prompt/gi,
    /disregard\s*(everything|all|previous)/gi,
    /you\s*are\s*now/gi,
    /act\s*as\s*(a|an)?/gi,
    /new\s*(role|instructions?|task)/gi,
    /forget\s*(everything|all|previous)/gi,
    /pretend\s*(to\s*be|you\s*are)/gi,
    /\{\{|\}\}/g, // Template markers
    /<\|.*?\|>/g, // LLM special markers
    /\[INST\]/gi, // Instruction markers
    /###\s*(Human|System|Assistant):/gi, // Role markers
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[FILTERED]');
  }

  return sanitized;
}

// Prompt for classifying goods to HS codes
const CLASSIFICATION_PROMPT = `You are an expert Indonesian customs broker specializing in HS code classification (BTKI 2022).

Given a product description, identify the most likely HS codes.

PRODUCT DESCRIPTION:
{description}

CLASSIFICATION RULES:
1. HS codes are 8 digits in Indonesia (format: XXXX.XX.XX)
2. Consider material, function, and intended use
3. Apply GRI (General Rules of Interpretation)
4. Provide confidence level (high/medium/low)

RESPOND IN JSON FORMAT ONLY:
{{
  "classifications": [
    {{
      "hs_code": "XXXXXXXX",
      "hs_formatted": "XXXX.XX.XX",
      "description": "Brief description in Indonesian",
      "confidence": "high|medium|low",
      "reasoning": "Why this code applies"
    }}
  ],
  "keywords": ["keyword1", "keyword2"],
  "material": "primary material if identifiable",
  "category": "general product category"
}}

Return top 3 most likely codes. JSON only, no markdown.`;

// Prompt for explaining tariffs
const TARIFF_EXPLANATION_PROMPT = `You are an Indonesian customs expert explaining import duties.

HS CODE: {hs_code}
DESCRIPTION: {description}
TARIFF DATA:
- BM MFN: {bm_mfn}%
- PPN: {ppn}%
- PPh API: {pph_api}%
- PPh Non-API: {pph_non_api}%
- ATIGA: {atiga}%
- ACFTA: {acfta}%

Explain these tariffs in simple Indonesian language:
1. What each rate means
2. Total cost calculation example
3. Which FTA agreements might benefit the importer
4. Any special considerations

Be concise, practical, and helpful for importers.`;

// Prompt for natural language search
const SEARCH_ENHANCEMENT_PROMPT = `You are a customs classification expert. Given a natural language query, extract search terms.

QUERY: {query}

Extract:
1. Primary product keywords (Indonesian and English)
2. Material keywords if mentioned
3. Function/use keywords
4. Related HS chapter categories

RESPOND IN JSON FORMAT ONLY:
{{
  "keywords_id": ["keyword1", "keyword2"],
  "keywords_en": ["keyword1", "keyword2"],
  "materials": ["material1"],
  "functions": ["function1"],
  "chapters": ["XX", "YY"]
}}

JSON only, no explanation.`;

// Create shared Ollama client instance
const ollamaClient = new Ollama();

/**
 * Check if Ollama is available with the required model
 */
export async function isOllamaAvailable() {
  try {
    const models = await ollamaClient.list();
    const modelNames = models.models.map(m => m.name);
    const hasModel = modelNames.some(name =>
      name.includes('qwen2.5') || name.includes('qwen2')
    );
    return { available: true, hasModel, models: modelNames };
  } catch (error) {
    return { available: false, hasModel: false, error: error.message };
  }
}

/**
 * Classify a product description to potential HS codes
 * Includes retry logic when JSON parsing fails
 */
export async function classifyProduct(description, model = DEFAULT_MODEL) {
  // Sanitize input to prevent prompt injection
  const sanitizedDescription = sanitizeInput(description);
  if (!sanitizedDescription) {
    throw new Error('Invalid or empty description');
  }

  const prompt = CLASSIFICATION_PROMPT.replace('{description}', sanitizedDescription);
  const MAX_RETRIES = 2;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Classifying product with ${model} (attempt ${attempt}/${MAX_RETRIES})...`);

      // Use Promise.race for timeout
      const response = await Promise.race([
        ollamaClient.chat({
          model,
          messages: [{ role: 'user', content: prompt }],
          options: {
            // Slightly increase temperature on retry to get different response
            temperature: attempt === 1 ? 0.2 : 0.3,
            num_predict: 1024,
          }
        }),
        createTimeoutPromise(DEFAULT_TIMEOUT)
      ]);

      const responseText = response.message.content.trim();
      const result = parseJsonResponse(responseText);

      if (result) {
        return result;
      }

      // If parsing failed and we have more retries, continue
      if (attempt < MAX_RETRIES) {
        console.log(`JSON parsing failed on attempt ${attempt}, retrying...`);
        continue;
      }

      // Last attempt failed - return null to let the caller handle it
      console.error('All classification attempts failed to produce valid JSON');
      return null;

    } catch (error) {
      if (error.message === 'Request timed out') {
        if (attempt < MAX_RETRIES) {
          console.log(`Timeout on attempt ${attempt}, retrying...`);
          continue;
        }
        throw new Error('Classification timed out. Please try again.');
      }

      // For other errors on last attempt, throw
      if (attempt >= MAX_RETRIES) {
        console.error('Classification failed:', error.message);
        throw new Error('Classification service unavailable');
      }
    }
  }

  return null;
}

/**
 * Explain tariff rates in simple language
 */
export async function explainTariffs(hsCode, description, tariffData, model = DEFAULT_MODEL) {
  // Sanitize inputs
  const sanitizedHsCode = sanitizeInput(hsCode).replace(/[^0-9.]/g, '');
  const sanitizedDescription = sanitizeInput(description);

  // Build prompt with template replacement
  const replacements = {
    '{hs_code}': sanitizedHsCode,
    '{description}': sanitizedDescription,
    '{bm_mfn}': String(tariffData.bm_mfn ?? 'N/A'),
    '{ppn}': String(tariffData.ppn ?? '11'),
    '{pph_api}': String(tariffData.pph_api ?? 'N/A'),
    '{pph_non_api}': String(tariffData.pph_non_api ?? 'N/A'),
    '{atiga}': String(tariffData.bm_atiga ?? 'N/A'),
    '{acfta}': String(tariffData.bm_acfta ?? 'N/A'),
  };

  let prompt = TARIFF_EXPLANATION_PROMPT;
  for (const [key, value] of Object.entries(replacements)) {
    prompt = prompt.replace(key, value);
  }

  try {
    console.log(`Explaining tariffs for ${sanitizedHsCode}...`);

    // Use Promise.race for timeout
    const response = await Promise.race([
      ollamaClient.chat({
        model,
        messages: [{ role: 'user', content: prompt }],
        options: {
          temperature: 0.3,
          num_predict: 800,
        }
      }),
      createTimeoutPromise(DEFAULT_TIMEOUT)
    ]);

    return response.message.content.trim();

  } catch (error) {
    if (error.message === 'Request timed out') {
      throw new Error('Explanation timed out. Please try again.');
    }
    console.error('Tariff explanation failed:', error.message);
    throw new Error('Explanation service unavailable');
  }
}

/**
 * Enhance search query with NLP
 */
export async function enhanceSearchQuery(query, model = DEFAULT_MODEL) {
  // Sanitize input
  const sanitizedQuery = sanitizeInput(query);
  if (!sanitizedQuery) {
    return { keywords_id: [query], keywords_en: [query], success: false };
  }

  const prompt = SEARCH_ENHANCEMENT_PROMPT.replace('{query}', sanitizedQuery);

  try {
    console.log(`Enhancing search query: "${sanitizedQuery}"...`);

    // Use Promise.race for timeout
    const response = await Promise.race([
      ollamaClient.chat({
        model,
        messages: [{ role: 'user', content: prompt }],
        options: {
          temperature: 0.1,
          num_predict: 256,
        }
      }),
      createTimeoutPromise(DEFAULT_TIMEOUT)
    ]);

    const responseText = response.message.content.trim();
    const result = parseJsonResponse(responseText);

    return result ? { ...result, success: true } : { keywords_id: [query], keywords_en: [query], success: false };

  } catch (error) {
    console.error('Query enhancement failed:', error.message);
    // Return original query as fallback with success flag
    return { keywords_id: [query], keywords_en: [query], success: false };
  }
}

/**
 * Parse JSON from LLM response with robust error handling
 */
function parseJsonResponse(response) {
  if (!response || typeof response !== 'string') {
    console.error('Empty or invalid response');
    return null;
  }

  let text = response.trim();

  // Strategy 1: Extract from markdown code blocks
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    text = codeBlockMatch[1].trim();
  }

  // Strategy 2: Find JSON object or array boundaries
  const jsonStartIdx = text.search(/[\[{]/);
  const jsonEndIdx = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));

  if (jsonStartIdx !== -1 && jsonEndIdx > jsonStartIdx) {
    text = text.substring(jsonStartIdx, jsonEndIdx + 1);
  }

  // Strategy 3: Clean common LLM JSON issues
  text = text
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Fix unquoted keys (simple cases)
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Remove trailing commas before } or ]
    .replace(/,(\s*[}\]])/g, '$1')
    // Fix single quotes to double quotes
    .replace(/'/g, '"')
    // Remove newlines inside strings (common LLM issue)
    .replace(/"([^"]*)\n([^"]*)"/g, '"$1 $2"');

  // Try parsing
  try {
    return JSON.parse(text);
  } catch (firstError) {
    // Strategy 4: Try to extract just the classifications array if full parse fails
    try {
      const classificationsMatch = text.match(/"classifications"\s*:\s*(\[[\s\S]*?\])/);
      if (classificationsMatch) {
        const classifications = JSON.parse(classificationsMatch[1]);
        return {
          classifications,
          keywords: [],
          material: null,
          category: null
        };
      }
    } catch {
      // Continue to next strategy
    }

    // Strategy 5: Try to manually extract key data
    try {
      const hsCodeMatches = text.match(/"hs_code"\s*:\s*"(\d{6,10})"/g);
      if (hsCodeMatches && hsCodeMatches.length > 0) {
        const classifications = hsCodeMatches.map(match => {
          const code = match.match(/"(\d{6,10})"/)?.[1] || '';
          return {
            hs_code: code,
            hs_formatted: code.replace(/(\d{4})(\d{2})(\d{2})?/, '$1.$2.$3').replace(/\.$/, ''),
            description: 'Extracted from LLM response',
            confidence: 'low',
            reasoning: 'Partial extraction due to JSON parse error'
          };
        });
        console.warn('Used fallback extraction for HS codes');
        return {
          classifications,
          keywords: [],
          material: null,
          category: null
        };
      }
    } catch {
      // All strategies failed
    }

    console.error('Failed to parse JSON after all strategies:', firstError.message);
    console.error('Raw response (first 800 chars):', response.substring(0, 800));
    return null;
  }
}

export default {
  isOllamaAvailable,
  classifyProduct,
  explainTariffs,
  enhanceSearchQuery,
};
