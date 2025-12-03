import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  deviceId: {
    type: String,
    required: [true, 'Device ID is required']
  },
  settings: {
    breakInterval: { type: Number, default: 60 },
    dailyLimit: { type: Number, default: 240 },
    enableNotifications: { type: Boolean, default: true },
    goals: {
      dailyProductiveTime: { type: Number, default: 120 },
      maxSocialTime: { type: Number, default: 60 },
      maxEntertainmentTime: { type: Number, default: 120 },
      maxShoppingTime: { type: Number, default: 60 }
    },
    notificationSettings: {
      breakReminders: { type: Boolean, default: true },
      dailyLimits: { type: Boolean, default: true },
      categoryLimits: { type: Boolean, default: true },
      achievements: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      snoozeDuration: { type: Number, default: 10 },
      enableSound: { type: Boolean, default: false },
      urgentMode: { type: Boolean, default: false }
    },
    breakSchedule: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: '09:00' },
      endTime: { type: String, default: '18:00' },
      weekendsEnabled: { type: Boolean, default: false }
    }
  },
  lastSync: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  const user = this as any;
  
  if (!user.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON response
UserSchema.set('toJSON', {
  transform: (doc: any, ret: any) => {
    delete ret.password;
    delete ret.__v;
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);