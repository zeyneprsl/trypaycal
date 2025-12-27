const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Kendi profilini getir
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(
      `SELECT 
         u.id, 
         u.email, 
         u.name, 
         u.created_at,
         us.profile_public,
         us.show_subscriptions,
         us.show_spending,
         us.allow_friend_requests
       FROM users u
       LEFT JOIN user_settings us ON u.id = us.user_id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const stats = await db.get(
      `SELECT 
         COUNT(*) as subscription_count,
         SUM(price) as total_monthly
       FROM subscriptions
       WHERE user_id = ?`,
      [req.user.id]
    );

    const friendCount = await db.get(
      `SELECT COUNT(*) as friend_count FROM friends WHERE user_id = ?`,
      [req.user.id]
    );

    res.json({
      profile: {
        ...user,
        stats: {
          subscription_count: stats.subscription_count || 0,
          total_monthly: stats.total_monthly || 0,
          friend_count: friendCount.friend_count || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Profil alınırken hata oluştu' });
  }
});

// Başka bir kullanıcının profilini getir
router.get('/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  try {
    const friendship = await db.get(
      `SELECT * FROM friends WHERE user_id = ? AND friend_id = ?`,
      [req.user.id, userId]
    );

    const user = await db.get(
      `SELECT 
         u.id, 
         u.email, 
         u.name, 
         u.created_at,
         us.profile_public,
         us.show_subscriptions,
         us.show_spending
       FROM users u
       LEFT JOIN user_settings us ON u.id = us.user_id
       WHERE u.id = ?`,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    if (!user.profile_public && !friendship) {
      return res.status(403).json({ error: 'Bu profil gizli' });
    }

    const stats = await db.get(
      `SELECT 
         COUNT(*) as subscription_count,
         SUM(price) as total_monthly
       FROM subscriptions
       WHERE user_id = ?`,
      [userId]
    );

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_friend: !!friendship,
        stats: {
          subscription_count: user.show_subscriptions ? stats.subscription_count : null,
          total_monthly: user.show_spending ? stats.total_monthly : null
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Profil alınırken hata oluştu' });
  }
});

// Profil bilgilerini güncelle
router.put('/me', authenticateToken, async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ error: 'İsim en az 2 karakter olmalı' });
  }

  try {
    await db.run(`UPDATE users SET name = ? WHERE id = ?`, [name.trim(), req.user.id]);
    res.json({ message: 'Profil güncellendi', name: name.trim() });
  } catch (error) {
    res.status(500).json({ error: 'Profil güncellenirken hata oluştu' });
  }
});

// Gizlilik ayarlarını getir
router.get('/settings/privacy', authenticateToken, async (req, res) => {
  try {
    const settings = await db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [req.user.id]);
    
    if (!settings) {
      return res.json({
        settings: {
          profile_public: 1,
          show_subscriptions: 1,
          show_spending: 0,
          allow_friend_requests: 1
        }
      });
    }

    res.json({ settings });
  } catch (error) {
    res.status(500).json({ error: 'Ayarlar alınırken hata oluştu' });
  }
});

// Gizlilik ayarlarını güncelle
router.put('/settings/privacy', authenticateToken, async (req, res) => {
  const { profile_public, show_subscriptions, show_spending, allow_friend_requests } = req.body;

  try {
    const settings = await db.get(`SELECT * FROM user_settings WHERE user_id = ?`, [req.user.id]);

    if (settings) {
      await db.run(
        `UPDATE user_settings 
         SET profile_public = ?, show_subscriptions = ?, show_spending = ?, allow_friend_requests = ?
         WHERE user_id = ?`,
        [
          profile_public !== undefined ? profile_public : settings.profile_public,
          show_subscriptions !== undefined ? show_subscriptions : settings.show_subscriptions,
          show_spending !== undefined ? show_spending : settings.show_spending,
          allow_friend_requests !== undefined ? allow_friend_requests : settings.allow_friend_requests,
          req.user.id
        ]
      );
    } else {
      await db.run(
        `INSERT INTO user_settings (user_id, profile_public, show_subscriptions, show_spending, allow_friend_requests)
         VALUES (?, ?, ?, ?, ?)`,
        [
          req.user.id,
          profile_public !== undefined ? profile_public : 1,
          show_subscriptions !== undefined ? show_subscriptions : 1,
          show_spending !== undefined ? show_spending : 0,
          allow_friend_requests !== undefined ? allow_friend_requests : 1
        ]
      );
    }
    res.json({ message: 'Ayarlar güncellendi' });
  } catch (error) {
    res.status(500).json({ error: 'Ayarlar güncellenirken hata oluştu' });
  }
});

module.exports = router;
