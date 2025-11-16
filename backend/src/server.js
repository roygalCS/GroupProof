const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const inviteRoutes = require('./routes/invites');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', inviteRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'SmartDeadlines backend is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`SmartDeadlines backend server running on port ${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
});

module.exports = app;
