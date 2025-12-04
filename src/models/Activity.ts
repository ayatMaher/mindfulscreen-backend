import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;
  url: string;
  title: string;
  timestamp: Date;
  domain: string;
  category: 'productive' | 'social' | 'entertainment' | 'shopping' | 'other';
  duration: number;
  deviceId?: string;
  extensionId?: string; // For extension's id
  syncId?: string; // Rename or remove unique constraint
  categoryInfo?: {
    emoji: string;
    color: string;
    name: string;
  };
  createdAt: Date;
}

const ActivitySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  domain: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['productive', 'social', 'entertainment', 'shopping', 'other'],
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  deviceId: {
    type: String,
    default: 'unknown'
  },
  extensionId: {
    type: String,
    sparse: true // Allows null/undefined, no unique constraint
  },
  syncId: {
    type: String,
    sparse: true, // Change from unique: true to sparse: true
    index: true
  },
  categoryInfo: {
    emoji: String,
    color: String,
    name: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ userId: 1, extensionId: 1 }, { sparse: true });
ActivitySchema.index({ userId: 1, syncId: 1 }, { sparse: true });
ActivitySchema.index({ userId: 1, domain: 1 });

export default mongoose.model<IActivity>('Activity', ActivitySchema);