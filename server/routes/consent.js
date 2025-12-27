const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Kullanıcının consent durumunu al
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const consent = await db.get('SELECT * FROM user_consent WHERE user_id = ?', [req.user.id]);

    if (!consent) {
      return res.json({ 
        has_consented: false,
        analytics_consent: false
      });
    }

    res.json({
      has_consented: true,
      analytics_consent: !!consent.analytics_consent
    });
  } catch (error) {
    res.status(500).json({ error: 'Consent durumu alınamadı' });
  }
});

// Consent kaydet/güncelle
router.post('/save', authenticateToken, async (req, res) => {
  const { analytics_consent } = req.body;

  try {
    const existing = await db.get('SELECT * FROM user_consent WHERE user_id = ?', [req.user.id]);

    if (existing) {
      await db.run(
        `UPDATE user_consent SET analytics_consent = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
        [analytics_consent ? 1 : 0, req.user.id]
      );
    } else {
      await db.run(
        `INSERT INTO user_consent (user_id, analytics_consent) VALUES (?, ?)`,
        [req.user.id, analytics_consent ? 1 : 0]
      );
    }
    res.json({ message: 'Tercihleriniz kaydedildi' });
  } catch (error) {
    res.status(500).json({ error: 'Consent işlemi başarısız' });
  }
});

// Privacy Policy içeriği
router.get('/privacy-policy', (req, res) => {
  res.json({
    title: 'Gizlilik Politikası',
    last_updated: '26 Aralık 2025',
    sections: [
      {
        title: '1. Veri Toplama',
        content: 'Paycal, abonelik takibi ve istatistiksel analiz için minimal veri toplar.'
      }
      // ... Diğer bölümler
    ]
  });
});

module.exports = router;
