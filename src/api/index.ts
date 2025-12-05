import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { connectDB } from '../utils/database';
import authRoutes from '../routes/auth';
import dataRoutes from '../routes/data';
import { config } from '../utils/config';
import achievementRoutes from '../routes/achievements';


const app = express();

// Connect to MongoDB
connectDB().catch(console.error);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: '*', // Allow all origins (you can restrict this in production)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(morgan(config.isProduction ? 'combined' : 'dev')); // Logging
app.use(express.json({ limit: '10mb' })); // Parse JSON with size limit
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/api/achievements', achievementRoutes);
// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'MindfulScreen API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    service: 'MindfulScreen API',
    status: 'operational',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    database: 'connected' // You can add actual DB connection check
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/data', dataRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Global error handler:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(config.nodeEnv === 'development' && { stack: error.stack })
  });
});

// Export for Vercel serverless function
export default app;