import { Router, Request, Response } from 'express';
import Activity from '../models/Activity';
import DailySummary from '../models/DailySummary';
import User from '../models/User';
import { auth } from '../middleware/auth';

const router = Router();

// Sync user data
router.post('/sync', auth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { activities, dailySummary, settings } = req.body;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Update user settings if provided
    if (settings) {
      user.settings = { ...user.settings, ...settings };
    }

    // Update last sync time
    user.lastSync = new Date();
    await user.save();

    let syncedActivities = 0;
    let syncedSummary = false;

    // Sync activities
    if (activities && Array.isArray(activities)) {
      for (const activity of activities) {
        const syncId = `${user.id}-${activity.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        try {
          await Activity.findOneAndUpdate(
            { syncId },
            {
              userId: user.id,
              deviceId: user.deviceId,
              url: activity.url,
              title: activity.title,
              domain: activity.domain,
              category: activity.category,
              duration: activity.duration,
              timestamp: new Date(activity.timestamp),
              syncId
            },
            { upsert: true, new: true }
          );
          syncedActivities++;
        } catch (error) {
          console.error('Error syncing activity:', error);
        }
      }
    }

    // Sync daily summary
    if (dailySummary) {
      const today = new Date().toISOString().split('T')[0];
      
      try {
        await DailySummary.findOneAndUpdate(
          { userId: user.id, date: today },
          {
            userId: user.id,
            date: today,
            totalTime: dailySummary.totalTime || 0,
            categories: dailySummary.categories || {
              productive: 0,
              social: 0,
              entertainment: 0,
              shopping: 0,
              other: 0
            }
          },
          { upsert: true, new: true }
        );
        syncedSummary = true;
      } catch (error) {
        console.error('Error syncing daily summary:', error);
      }
    }

    res.json({
      success: true,
      message: 'Data synced successfully',
      stats: {
        activitiesSynced: syncedActivities,
        summarySynced: syncedSummary,
        lastSync: user.lastSync
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync data'
    });
  }
});

// Get user data
router.get('/dashboard', auth, async (req: Request, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Get recent activities (last 20)
    const activities = await Activity.find({ userId: user.id })
      .sort({ timestamp: -1 })
      .limit(20)
      .lean();

    // Get today's summary
    const today = new Date().toISOString().split('T')[0];
    let dailySummary = await DailySummary.findOne({
      userId: user.id,
      date: today
    }).lean();

    // Get weekly data (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyData = await DailySummary.find({
      userId: user.id,
      date: { $gte: weekAgo.toISOString().split('T')[0] }
    })
    .sort({ date: 1 })
    .lean();

    // Get activities count
    const totalActivities = await Activity.countDocuments({ userId: user.id });

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        activities,
        dailySummary: dailySummary || {
          date: today,
          totalTime: 0,
          categories: {
            productive: 0,
            social: 0,
            entertainment: 0,
            shopping: 0,
            other: 0
          }
        },
        weeklyData,
        stats: {
          totalActivities,
          daysTracked: weeklyData.length
        }
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data'
    });
  }
});

export default router;