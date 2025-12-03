import mongoose from 'mongoose';

const ActivitySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deviceId: {
    type: String,
    required: true
  },
  url: String,
  title: String,
  domain: String,
  category: {
    type: String,
    enum: ['productive', 'social', 'entertainment', 'shopping', 'other'],
    default: 'other'
  },
  duration: {
    type: Number,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  syncId: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
ActivitySchema.index({ userId: 1, timestamp: -1 });
ActivitySchema.index({ syncId: 1 }, { unique: true });

export default mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);