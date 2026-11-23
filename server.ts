import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { env } from './server/config/env.ts';
import { connectDatabase, getDatabaseMode } from './server/config/db.ts';
import { ensureDemoUserExists } from './server/utils/seedSampleData.ts';
import { errorHandler } from './server/middleware/auth.ts';
import authRoutes from './server/routes/authRoutes.ts';
import userRoutes from './server/routes/userRoutes.ts';
import socialAccountRoutes from './server/routes/socialAccountRoutes.ts';
import analyticsRoutes from './server/routes/analyticsRoutes.ts';
import postRoutes from './server/routes/postRoutes.ts';
import reportRoutes from './server/routes/reportRoutes.ts';

async function bootstrap() {
  await connectDatabase();
  await ensureDemoUserExists();

  const app = express();
  app.set('trust proxy', 1);

  // Security headers (allow iframe embedding in preview & Vite inline dev scripts cleanly)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      frameguard: false,
    })
  );

  app.use(
    cors({
      origin: true,
      credentials: true,
    })
  );

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 400,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again shortly.' },
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 40,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many authentication attempts, please wait 15 minutes.' },
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));

  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        database: getDatabaseMode(),
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Rate-limited REST API routes
  app.use('/api/auth', authLimiter, authRoutes);
  app.use('/api/users', apiLimiter, userRoutes);
  app.use('/api/social-accounts', apiLimiter, socialAccountRoutes);
  app.use('/api/analytics', apiLimiter, analyticsRoutes);
  app.use('/api/posts', apiLimiter, postRoutes);
  app.use('/api/reports', apiLimiter, reportRoutes);

  app.use('/api', (_req, res) => {
    res.status(404).json({ success: false, message: 'API endpoint not found' });
  });

  app.use(errorHandler);

  // Vite dev middleware vs production static serving
  const distDir = path.resolve(process.cwd(), 'dist');
  const isProd = env.nodeEnv === 'production' && fs.existsSync(distDir);

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[Trendora] Server listening on http://0.0.0.0:${env.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('[Fatal] Failed to start Trendora server:', err);
  process.exit(1);
});
