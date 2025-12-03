import app from './api/index';
import { config } from './utils/config';

const PORT = config.port;

const server = app.listen(PORT, () => {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('🚀  MindfulScreen Backend Server Started');
  console.log('══════════════════════════════════════════════════════════════');
  console.log(`📡  Port: ${PORT}`);
  console.log(`🌐  Environment: ${config.nodeEnv}`);
  console.log(`🔗  Local URL: http://localhost:${PORT}`);
  console.log(`🏥  Health Check: http://localhost:${PORT}/api/health`);
  console.log('══════════════════════════════════════════════════════════════');
  console.log('📚  Available Endpoints:');
  console.log('   GET    /                 - API Info');
  console.log('   GET    /api/health       - Health Check');
  console.log('   POST   /api/auth/register - Register User');
  console.log('   POST   /api/auth/login    - Login User');
  console.log('   GET    /api/auth/me       - Get Current User (Auth)');
  console.log('   POST   /api/data/sync     - Sync Data (Auth)');
  console.log('   GET    /api/data/dashboard - Get Dashboard Data (Auth)');
  console.log('══════════════════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
});