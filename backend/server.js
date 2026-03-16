// backend/server.js
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const helmet = require('helmet');
const compression = require('compression');
const dotenv = require('dotenv');
const logger = require('./utils/logger');
const scheduler = require('./utils/scheduler');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import routes
const loginRoutes = require('./routes/login');
const registerRoutes = require('./routes/register');
const automationRoutes = require('./routes/automation');
const reportsRoutes = require('./routes/reports');
const platformsRoutes = require('./routes/platforms');
const githubRoutes = require('./routes/github');
const n8nRoutes = require('./routes/n8n');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(compression());
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? false : '*',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(express.static(path.join(__dirname, '../public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'autolive-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// API Routes
app.use('/api/login', loginRoutes);
app.use('/api/register', registerRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/platforms', platformsRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/n8n', n8nRoutes);

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/register.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/platforms', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/platforms.html'));
});

app.get('/automation', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/automation.html'));
});

app.get('/reports', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/reports.html'));
});

app.get('/github', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/github.html'));
});

app.get('/guide', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/guide.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error(`Error: ${err.message}`);
    res.status(500).json({ 
        success: false, 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    logger.info(`AUTOLIVE server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Initialize scheduler for automated tasks
    scheduler.init();
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error(`Uncaught Exception: ${error.message}`);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

module.exports = app;
