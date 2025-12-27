const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Get all subscriptions for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const subscriptions = await db.all(
      'SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ subscriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Get single subscription
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json({ subscription });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create subscription
router.post('/', authenticateToken, async (req, res) => {
  const { name, price, currency, category, color, billing_cycle, next_billing_date, is_private } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  try {
    // Check subscription limit for non-premium users
    const result = await db.get('SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ?', [req.user.id]);
    const user = await db.get('SELECT is_premium, premium_expires_at FROM users WHERE id = ?', [req.user.id]);

    const isPremiumActive = user.is_premium && 
      (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date());

    if (!isPremiumActive && result.count >= 5) {
      return res.status(403).json({ 
        error: 'Abonelik limiti doldu', 
        message: 'Ücretsiz kullanıcılar en fazla 5 abonelik takip edebilir. Sınırsız takip için Premium\'a geçin.',
        upgrade_required: true
      });
    }

    const insertResult = await db.run(
      `INSERT INTO subscriptions 
      (user_id, name, price, currency, category, color, billing_cycle, next_billing_date, last_used, is_private) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?) RETURNING id`,
      [req.user.id, name, price, currency || '₺', category || 'Diğer', color || 'bg-blue-500', billing_cycle || 'monthly', next_billing_date, is_private ? 1 : 0]
    );

    const subscriptionId = insertResult.lastID;
    const subscription = await db.get('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
    
    // Activity feed'e ekle - SADECE PRIVATE DEĞİLSE!
    if (!is_private) {
      await db.run(
        `INSERT INTO activity_feed (user_id, activity_type, subscription_id, subscription_name, subscription_price, subscription_currency)
         VALUES (?, 'subscription_added', ?, ?, ?, ?)`,
        [req.user.id, subscriptionId, name, price, currency || '₺']
      );
    }
    
    res.status(201).json({ 
      message: 'Subscription created successfully', 
      subscription 
    });
  } catch (error) {
    console.error('Create sub error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

// Update subscription
router.put('/:id', authenticateToken, async (req, res) => {
  const { name, price, currency, category, color, billing_cycle, next_billing_date } = req.body;
  const subscriptionId = req.params.id;

  try {
    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [subscriptionId, req.user.id]
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (price && price !== subscription.price) {
      await db.run(
        'INSERT INTO price_history (subscription_id, old_price, new_price) VALUES (?, ?, ?)',
        [subscriptionId, subscription.price, price]
      );
    }

    const updates = [];
    const values = [];

    if (name) { updates.push('name = ?'); values.push(name); }
    if (price) { updates.push('price = ?'); values.push(price); }
    if (currency) { updates.push('currency = ?'); values.push(currency); }
    if (category) { updates.push('category = ?'); values.push(category); }
    if (color) { updates.push('color = ?'); values.push(color); }
    if (billing_cycle) { updates.push('billing_cycle = ?'); values.push(billing_cycle); }
    if (next_billing_date) { updates.push('next_billing_date = ?'); values.push(next_billing_date); }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(subscriptionId, req.user.id);

    await db.run(
      `UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`,
      values
    );

    const updated = await db.get('SELECT * FROM subscriptions WHERE id = ?', [subscriptionId]);
    res.json({ 
      message: 'Subscription updated successfully', 
      subscription: updated 
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// Delete subscription
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await db.run(
      'DELETE FROM subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    res.json({ message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

// Log usage
router.post('/:id/usage', authenticateToken, async (req, res) => {
  const { used_at } = req.body;
  
  try {
    const subscription = await db.get(
      'SELECT * FROM subscriptions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    if (!used_at || new Date(used_at) >= new Date(subscription.last_used || 0)) {
      await db.run(
        'UPDATE subscriptions SET last_used = ? WHERE id = ?',
        [used_at || new Date().toISOString(), req.params.id]
      );
    }

    await db.run(
      used_at 
        ? 'INSERT INTO usage_logs (subscription_id, used_at) VALUES (?, ?)'
        : 'INSERT INTO usage_logs (subscription_id) VALUES (?)',
      used_at ? [req.params.id, used_at] : [req.params.id]
    );

    res.json({ message: 'Usage logged successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to log usage' });
  }
});

module.exports = router;
