import { Router, Request, Response } from 'express';
import mongoose from 'mongoose'; // ADD THIS IMPORT
import Activity from '../models/Activity';
import DailySummary from '../models/DailySummary';
import achievementService from '../services/achievementService';
import { auth } from '../middleware/auth';

const router = Router();

// Sync user data
router.post('/sync', auth, async (req: Request, res: Response) => {
  try {
    const { activities, dailySummary, deviceId } = req.body;
    const userId = req.user.id;

    console.log(`📊 Syncing data for user: ${userId}`);
    console.log(`   Activities: ${activities?.length || 0}`);
    console.log(`   Daily summary: ${dailySummary ? 'Yes' : 'No'}`);
    console.log(`   Device ID: ${deviceId || 'not provided'}`);

    // Save activities if any
    let savedActivities = 0;
    if (activities && activities.length > 0) {
      const activityDocs = activities.map((activity: any) => {
        // Generate a unique syncId if not provided
        const syncId = activity.syncId ||
          activity.extensionId ||
          activity.id ||
          `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        return {
          userId: new mongoose.Types.ObjectId(userId),
          url: activity.url || '',
          title: activity.title || 'Unknown',
          timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
          domain: activity.domain || 'unknown',
          category: activity.category || 'other',
          duration: activity.duration || 0,
          deviceId: deviceId || 'unknown',
          extensionId: activity.extensionId || activity.id || null,
          syncId: syncId, // Always provide a value
          categoryInfo: activity.categoryInfo || {
            emoji: '🌐',
            color: '#6b7280',
            name: 'Other'
          },
          createdAt: new Date()
        };
      });

      // Remove any existing activities with same extensionId to avoid duplicates
      const extensionIds = activityDocs
        .map((doc: any) => doc.extensionId)
        .filter(Boolean);

      if (extensionIds.length > 0) {
        await Activity.deleteMany({
          userId,
          extensionId: { $in: extensionIds }
        });
        console.log(`🗑️  Removed ${extensionIds.length} potential duplicates`);
      }

      // Insert new activities
      if (activityDocs.length > 0) {
        try {
          await Activity.insertMany(activityDocs, { ordered: false }); // Continue on error
          savedActivities = activityDocs.length;
          console.log(`✅ Saved ${savedActivities} activities`);
        } catch (bulkError: any) {
          // Handle partial failures
          if (bulkError.writeErrors) {
            console.log(`⚠️  Some activities failed: ${bulkError.writeErrors.length} errors`);
            savedActivities = activityDocs.length - bulkError.writeErrors.length;
          }
          console.log(`✅ Saved ${savedActivities} activities (with some errors)`);
        }
      }
    }

    // Save daily summary if exists
    let savedSummary = false;
    if (dailySummary) {
      const today = new Date().toISOString().split('T')[0];
      await DailySummary.findOneAndUpdate(
        { userId, date: today },
        {
          ...dailySummary,
          userId,
          date: today,
          deviceId: deviceId || 'unknown'
        },
        { upsert: true, new: true }
      );
      savedSummary = true;
      console.log(`✅ Saved daily summary for ${today}`);

      // Check for achievements
      try {
        const newAchievements = await achievementService.checkDailyAchievements(
          new mongoose.Types.ObjectId(userId),
          dailySummary
        );

        if (newAchievements.length > 0) {
          console.log(`🎉 Earned ${newAchievements.length} achievements!`);
        }
      } catch (error) {
        console.error('Achievement check failed:', error);
      }
    }

    res.json({
      success: true,
      message: 'Data synced successfully',
      timestamp: new Date().toISOString(),
      stats: {
        totalActivities: activities?.length || 0,
        savedActivities,
        hasSummary: savedSummary
      }
    });
  } catch (error) {
    console.error('❌ Sync error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to sync data',
      details: error.message
    });
  }
});

// Get dashboard data
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

// Get user activities
router.get('/activities', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit = 50, skip = 0 } = req.query;

    const activities = await Activity.find({ userId })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip(Number(skip));

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get activities'
    });
  }
});

// Get daily summaries
router.get('/daily-summaries', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { days = 7 } = req.query;

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - Number(days));

    const summaries = await DailySummary.find({
      userId,
      date: { $gte: dateLimit.toISOString().split('T')[0] }
    }).sort({ date: -1 });

    res.json({
      success: true,
      summaries
    });
  } catch (error) {
    console.error('Get summaries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get daily summaries'
    });
  }
});

export default router;