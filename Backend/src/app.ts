// src/app.ts — Express app setup (middleware + routes)

import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import { errorMiddleware } from './middleware/error.middleware';
import router from './routes/index';
import { logger } from './utils/logger';

const app = express();

// ── Security middleware ────────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5174',
  // Capacitor native WebView origins — the Android/iOS shell sends these, not FRONTEND_URL
  'capacitor://localhost',
  'ionic://localhost',
  'https://localhost',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, cb) => {
    // Allow no-origin requests (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      cb(null, true);
    } else {
      cb(new Error(`CORS: origin ${origin} not allowed`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Device-Type', 'X-App-Version'],
}));

// ── Rate limiting ──────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_MAX) || 200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' } },
  skip: (req) => req.method === 'OPTIONS', // never rate-limit preflight
});
app.use('/api', limiter);

// AI route — more lenient (Gemini is slow, preflight doubles requests)
const aiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5-minute window
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS',
});
app.use('/api/v1/ai', aiLimiter);

// ── Body parsing ───────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(mongoSanitize());

// ── Request logging ────────────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// ── Routes ─────────────────────────────────────────────────────────────
// AI routes get a 2-minute server timeout — Gemini 7-day plan generation is slow
app.use('/api/v1/ai', (req, res, next) => {
  res.setTimeout(120_000, () => {
    if (!res.headersSent) {
      res.status(503).json({
        success: false,
        error: { code: 'TIMEOUT', message: 'AI service took too long. Please try again.' },
      });
    }
  });
  next();
});
app.use('/api/v1', router);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
});

// ── Global error handler ───────────────────────────────────────────────
app.use(errorMiddleware);

export default app;
