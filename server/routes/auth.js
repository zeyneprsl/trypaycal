const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email ve şifre gereklidir' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // PostgreSQL'de dönen ID'yi almak için RETURNING id ekliyoruz (SQLite'da hata vermez)
    const query = 'INSERT INTO users (email, password, name) VALUES (?, ?, ?) RETURNING id';
    const result = await db.run(query, [email, hashedPassword, name || '']);
    
    const userId = result.lastID;

    const token = jwt.sign(
      { id: userId, email, is_premium: 0 },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Kullanıcı başarıyla oluşturuldu',
      token,
      user: { id: userId, email, name, is_premium: false }
    });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed') || error.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Bu e-posta zaten kullanımda' });
    }
    console.error('Kayıt hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email ve şifre gereklidir' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user) {
      return res.status(401).json({ error: 'Geçersiz giriş bilgileri' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Geçersiz giriş bilgileri' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, is_premium: user.is_premium },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Giriş başarılı',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        is_premium: Boolean(user.is_premium)
      }
    });
  } catch (error) {
    console.error('Giriş hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, email, name, is_premium FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }
    
    res.json({ user: { ...user, is_premium: Boolean(user.is_premium) } });
  } catch (error) {
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;
