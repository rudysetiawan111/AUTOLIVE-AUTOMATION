const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'frontend')));

// Routes
app.use('/api/auth', require('./routes/register'));
app.use('/api/automation', require('./routes/automation'));
app.use('/api/github', require('./routes/github'));
app.use('/api/n8n', require('./routes/n8n'));

// Serve HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend/login.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'frontend/dashboard.html')));
app.get('/automation', (req, res) => res.sendFile(path.join(__dirname, 'frontend/automation.html')));
app.get('/platforms', (req, res) => res.sendFile(path.join(__dirname, 'frontend/platforms.html')));
app.get('/reports', (req, res) => res.sendFile(path.join(__dirname, 'frontend/reports.html')));
app.get('/github', (req, res) => res.sendFile(path.join(__dirname, 'frontend/github.html')));
app.get('/guide', (req, res) => res.sendFile(path.join(__dirname, 'frontend/guide.html')));

app.listen(PORT, () => {
    console.log(`AUTOLIVE Server running on http://localhost:${PORT}`);
});
