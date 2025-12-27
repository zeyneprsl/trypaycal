const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Arkadaşların aktivitelerini getir (Keşfet ekranı için)
router.get('/feed', authenticateToken, async (req, res) => {
  const { limit = 50, offset = 0 } = req.query;

  try {
    const activities = await db.all(
      `SELECT 
         a.id,
         a.user_id,
         a.activity_type,
         a.subscription_name,
         a.subscription_price,
         a.subscription_currency,
         a.created_at,
         u.name as user_name,
         u.email as user_email
       FROM activity_feed a
       JOIN users u ON a.user_id = u.id
       JOIN friends f ON (f.friend_id = a.user_id AND f.user_id = ?)
       WHERE a.user_id != ?
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, req.user.id, parseInt(limit), parseInt(offset)]
    );
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Aktiviteler alınırken hata oluştu' });
  }
});

// Arkadaş çevrende popüler abonelikler
router.get('/popular', authenticateToken, async (req, res) => {
  try {
    const popular = await db.all(
      `SELECT 
         subscription_name,
         subscription_price,
         subscription_currency,
         COUNT(*) as friend_count,
         GROUP_CONCAT(DISTINCT u.name) as friend_names
       FROM activity_feed a
       JOIN users u ON a.user_id = u.id
       JOIN friends f ON (f.friend_id = a.user_id AND f.user_id = ?)
       WHERE a.activity_type = 'subscription_added'
       GROUP BY subscription_name
       ORDER BY friend_count DESC
       LIMIT 10`,
      [req.user.id]
    );
    
    const result = popular.map(item => ({
      ...item,
      friend_names: item.friend_names ? item.friend_names.split(',') : []
    }));
    
    res.json({ popular: result });
  } catch (error) {
    res.status(500).json({ error: 'Popüler abonelikler alınırken hata oluştu' });
  }
});

// Tüm platformda popüler abonelikler
router.get('/trending', authenticateToken, async (req, res) => {
  try {
    const trending = await db.all(
      `SELECT 
         subscription_name,
         COUNT(*) as user_count,
         AVG(subscription_price) as avg_price,
         subscription_currency
       FROM activity_feed
       WHERE activity_type = 'subscription_added'
         AND created_at >= datetime('now', '-30 days')
       GROUP BY subscription_name
       ORDER BY user_count DESC
       LIMIT 20`,
      []
    );
    res.json({ trending });
  } catch (error) {
    res.status(500).json({ error: 'Trend abonelikler alınırken hata oluştu' });
  }
});

// Kategori bazında öneriler
router.get('/suggestions/:category', authenticateToken, async (req, res) => {
  const { category } = req.params;

  try {
    const suggestions = await db.all(
      `SELECT 
         subscription_name,
         subscription_price,
         subscription_currency,
         COUNT(*) as usage_count
       FROM activity_feed a
       JOIN subscriptions s ON a.subscription_name = s.name
       JOIN friends f ON (f.friend_id = a.user_id AND f.user_id = ?)
       WHERE s.category = ? AND a.activity_type = 'subscription_added'
       GROUP BY subscription_name
       ORDER BY usage_count DESC
       LIMIT 10`,
      [req.user.id, category]
    );
    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Öneriler alınırken hata oluştu' });
  }
});

// Bir arkadaşın aktivitelerini getir
router.get('/friend/:friendId', authenticateToken, async (req, res) => {
  const { friendId } = req.params;

  try {
    const friendship = await db.get(
      `SELECT * FROM friends WHERE user_id = ? AND friend_id = ?`,
      [req.user.id, friendId]
    );

    if (!friendship) {
      return res.status(403).json({ error: 'Bu kullanıcının aktivitelerini göremezsiniz' });
    }

    const activities = await db.all(
      `SELECT 
         a.*,
         u.name as user_name,
         u.email as user_email
       FROM activity_feed a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = ?
       ORDER BY a.created_at DESC
       LIMIT 50`,
      [friendId]
    );
    res.json({ activities });
  } catch (error) {
    res.status(500).json({ error: 'Aktiviteler alınırken hata oluştu' });
  }
});

// Haftanın Önerisi - Sponsorlu İçerik
router.get('/weekly-featured', authenticateToken, async (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const featured = await db.all(
      `SELECT * FROM weekly_featured
       WHERE is_active = 1
         AND week_start_date <= ?
         AND week_end_date >= ?
       ORDER BY impression_payment DESC
       LIMIT 3`,
      [today, today]
    );
    res.json({ featured });
  } catch (error) {
    res.status(500).json({ error: 'Öne çıkan içerik alınırken hata oluştu' });
  }
});

// Gösterim kaydı (impression tracking)
router.post('/weekly-featured/:id/impression', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.run(
      `INSERT INTO featured_impressions (featured_id, user_id) VALUES (?, ?)`,
      [id, req.user.id]
    );

    await db.run(
      `UPDATE weekly_featured SET total_impressions = total_impressions + 1 WHERE id = ?`,
      [id]
    );

    res.json({ message: 'Gösterim kaydedildi', impressionId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Gösterim kaydedilemedi' });
  }
});

// Tıklama kaydı (click tracking)
router.post('/weekly-featured/:id/click', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await db.run(
      `UPDATE weekly_featured SET click_count = click_count + 1 WHERE id = ?`,
      [id]
    );
    res.json({ message: 'Tıklama kaydedildi' });
  } catch (error) {
    res.status(500).json({ error: 'Tıklama kaydedilemedi' });
  }
});

module.exports = router;
