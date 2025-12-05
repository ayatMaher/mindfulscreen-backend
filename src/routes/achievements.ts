import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import achievementService from '../services/achievementService';

const router = Router();

// Get user achievements
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const achievements = await achievementService.getUserAchievements(
      userId,
      Number(limit)
    );

    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievements'
    });
  }
});

// Get achievement stats
router.get('/stats', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const stats = await achievementService.getAchievementStats(userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get achievement stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievement stats'
    });
  }
});

// Get recent achievements (for popup)
router.get('/recent', auth, async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;
    const achievements = await achievementService.getUserAchievements(userId, 5);

    res.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('Get recent achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recent achievements'
    });
  }
});

export default router;