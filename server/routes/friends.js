const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Kullanıcı arama (email veya isim ile)
router.get('/search', authenticateToken, async (req, res) => {
  const { query } = req.query;
  
  if (!query || query.length < 2) {
    return res.status(400).json({ error: 'En az 2 karakter girin' });
  }

  try {
    const users = await db.all(
      `SELECT id, email, name 
       FROM users 
       WHERE (email LIKE ? OR name LIKE ?) AND id != ?
       LIMIT 20`,
      [`%${query}%`, `%${query}%`, req.user.id]
    );
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Arama yapılırken hata oluştu' });
  }
});

// Arkadaş isteği gönder
router.post('/request', authenticateToken, async (req, res) => {
  const { to_user_id } = req.body;
  
  if (!to_user_id) {
    return res.status(400).json({ error: 'Kullanıcı ID gerekli' });
  }

  if (to_user_id === req.user.id) {
    return res.status(400).json({ error: 'Kendinize arkadaş isteği gönderemezsiniz' });
  }

  try {
    // Önce zaten arkadaş mı kontrol et
    const friendship = await db.get(
      `SELECT * FROM friends WHERE 
       (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [req.user.id, to_user_id, to_user_id, req.user.id]
    );
    
    if (friendship) {
      return res.status(400).json({ error: 'Zaten arkadaşsınız' });
    }

    // İstek var mı kontrol et
    const request = await db.get(
      `SELECT * FROM friend_requests WHERE 
       (from_user_id = ? AND to_user_id = ?) OR (from_user_id = ? AND to_user_id = ?)`,
      [req.user.id, to_user_id, to_user_id, req.user.id]
    );

    if (request) {
      return res.status(400).json({ error: 'Zaten bir istek var' });
    }

    // Yeni istek oluştur
    const result = await db.run(
      `INSERT INTO friend_requests (from_user_id, to_user_id) VALUES (?, ?) RETURNING id`,
      [req.user.id, to_user_id]
    );
    res.json({ message: 'Arkadaş isteği gönderildi', requestId: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'İşlem sırasında hata oluştu' });
  }
});

// Gelen arkadaş istekleri
router.get('/requests/incoming', authenticateToken, async (req, res) => {
  try {
    const requests = await db.all(
      `SELECT fr.id, fr.from_user_id, fr.created_at, u.email, u.name
       FROM friend_requests fr
       JOIN users u ON fr.from_user_id = u.id
       WHERE fr.to_user_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [req.user.id]
    );
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'İstekler alınırken hata oluştu' });
  }
});

// Gönderilen arkadaş istekleri
router.get('/requests/outgoing', authenticateToken, async (req, res) => {
  try {
    const requests = await db.all(
      `SELECT fr.id, fr.to_user_id, fr.created_at, u.email, u.name
       FROM friend_requests fr
       JOIN users u ON fr.to_user_id = u.id
       WHERE fr.from_user_id = ? AND fr.status = 'pending'
       ORDER BY fr.created_at DESC`,
      [req.user.id]
    );
    res.json({ requests });
  } catch (error) {
    res.status(500).json({ error: 'İstekler alınırken hata oluştu' });
  }
});

// Arkadaş isteğini kabul et
router.post('/request/:requestId/accept', authenticateToken, async (req, res) => {
  const { requestId } = req.params;

  try {
    const request = await db.get(
      `SELECT * FROM friend_requests WHERE id = ? AND to_user_id = ? AND status = 'pending'`,
      [requestId, req.user.id]
    );

    if (!request) {
      return res.status(404).json({ error: 'İstek bulunamadı' });
    }

    await db.run(
      `UPDATE friend_requests SET status = 'accepted', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [requestId]
    );

    await db.run(
      `INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)`,
      [req.user.id, request.from_user_id, request.from_user_id, req.user.id]
    );

    res.json({ message: 'Arkadaş isteği kabul edildi' });
  } catch (error) {
    res.status(500).json({ error: 'İstek kabul edilirken hata oluştu' });
  }
});

// Arkadaş isteğini reddet
router.post('/request/:requestId/reject', authenticateToken, async (req, res) => {
  const { requestId } = req.params;

  try {
    const result = await db.run(
      `UPDATE friend_requests SET status = 'rejected', updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND to_user_id = ?`,
      [requestId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'İstek bulunamadı' });
    }

    res.json({ message: 'Arkadaş isteği reddedildi' });
  } catch (error) {
    res.status(500).json({ error: 'İstek güncellenirken hata oluştu' });
  }
});

// Arkadaş listesi
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const friends = await db.all(
      `SELECT u.id, u.email, u.name, f.created_at as friend_since
       FROM friends f
       JOIN users u ON f.friend_id = u.id
       WHERE f.user_id = ?
       ORDER BY u.name, u.email`,
      [req.user.id]
    );
    res.json({ friends });
  } catch (error) {
    res.status(500).json({ error: 'Arkadaşlar alınırken hata oluştu' });
  }
});

// Arkadaşlığı sonlandır
router.delete('/:friendId', authenticateToken, async (req, res) => {
  const { friendId } = req.params;

  try {
    const result = await db.run(
      `DELETE FROM friends WHERE 
       (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
      [req.user.id, friendId, friendId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Arkadaşlık bulunamadı' });
    }

    res.json({ message: 'Arkadaşlık sonlandırıldı' });
  } catch (error) {
    res.status(500).json({ error: 'Arkadaşlık silinirken hata oluştu' });
  }
});

module.exports = router;
