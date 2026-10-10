import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

import { config } from './config';
import { ApiResponse } from './types';

// Import routes
import authRoutes from './routes/auth';
import materialRoutes from './routes/materials';
import webhookRoutes from './routes/webhooks';
import filterRoutes from './routes/filters';
import courseRoutes from './routes/courses';
import questionRoutes from './routes/questions';
import superAdminRoutes from './routes/super-admin';
import collectionsRoutes from './routes/collections';
import notificationRoutes from './routes/notifications';
import scheduleRoutes from './routes/schedules';


const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.includes('/materials') && req.method === 'POST',
});

const allowedOrigins = [
  config.frontendUrl,
  'https://kustudyhub.vercel.app',
  'https://study-materials-cyan.vercel.app',
  'http://localhost:3000',
  'http://localhost:3001',
].filter(Boolean);

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(limiter);
app.use(cors(corsOptions));
app.use(compression());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/collections', collectionsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/schedules', scheduleRoutes);


// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Khulna University Study Materials Backend is running',
    data: {
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      version: '1.0.0',
    },
  } as ApiResponse);
});

// 404 handler
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  } as ApiResponse);
});

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: 'Internal Server Error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong',
  } as ApiResponse);
});

// Start server only if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  const server = app.listen(config.port, () => {
    console.log(`🚀 Server is running on port ${config.port}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Health check: http://localhost:${config.port}/health`);
    console.log(`📚 API Documentation: http://localhost:${config.port}/api`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

export default app;