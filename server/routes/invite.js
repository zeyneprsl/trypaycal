const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Kullanıcının invite token'ını al (yoksa oluştur)
router.get('/token', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT invite_token FROM users WHERE id = ?', [req.user.id]);

    if (user.invite_token) {
      return res.json({ 
        token: user.invite_token,
        link: `paycal://invite/${user.invite_token}`
      });
    }

    const token = crypto.randomBytes(16).toString('hex');
    await db.run('UPDATE users SET invite_token = ? WHERE id = ?', [token, req.user.id]);
    
    res.json({ 
      token,
      link: `paycal://invite/${token}`
    });
  } catch (error) {
    res.status(500).json({ error: 'Token işlemi sırasında hata oluştu' });
  }
});

// Token ile kullanıcı bilgisi al
router.get('/user/:token', authenticateToken, async (req, res) => {
  const { token } = req.params;

  try {
    const user = await db.get('SELECT id, email, name FROM users WHERE invite_token = ?', [token]);

    if (!user) {
      return res.status(404).json({ error: 'Geçersiz davet linki' });
    }

    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Kendinize davet linki ile istek gönderemezsiniz' });
    }

    const friendship = await db.get(
      `SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [req.user.id, user.id, user.id, req.user.id]
    );

    const request = await db.get(
      `SELECT * FROM friend_requests WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)`,
      [req.user.id, user.id, user.id, req.user.id]
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        is_friend: !!friendship,
        has_pending_request: !!request
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı bilgisi alınırken hata oluştu' });
  }
});

// Token ile arkadaş isteği gönder
router.post('/accept/:token', authenticateToken, async (req, res) => {
  const { token } = req.params;

  try {
    const user = await db.get('SELECT id FROM users WHERE invite_token = ?', [token]);

    if (!user) {
      return res.status(404).json({ error: 'Geçersiz davet linki' });
    }

    const to_user_id = user.id;

    if (to_user_id === req.user.id) {
      return res.status(400).json({ error: 'Kendinize istek gönderemezsiniz' });
    }

    const friendship = await db.get(
      `SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [req.user.id, to_user_id, to_user_id, req.user.id]
    );

    if (friendship) {
      return res.status(400).json({ error: 'Zaten arkadaşsınız' });
    }

    const request = await db.get(
      `SELECT * FROM friend_requests WHERE (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)`,
      [req.user.id, to_user_id, to_user_id, req.user.id]
    );

    if (request) {
      return res.status(400).json({ error: 'Zaten bir istek var' });
    }

    const result = await db.run(
      `INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?) RETURNING id`,
      [req.user.id, to_user_id]
    );
    
    res.json({ message: 'Arkadaş isteği gönderildi', requestId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'İşlem sırasında hata oluştu' });
  }
});

module.exports = router;
