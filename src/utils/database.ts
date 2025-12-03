import mongoose from 'mongoose';
import { config } from './config';

let isConnected = false;
let connectionPromise: Promise<typeof mongoose> | null = null;

const connectDB = async (): Promise<void> => {
  if (isConnected) {
    console.log('✅ MongoDB already connected');
    return;
  }

  try {
    // Use existing connection promise if connection is in progress
    if (!connectionPromise) {
      console.log('🔄 Connecting to MongoDB...');
      
      connectionPromise = mongoose.connect(config.mongodbUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      const conn = await connectionPromise;
      
      isConnected = true;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`📊 Database: ${conn.connection.name}`);
      
      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
        isConnected = false;
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected');
        isConnected = false;
        connectionPromise = null;
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('🔄 MongoDB reconnected');
        isConnected = true;
      });
    } else {
      await connectionPromise;
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    connectionPromise = null;
    isConnected = false;
    
    // Don't exit process in serverless environment
    if (config.isProduction) {
      throw error;
    }
  }
};

export { connectDB };