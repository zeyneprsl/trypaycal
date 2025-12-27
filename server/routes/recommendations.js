const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Kullanıcı profilini kaydet/güncelle
router.post('/profile', authenticateToken, async (req, res) => {
  const { occupation, is_student, interests } = req.body;

  try {
    const existing = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);

    if (existing) {
      await db.run(
        `UPDATE user_profiles 
         SET occupation = ?, is_student = ?, interests = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE user_id = ?`,
        [occupation, is_student ? 1 : 0, interests, req.user.id]
      );
    } else {
      await db.run(
        `INSERT INTO user_profiles (user_id, occupation, is_student, interests) VALUES (?, ?, ?, ?)`,
        [req.user.id, occupation, is_student ? 1 : 0, interests]
      );
    }
    res.json({ message: 'Profil başarıyla güncellendi' });
  } catch (error) {
    res.status(500).json({ error: 'Profil işlemi başarısız' });
  }
});

// Kullanıcının profilini al
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
    res.json({ profile: profile || null });
  } catch (error) {
    res.status(500).json({ error: 'Profil alınamadı' });
  }
});

// Topluluk önerileri - KURAL TABANLI
router.get('/community', authenticateToken, async (req, res) => {
  try {
    const profile = await db.get('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
    if (!profile) return res.json({ recommendations: [] });

    const targetOccupation = profile.occupation;
    const popular = await db.all(
      `SELECT s.name as subscription_name, s.category, COUNT(DISTINCT s.user_id) as user_count, AVG(s.price) as avg_price, s.currency
       FROM subscriptions s
       JOIN user_profiles up ON s.user_id = up.user_id
       WHERE up.occupation = ? OR (up.is_student = 1 AND ? = 1)
       GROUP BY s.name, s.category, s.currency
       ORDER BY user_count DESC LIMIT 10`,
      [targetOccupation, profile.is_student]
    );

    res.json({ recommendations: popular, target_group: profile.is_student ? 'Öğrenciler' : targetOccupation });
  } catch (error) {
    res.status(500).json({ error: 'Öneriler alınamadı' });
  }
});

// Meslek listesi
router.get('/occupations', (req, res) => {
  res.json({
    occupations: [
      { id: 'student', name: 'Öğrenci', icon: '🎓' },
      { id: 'developer', name: 'Yazılım Geliştirici', icon: '💻' },
      { id: 'designer', name: 'Grafik Tasarımcı', icon: '🎨' },
      { id: 'marketer', name: 'Pazarlamacı', icon: '📊' },
      { id: 'other', name: 'Diğer', icon: '👤' }
    ]
  });
});

module.exports = router;
