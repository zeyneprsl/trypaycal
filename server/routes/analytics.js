const express = require('express');
const router = express.Router();
const { db, isPostgres } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get analytics summary
router.get('/summary', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    // Get totals by currency
    const tlTotal = await db.get('SELECT SUM(price) as total FROM subscriptions WHERE user_id = ? AND currency = ?', [userId, '₺']);
    const usdTotal = await db.get('SELECT SUM(price) as total FROM subscriptions WHERE user_id = ? AND currency = ?', [userId, '$']);
    const eurTotal = await db.get('SELECT SUM(price) as total FROM subscriptions WHERE user_id = ? AND currency = ?', [userId, '€']);

    // Convert to TL (rough estimates)
    const totalMonthly = 
      (tlTotal?.total || 0) + 
      (usdTotal?.total || 0) * 34 + 
      (eurTotal?.total || 0) * 36;

    // Get total subscriptions
    const countResult = await db.get('SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ?', [userId]);

    // Get underused subscriptions (not used in 30 days)
    // Adjusting query for Postgres vs SQLite
    let underusedQuery;
    if (isPostgres) {
      underusedQuery = `SELECT COUNT(*) as count FROM subscriptions 
                        WHERE user_id = ? 
                        AND (last_used IS NULL OR last_used < NOW() - INTERVAL '30 days')`;
    } else {
      underusedQuery = `SELECT COUNT(*) as count FROM subscriptions 
                        WHERE user_id = ? 
                        AND (last_used IS NULL OR julianday('now') - julianday(last_used) > 30)`;
    }
    
    const underusedResult = await db.get(underusedQuery, [userId]);

    res.json({
      totalMonthly: totalMonthly.toFixed(2),
      totalSubscriptions: countResult.count,
      underusedCount: underusedResult.count
    });
  } catch (error) {
    console.error('Summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get underused subscriptions
router.get('/underused', authenticateToken, async (req, res) => {
  try {
    let query;
    if (isPostgres) {
      query = `SELECT * FROM subscriptions 
               WHERE user_id = ? 
               AND (last_used IS NULL OR last_used < NOW() - INTERVAL '30 days')
               ORDER BY price DESC`;
    } else {
      query = `SELECT * FROM subscriptions 
               WHERE user_id = ? 
               AND (last_used IS NULL OR julianday('now') - julianday(last_used) > 30)
               ORDER BY price DESC`;
    }
    
    const subscriptions = await db.all(query, [req.user.id]);
    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get usage statistics for a subscription
router.get('/usage/:id', authenticateToken, async (req, res) => {
  try {
    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Get usage logs for last 30 days
    let query;
    if (isPostgres) {
      query = `SELECT DATE(created_at) as date, COUNT(*) as count 
               FROM usage_logs 
               WHERE subscription_id = ? 
               AND created_at >= NOW() - INTERVAL '30 days'
               GROUP BY DATE(created_at)
               ORDER BY date DESC`;
    } else {
      query = `SELECT DATE(created_at) as date, COUNT(*) as count 
               FROM usage_logs 
               WHERE subscription_id = ? 
               AND julianday('now') - julianday(created_at) <= 30
               GROUP BY DATE(created_at)
               ORDER BY date DESC`;
    }
    
    const logs = await db.all(query, [req.params.id]);

    const totalUsage = logs.reduce((sum, log) => sum + parseInt(log.count), 0);
    const daysActive = logs.length;

    res.json({
      subscription,
      usage: logs,
      stats: {
        totalUsage,
        daysActive,
        avgPerDay: daysActive > 0 ? (totalUsage / 30).toFixed(1) : 0
      }
    });
  } catch (error) {
    console.error('Usage error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get price history
router.get('/price-history/:id', authenticateToken, async (req, res) => {
  try {
    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    const history = await db.all(
      'SELECT * FROM price_history WHERE subscription_id = ? ORDER BY change_date DESC',
      [req.params.id]
    );
    res.json({ history });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get category breakdown
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await db.all(
      `SELECT category, COUNT(*) as count, SUM(price) as total
       FROM subscriptions 
       WHERE user_id = ?
       GROUP BY category`,
      [req.user.id]
    );
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
