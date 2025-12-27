require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const db = require('./database');
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const analyticsRoutes = require('./routes/analytics');
const friendsRoutes = require('./routes/friends');
const discoverRoutes = require('./routes/discover');
const profileRoutes = require('./routes/profile');
const inviteRoutes = require('./routes/invite');
const premiumRoutes = require('./routes/premium');
const consentRoutes = require('./routes/consent');
const recommendationsRoutes = require('./routes/recommendations');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: ['http://localhost:8081', 'http://localhost:19006', 'http://localhost:5173'], // Expo Web portlarını ekledik
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/discover', discoverRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/premium', premiumRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/recommendations', recommendationsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Paycal API is running' });
});

// Cron job - Her gün saat 09:00'da çalışır (fiyat artışı kontrolü)
cron.schedule('0 9 * * *', () => {
  console.log('🔍 Checking for price increases...');
  // TODO: Implement price checking logic
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!', 
    message: err.message 
  });
});

// Initialize database and start server
db.initialize()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📊 Database initialized successfully`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

