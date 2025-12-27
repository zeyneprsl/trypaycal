const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Premium durumunu kontrol et
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const user = await db.get(`SELECT is_premium, premium_expires_at FROM users WHERE id = ?`, [req.user.id]);

    const isPremiumActive = user.is_premium && 
      (!user.premium_expires_at || new Date(user.premium_expires_at) > new Date());

    res.json({
      is_premium: isPremiumActive,
      expires_at: user.premium_expires_at
    });
  } catch (error) {
    res.status(500).json({ error: 'Premium durumu kontrol edilemedi' });
  }
});

// Premium özellikleri
router.get('/features', (req, res) => {
  res.json({
    free: {
      name: 'Ücretsiz',
      price: 0,
      features: [
        { text: '5 abonelik takibi', included: true },
        { text: 'Temel istatistikler', included: true },
        { text: 'Takvim görünümü', included: true },
        { text: 'Arkadaş ekleme', included: true },
        { text: 'Sınırsız abonelik', included: false },
        { text: 'Fiyat artışı bildirimleri', included: false },
        { text: 'Gelişmiş analitik', included: false },
        { text: 'Bütçe yönetimi', included: false },
        { text: 'Reklamsız deneyim', included: false },
      ]
    },
    premium_monthly: {
      name: 'Premium Aylık',
      price: 20,
      currency: '₺',
      period: 'ay',
      features: [
        { text: 'Sınırsız abonelik takibi', included: true },
        { text: 'Fiyat artışı bildirimleri', included: true },
        { text: 'Gelişmiş analitik & raporlar', included: true },
        { text: 'Bütçe yönetimi', included: true },
        { text: 'Kategori bazlı öngörüler', included: true },
        { text: 'Reklamsız deneyim', included: true },
        { text: 'Öncelikli destek', included: true },
      ]
    },
    premium_yearly: {
      name: 'Premium Yıllık',
      price: 199,
      currency: '₺',
      period: 'yıl',
      discount: '2 ay bedava!',
      features: [
        { text: 'Tüm Premium özellikler', included: true },
        { text: '%17 indirim (2 ay bedava)', included: true },
        { text: 'Yıllık ödeme kolaylığı', included: true },
      ]
    }
  });
});

// Premium satın al (simülasyon)
router.post('/subscribe', authenticateToken, async (req, res) => {
  const { plan } = req.body;

  if (!['monthly', 'yearly'].includes(plan)) {
    return res.status(400).json({ error: 'Geçersiz plan' });
  }

  const now = new Date();
  const expiresAt = new Date(now);
  
  if (plan === 'monthly') {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  } else {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  }

  const amount = plan === 'monthly' ? 20 : 199;
  const subscriptionName = plan === 'monthly' ? 'Paycal Premium (Aylık)' : 'Paycal Premium (Yıllık)';

  try {
    await db.run(
      `UPDATE users SET is_premium = 1, premium_expires_at = ? WHERE id = ?`,
      [expiresAt.toISOString(), req.user.id]
    );

    await db.run(
      `INSERT INTO premium_subscriptions (user_id, plan_type, start_date, end_date, status) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, plan, now.toISOString(), expiresAt.toISOString(), 'active']
    );

    const insertResult = await db.run(
      `INSERT INTO subscriptions 
      (user_id, name, price, currency, category, color, billing_cycle, next_billing_date, last_used) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP) RETURNING id`,
      [req.user.id, subscriptionName, amount, '₺', 'Uygulama', 'bg-yellow-500', plan, expiresAt.toISOString().split('T')[0]]
    );

    const subId = insertResult.lastID;

    await db.run(
      `INSERT INTO activity_feed (user_id, activity_type, subscription_id, subscription_name, subscription_price, subscription_currency)
       VALUES (?, 'subscription_added', ?, ?, ?, ?)`,
      [req.user.id, subId, subscriptionName, amount, '₺']
    );

    res.json({
      message: 'Premium başarıyla aktif edildi! 🎉',
      expires_at: expiresAt.toISOString(),
      plan,
      subscription_added: true
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ error: 'Premium aktivasyonu başarısız' });
  }
});

// Premium iptal et
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    await db.run(`UPDATE users SET is_premium = 0, premium_expires_at = NULL WHERE id = ?`, [req.user.id]);
    res.json({ message: 'Premium abonelik iptal edildi' });
  } catch (error) {
    res.status(500).json({ error: 'İptal işlemi başarısız' });
  }
});

module.exports = router;
