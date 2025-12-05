import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  description: string;
  emoji: string;
  earnedAt: Date;
  metadata?: any;
}

const AchievementSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'productivity', 
      'time_management', 
      'focus', 
      'streak', 
      'milestone'
    ]
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  emoji: {
    type: String,
    required: true
  },
  earnedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index for fast queries
AchievementSchema.index({ userId: 1, type: 1 });
AchievementSchema.index({ userId: 1, earnedAt: -1 });

export default mongoose.model<IAchievement>('Achievement', AchievementSchema);                                                                                                                                                                                                                                                                                                                                          