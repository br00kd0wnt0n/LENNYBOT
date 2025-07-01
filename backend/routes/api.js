// backend/api/routes.js
const express = require('express');
const Message = require('../models/Message');
const logger = require('../utils/logger');

const router = express.Router();

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Get today's activity by channel
    const todayActivity = await Message.aggregate([
      { $match: { timestamp: { $gte: today } } },
      { 
        $group: {
          _id: '$channelType',
          messageCount: { $sum: 1 },
          users: { $addToSet: '$userName' },
          lastActivity: { $max: '$timestamp' }
        }
      }
    ]);

    // Get current deliverables status
    const deliverables = await Message.aggregate([
      { $match: { 'analysis.deliverables': { $exists: true, $ne: [] } } },
      { $unwind: '$analysis.deliverables' },
      { 
        $group: {
          _id: {
            name: '$analysis.deliverables.name',
            status: '$analysis.deliverables.status'
          },
          count: { $sum: 1 },
          lastUpdate: { $max: '$timestamp' },
          assignee: { $last: '$analysis.deliverables.assignee' }
        }
      },
      { $sort: { lastUpdate: -1 } }
    ]);

    // Get client sentiment summary
    const clientSentiment = await Message.aggregate([
      { 
        $match: { 
          channelType: 'client',
          timestamp: { $gte: yesterday },
          'analysis.sentiment.score': { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          avgSentiment: { $avg: '$analysis.sentiment.score' },
          totalMessages: { $sum: 1 },
          positiveCount: {
            $sum: { $cond: [{ $gt: ['$analysis.sentiment.score', 0.1] }, 1, 0] }
          },
          negativeCount: {
            $sum: { $cond: [{ $lt: ['$analysis.sentiment.score', -0.1] }, 1, 0] }
          }
        }
      }
    ]);

    // Get urgent items
    const urgentItems = await Message.find({
      'analysis.priority.level': { $in: ['high', 'urgent'] },
      timestamp: { $gte: yesterday }
    })
    .select('userName text channelType analysis.priority timestamp')
    .sort({ timestamp: -1 })
    .limit(10);

    res.json({
      todayActivity,
      deliverables,
      clientSentiment: clientSentiment[0] || { avgSentiment: 0, totalMessages: 0 },
      urgentItems,
      lastUpdated: new Date()
    });

  } catch (error) {
    logger.error('Dashboard API error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get recent activity by channel
router.get('/activity/:channelType', async (req, res) => {
  try {
    const { channelType } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const messages = await Message.find({ channelType })
      .select('userName text timestamp analysis')
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit);

    res.json(messages);

  } catch (error) {
    logger.error('Activity API error:', error);
    res.status(500).json({ error: 'Failed to fetch activity data' });
  }
});

// Get team workload
router.get('/team-workload', async (req, res) => {
  try {
    const workload = await Message.aggregate([
      { 
        $match: { 
          'analysis.deliverables.assignee': { $exists: true },
          'analysis.deliverables.status': { $in: ['concept', 'in-progress', 'review'] }
        }
      },
      { $unwind: '$analysis.deliverables' },
      {
        $group: {
          _id: '$analysis.deliverables.assignee',
          activeDeliverables: { $sum: 1 },
          recentActivity: { $max: '$timestamp' },
          deliverables: {
            $push: {
              name: '$analysis.deliverables.name',
              status: '$analysis.deliverables.status',
              deadline: '$analysis.deliverables.deadline'
            }
          }
        }
      },
      { $sort: { activeDeliverables: -1 } }
    ]);

    res.json(workload);

  } catch (error) {
    logger.error('Team workload API error:', error);
    res.status(500).json({ error: 'Failed to fetch team workload' });
  }
});

// Get daily digest
router.get('/digest', async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const digest = await Message.aggregate([
      { $match: { timestamp: { $gte: startOfDay, $lte: endOfDay } } },
      {
        $group: {
          _id: '$channelType',
          messageCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userName' },
          deliverableUpdates: {
            $push: {
              $cond: [
                { $gt: [{ $size: '$analysis.deliverables' }, 0] },
                '$analysis.deliverables',
                null
              ]
            }
          },
          urgentItems: {
            $push: {
              $cond: [
                { $in: ['$analysis.priority.level', ['high', 'urgent']] },
                {
                  text: '$text',
                  user: '$userName',
                  priority: '$analysis.priority.level'
                },
                null
              ]
            }
          }
        }
      }
    ]);

    res.json({
      date: date.toISOString().split('T')[0],
      summary: digest,
      generatedAt: new Date()
    });

  } catch (error) {
    logger.error('Digest API error:', error);
    res.status(500).json({ error: 'Failed to generate digest' });
  }
});

// Get all deliverables
router.get('/deliverables', async (req, res) => {
  try {
    const deliverables = await Message.aggregate([
      { $match: { 'analysis.deliverables': { $exists: true, $ne: [] } } },
      { $unwind: '$analysis.deliverables' },
      {
        $project: {
          name: '$analysis.deliverables.name',
          status: '$analysis.deliverables.status',
          assignee: '$analysis.deliverables.assignee',
          deadline: '$analysis.deliverables.deadline',
          confidence: '$analysis.deliverables.confidence',
          channelType: '$channelType',
          messageId: '$slackMessageId',
          timestamp: '$timestamp',
          userName: '$userName'
        }
      },
      { $sort: { timestamp: -1 } }
    ]);

    // Group by deliverable name and get the latest status
    const groupedDeliverables = deliverables.reduce((acc, deliverable) => {
      const key = deliverable.name;
      if (!acc[key] || acc[key].timestamp < deliverable.timestamp) {
        acc[key] = deliverable;
      }
      return acc;
    }, {});

    const result = Object.values(groupedDeliverables);

    res.json({
      deliverables: result,
      total: result.length,
      byStatus: {
        concept: result.filter(d => d.status === 'concept').length,
        'in-progress': result.filter(d => d.status === 'in-progress').length,
        review: result.filter(d => d.status === 'review').length,
        approved: result.filter(d => d.status === 'approved').length,
        delivered: result.filter(d => d.status === 'delivered').length
      }
    });

  } catch (error) {
    logger.error('Deliverables API error:', error);
    res.status(500).json({ error: 'Failed to fetch deliverables data' });
  }
});

module.exports = router;