import mongoose, { Schema, Document } from 'mongoose';

export interface IDailySummary extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD format
  totalTime: number; // in seconds
  categories: {
    productive: number;
    social: number;
    entertainment: number;
    shopping: number;
    other: number;
  };
  deviceId?: string;
}

const DailySummarySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  totalTime: {
    type: Number,
    required: true,
    default: 0
  },
  categories: {
    productive: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  deviceId: {
    type: String,
    default: 'unknown'
  }
}, {
  timestamps: true
});

// Compound index for fast lookups
DailySummarySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IDailySummary>('DailySummary', DailySummarySchema);