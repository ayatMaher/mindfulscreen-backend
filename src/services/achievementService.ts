import Achievement from '../models/Achievement';
import DailySummary from '../models/DailySummary';
import Activity from '../models/Activity';
import mongoose from 'mongoose';

interface AchievementCheck {
  type: string;
  title: string;
  description: string;
  emoji: string;
  metadata?: any;
}

class AchievementService {
  async checkDailyAchievements(userId: mongoose.Types.ObjectId, dailyData: any) {
    const achievements: AchievementCheck[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Check existing achievements for today
    const existingAchievements = await Achievement.find({
      userId,
      earnedAt: {
        $gte: new Date(today + 'T00:00:00.000Z'),
        $lt: new Date(today + 'T23:59:59.999Z')
      }
    });

    const existingTypes = existingAchievements.map(a => a.type);

    // 1. Productive Streak Achievement
    if (dailyData.categories.productive >= 7200 && !existingTypes.includes('productive_streak')) { // 2 hours
      achievements.push({
        type: 'productivity',
        title: 'Productivity Pro',
        description: 'Completed 2+ hours of productive work today',
        emoji: '💼',
        metadata: { productiveTime: dailyData.categories.productive }
      });
    }

    // 2. Balanced Day Achievement
    const totalTime = dailyData.totalTime;
    const socialRatio = dailyData.categories.social / totalTime;
    const productiveRatio = dailyData.categories.productive / totalTime;
    
    if (socialRatio < 0.3 && productiveRatio > 0.4 && !existingTypes.includes('balanced_day')) {
      achievements.push({
        type: 'time_management',
        title: 'Perfect Balance',
        description: 'Great balance between productive time and social browsing',
        emoji: '⚖️',
        metadata: { socialRatio, productiveRatio }
      });
    }

    // 3. Early Bird Achievement
    const firstActivity = await Activity.findOne({ userId })
      .sort({ timestamp: 1 })
      .limit(1);
    
    if (firstActivity) {
      const activityHour = new Date(firstActivity.timestamp).getHours();
      if (activityHour < 9 && !existingTypes.includes('early_bird')) { // Before 9 AM
        achievements.push({
          type: 'focus',
          title: 'Early Bird',
          description: 'Started your productive day before 9 AM',
          emoji: '🐦',
          metadata: { startHour: activityHour }
        });
      }
    }

    // 4. Focus Master Achievement (long productive sessions)
    const productiveActivities = await Activity.find({
      userId,
      category: 'productive',
      timestamp: {
        $gte: new Date(today + 'T00:00:00.000Z'),
        $lt: new Date(today + 'T23:59:59.999Z')
      }
    });

    const longSessions = productiveActivities.filter(a => a.duration >= 1800); // 30+ minutes
    if (longSessions.length >= 2 && !existingTypes.includes('focus_master')) {
      achievements.push({
        type: 'focus',
        title: 'Focus Master',
        description: 'Completed 2+ deep work sessions (30+ minutes each)',
        emoji: '🎯',
        metadata: { longSessions: longSessions.length }
      });
    }

    // 5. Weekly Streak Achievement
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklySummaries = await DailySummary.find({
      userId,
      date: { $gte: weekAgo.toISOString().split('T')[0] },
      'categories.productive': { $gte: 3600 } // At least 1 hour productive each day
    });

    if (weeklySummaries.length >= 5 && !existingTypes.includes('weekly_streak')) {
      achievements.push({
        type: 'streak',
        title: 'Weekly Warrior',
        description: '5+ days of productive work this week',
        emoji: '🔥',
        metadata: { productiveDays: weeklySummaries.length }
      });
    }

    // Save new achievements
    for (const achievement of achievements) {
      const newAchievement = new Achievement({
        userId,
        ...achievement
      });
      await newAchievement.save();
    }

    return achievements;
  }

  async getUserAchievements(userId: mongoose.Types.ObjectId, limit = 10) {
    return await Achievement.find({ userId })
      .sort({ earnedAt: -1 })
      .limit(limit);
  }

  async getAchievementStats(userId: mongoose.Types.ObjectId) {
    const achievements = await Achievement.find({ userId });
    
    const byType = achievements.reduce((acc, ach) => {
      acc[ach.type] = (acc[ach.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = achievements.length;
    const lastEarned = achievements.length > 0 ? achievements[0].earnedAt : null;

    return {
      total,
      byType,
      lastEarned,
      achievements: achievements.slice(0, 5) // Latest 5
    };
  }
}

export default new AchievementService();