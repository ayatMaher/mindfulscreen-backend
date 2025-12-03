import mongoose from 'mongoose';

const DailySummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String,
    required: true
  },
  totalTime: {
    type: Number,
    default: 0
  },
  categories: {
    productive: { type: Number, default: 0 },
    social: { type: Number, default: 0 },
    entertainment: { type: Number, default: 0 },
    shopping: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Composite unique index
DailySummarySchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.models.DailySummary || mongoose.model('DailySummary', DailySummarySchema);