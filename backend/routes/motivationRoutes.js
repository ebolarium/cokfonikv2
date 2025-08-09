const express = require('express');
const router = express.Router();
const Motivation = require('../models/Motivation');
const { authenticateToken } = require('../middleware/auth');

// @route   POST /api/motivation
// @desc    Save or update user's daily motivation
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { overallHappiness, motivationFun, motivationMusic } = req.body;
    const userId = req.user._id;

    // Validate input
    if (overallHappiness === undefined || motivationFun === undefined || motivationMusic === undefined) {
      return res.status(400).json({
        message: 'All motivation fields are required'
      });
    }

    // Convert to numbers to handle string inputs
    const numHappiness = Number(overallHappiness);
    const numFun = Number(motivationFun);
    const numMusic = Number(motivationMusic);

    // Check if conversion was successful
    if (isNaN(numHappiness) || isNaN(numFun) || isNaN(numMusic)) {
      return res.status(400).json({
        message: 'All motivation values must be valid numbers'
      });
    }

    // Validate ranges using the converted numbers
    if (numHappiness < 1 || numHappiness > 10) {
      return res.status(400).json({
        message: 'Overall happiness must be between 1 and 10'
      });
    }

    if (numFun < 0 || numFun > 10 || numMusic < 0 || numMusic > 10) {
      return res.status(400).json({
        message: 'Motivation values must be between 0 and 10'
      });
    }

    if (numFun + numMusic !== 10) {
      return res.status(400).json({
        message: 'Fun and Music motivation must total 10'
      });
    }

    // Upsert daily motivation using validated numbers
    const motivation = await Motivation.upsertDailyMotivation(userId, {
      overallHappiness: numHappiness,
      motivationFun: numFun,
      motivationMusic: numMusic
    });

    res.json({
      message: 'Motivation saved successfully',
      motivation: {
        overallHappiness: motivation.overallHappiness,
        motivationFun: motivation.motivationFun,
        motivationMusic: motivation.motivationMusic,
        date: motivation.date,
        lastUpdated: motivation.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error saving motivation:', error);
    res.status(500).json({
      message: 'Server error while saving motivation',
      error: error.message
    });
  }
});

// @route   GET /api/motivation/current
// @desc    Get user's current motivation (today's or most recent)
// @access  Private
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    const motivation = await Motivation.getCurrentMotivation(userId);

    if (!motivation) {
      return res.status(404).json({
        message: 'No motivation data found',
        hasData: false
      });
    }

    res.json({
      hasData: true,
      motivation: {
        overallHappiness: motivation.overallHappiness,
        motivationFun: motivation.motivationFun,
        motivationMusic: motivation.motivationMusic,
        date: motivation.date,
        lastUpdated: motivation.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error fetching motivation:', error);
    res.status(500).json({
      message: 'Server error while fetching motivation',
      error: error.message
    });
  }
});

// @route   GET /api/motivation/analytics
// @desc    Get motivation analytics for admin dashboard
// @access  Private (Admin only)
router.get('/analytics', authenticateToken, async (req, res) => {
  try {
    // TODO: Add admin role check
    // if (req.user.role !== 'Master Admin') {
    //   return res.status(403).json({ message: 'Access denied' });
    // }

    const today = new Date().toISOString().split('T')[0];
    
    // Get last 30 days of data for trend analysis
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().split('T')[0];
    
    // Get historical motivations (last 30 days)
    const historicalMotivations = await Motivation.find({ 
      date: { $gte: startDate, $lte: today }
    }).sort({ date: 1 });
    
    // Get today's motivations
    const todayMotivations = await Motivation.find({ date: today });
    
    // Calculate daily trends
    const dailyTrends = {};
    historicalMotivations.forEach(motivation => {
      if (!dailyTrends[motivation.date]) {
        dailyTrends[motivation.date] = {
          date: motivation.date,
          motivations: [],
          participantCount: 0
        };
      }
      dailyTrends[motivation.date].motivations.push(motivation);
      dailyTrends[motivation.date].participantCount++;
    });
    
    // Calculate averages for each day
    const trendData = Object.values(dailyTrends).map(day => {
      const motivations = day.motivations;
      const count = motivations.length;
      
      if (count === 0) {
        return {
          date: day.date,
          participantCount: 0,
          averageHappiness: 0,
          averageFun: 0,
          averageMusic: 0
        };
      }
      
      const totalHappiness = motivations.reduce((sum, m) => sum + m.overallHappiness, 0);
      const totalFun = motivations.reduce((sum, m) => sum + m.motivationFun, 0);
      const totalMusic = motivations.reduce((sum, m) => sum + m.motivationMusic, 0);
      
      return {
        date: day.date,
        participantCount: count,
        averageHappiness: Math.round((totalHappiness / count) * 10) / 10,
        averageFun: Math.round((totalFun / count) * 10) / 10,
        averageMusic: Math.round((totalMusic / count) * 10) / 10
      };
    });
    
    // Today's data (current implementation)
    let todayData = {
      date: today,
      participantCount: 0,
      averages: {
        overallHappiness: 0,
        motivationFun: 0,
        motivationMusic: 0
      },
      funMusicRatio: {
        fun: 50,
        music: 50
      }
    };
    
    if (todayMotivations.length > 0) {
      const totalHappiness = todayMotivations.reduce((sum, m) => sum + m.overallHappiness, 0);
      const totalFun = todayMotivations.reduce((sum, m) => sum + m.motivationFun, 0);
      const totalMusic = todayMotivations.reduce((sum, m) => sum + m.motivationMusic, 0);
      const count = todayMotivations.length;
      
      todayData = {
        date: today,
        participantCount: count,
        averages: {
          overallHappiness: Math.round((totalHappiness / count) * 10) / 10,
          motivationFun: Math.round((totalFun / count) * 10) / 10,
          motivationMusic: Math.round((totalMusic / count) * 10) / 10
        },
        funMusicRatio: {
          fun: Math.round((totalFun / (totalFun + totalMusic)) * 100),
          music: Math.round((totalMusic / (totalFun + totalMusic)) * 100)
        }
      };
    }
    
    res.json({
      ...todayData,
      trends: trendData
    });

  } catch (error) {
    console.error('Error fetching motivation analytics:', error);
    res.status(500).json({
      message: 'Server error while fetching analytics',
      error: error.message
    });
  }
});

module.exports = router;
