const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const { Pool } = require('pg');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// Database connection (if DATABASE_URL is provided)
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  
  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Error connecting to database:', err);
    } else {
      console.log('Database connected:', res.rows[0].now);
    }
  });
}

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Bot status route
app.get('/api/bot/status', (req, res) => {
  // This would be connected to the actual bot status in production
  res.json({
    status: 'online',
    servers: 125,
    users: 15000,
    uptime: '3 days, 5 hours',
    version: '1.0.0'
  });
});

// Static files for dashboard
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all route for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});

// Handle unexpected errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});