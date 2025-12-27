const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const checkPremium = (req, res, next) => {
  if (!req.user.is_premium) {
    return res.status(403).json({ 
      error: 'Premium feature', 
      message: 'This feature requires a premium subscription' 
    });
  }
  next();
};

module.exports = { authenticateToken, checkPremium };

