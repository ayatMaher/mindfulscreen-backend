import dotenv from 'dotenv';

dotenv.config();

// Convert JWT expire string to seconds
const parseJwtExpire = (expireString: string): number => {
  const match = expireString.match(/^(\d+)([smhd])$/);
  if (!match) return 2592000; // Default: 30 days in seconds
  
  const value = parseInt(match[1]);
  const unit = match[2];
  
  switch (unit) {
    case 's': return value; // seconds
    case 'm': return value * 60; // minutes
    case 'h': return value * 60 * 60; // hours
    case 'd': return value * 24 * 60 * 60; // days
    default: return 2592000;
  }
};

const config = {
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/mindfulscreen',
  jwtSecret: process.env.JWT_SECRET || 'your_secret_key_change_this',
  jwtExpire: parseJwtExpire(process.env.JWT_EXPIRE || '30d'),
  port: parseInt(process.env.PORT || '3002', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production'
};

// Validation
if (!config.mongodbUri) {
  throw new Error('MONGODB_URI is required in environment variables');
}

if (!config.jwtSecret || config.jwtSecret === 'your_secret_key_change_this') {
  console.warn('⚠️  WARNING: Using default JWT secret. Change this in production!');
}

export { config };