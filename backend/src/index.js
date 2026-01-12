/**
 * HS Code AI Backend Server
 * Provides AI-powered classification and tariff explanation
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  isOllamaAvailable,
  classifyProduct,
  explainTariffs,
  enhanceSearchQuery
} from './services/llm.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3010', 'http://localhost:5173', 'http://localhost:1010'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS

// Simple rate limiting (in-memory, use Redis for production)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP

// Cleanup expired rate limit entries to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, limit] of rateLimitMap) {
    if (now > limit.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, RATE_LIMIT_WINDOW);

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();

  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }

  const limit = rateLimitMap.get(ip);
  if (now > limit.resetTime) {
    limit.count = 1;
    limit.resetTime = now + RATE_LIMIT_WINDOW;
    return next();
  }

  if (limit.count >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((limit.resetTime - now) / 1000)
    });
  }

  limit.count++;
  next();
}

// Apply rate limiting to AI endpoints
app.use('/api/classify', rateLimit);
app.use('/api/explain-tariff', rateLimit);
app.use('/api/enhance-search', rateLimit);
app.use('/api/quick-classify', rateLimit);

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ============================================
// API ROUTES
// ============================================

/**
 * Health check and LLM status
 */
app.get('/api/health', async (req, res) => {
  const status = await isOllamaAvailable();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    llm: status
  });
});

/**
 * Classify product description to HS codes
 * POST /api/classify
 * Body: { description: string, language?: 'id' | 'en' }
 */
app.post('/api/classify', async (req, res) => {
  try {
    const { description, language = 'id' } = req.body;

    if (!description || description.trim().length < 3) {
      return res.status(400).json({
        error: 'Description is required (minimum 3 characters)'
      });
    }

    console.log(`Classifying: "${description.substring(0, 100)}..."`);

    const result = await classifyProduct(description);

    if (!result) {
      // Return graceful fallback instead of 500 error
      console.warn(`Classification returned no result for: "${description.substring(0, 50)}..."`);
      return res.json({
        success: false,
        query: description,
        language,
        result: {
          classifications: [],
          keywords: description.split(/\s+/).filter(w => w.length > 2),
          material: null,
          category: null
        },
        warning: 'AI tidak dapat mengklasifikasi produk ini. Coba dengan deskripsi yang lebih spesifik atau gunakan pencarian manual.'
      });
    }

    res.json({
      success: true,
      query: description,
      language,
      result
    });

  } catch (error) {
    console.error('Classification error:', error);
    res.status(500).json({
      error: error.message || 'Classification failed'
    });
  }
});

/**
 * Explain tariff rates in simple language
 * POST /api/explain-tariff
 * Body: { hs_code: string, description: string, tariff: TariffData }
 */
app.post('/api/explain-tariff', async (req, res) => {
  try {
    const { hs_code, description, tariff } = req.body;

    if (!hs_code || !tariff) {
      return res.status(400).json({
        error: 'hs_code and tariff data are required'
      });
    }

    console.log(`Explaining tariff for: ${hs_code}`);

    const explanation = await explainTariffs(hs_code, description || '', tariff);

    res.json({
      success: true,
      hs_code,
      explanation
    });

  } catch (error) {
    console.error('Tariff explanation error:', error);
    res.status(500).json({
      error: error.message || 'Explanation failed'
    });
  }
});

/**
 * Enhance search query with NLP
 * POST /api/enhance-search
 * Body: { query: string }
 */
app.post('/api/enhance-search', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        error: 'Query is required (minimum 2 characters)'
      });
    }

    const enhanced = await enhanceSearchQuery(query);

    res.json({
      success: true,
      original_query: query,
      enhanced
    });

  } catch (error) {
    console.error('Search enhancement error:', error);
    res.status(500).json({
      error: error.message || 'Enhancement failed'
    });
  }
});

/**
 * Quick classification - returns just HS codes without full analysis
 * GET /api/quick-classify?q=product+description
 */
app.get('/api/quick-classify', async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.length < 3) {
      return res.status(400).json({
        error: 'Query parameter "q" is required (minimum 3 characters)'
      });
    }

    const result = await classifyProduct(query);

    if (!result || !result.classifications) {
      return res.json({
        success: true,
        codes: []
      });
    }

    // Return simplified response
    res.json({
      success: true,
      codes: result.classifications.map(c => ({
        code: c.hs_code,
        formatted: c.hs_formatted,
        confidence: c.confidence
      }))
    });

  } catch (error) {
    console.error('Quick classify error:', error);
    res.status(500).json({
      error: error.message || 'Classification failed'
    });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║     HS Code AI Backend (Ollama/Qwen2.5)       ║
╠═══════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                ║
║  Health: http://localhost:${PORT}/api/health     ║
╚═══════════════════════════════════════════════╝
  `);

  // Check Ollama on startup
  isOllamaAvailable().then(status => {
    if (status.available && status.hasModel) {
      console.log('✓ Ollama connected, qwen2.5 model available');
    } else if (status.available) {
      console.log('⚠ Ollama connected but qwen2.5 model not found');
      console.log('  Run: ollama pull qwen2.5:7b');
    } else {
      console.log('✗ Ollama not available');
      console.log('  Make sure Ollama is running: ollama serve');
    }
  });
});
