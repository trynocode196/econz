require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:5173', 'https://*.railway.app'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/products', require('./routes/products'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/users', require('./routes/users'));
app.use('/api/margins', require('./routes/margins'));

// DB status
app.get('/api/db-status', (req, res) => {
  const mongoose = require('mongoose');
  res.json({
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host,
    name: mongoose.connection.name,
    isMock: mongoose.model('Quote').find.toString().includes('mockDB'),
    mongoUri: process.env.MONGO_URI
  });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Econz Orbit API Running' }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
