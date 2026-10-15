const express = require('express');
const path = require('path');
const cors = require('cors');
const logger = require('./utils/logger');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const studentRoutes = require('./routes/student.routes');
const mentorRoutes = require('./routes/mentor.routes');

const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing (support base64 evidence uploads up to 10MB)
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure uploads directory exists and is statically served
const uploadsPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
const activitiesUploadsPath = path.join(uploadsPath, 'activities');
if (!fs.existsSync(activitiesUploadsPath)) {
  fs.mkdirSync(activitiesUploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`);
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/mentor', mentorRoutes);

// Healthcheck / Status endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: 'AI-Driven Mentor-Mentee System Backend Operational (40% MVP)',
    timestamp: new Date().toISOString()
  });
});

// Serve frontend static files
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Fallback route for single-page style navigation
app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API Endpoint not found.' });
  }
  res.sendFile(path.join(frontendPath, 'login.html'));
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error('Unhandled Server Error:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server
app.listen(PORT, () => {
  logger.info(`===========================================================`);
  logger.info(`  Server running on http://localhost:${PORT}`);
  logger.info(`  Frontend URL:   http://localhost:${PORT}/login.html`);
  logger.info(`===========================================================`);
});
