// backend/routes/login.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const googleSheetsService = require('../services/googleSheetsService');

// Mock user database (replace with actual database in production)
const users = [];

// Login route
router.post('/', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { email, password } = req.body;

        // In production, check against database
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }

        // Create session
        req.session.userId = user.id;
        req.session.userEmail = user.email;

        logger.info(`User logged in: ${email}`);

        res.json({
            success: true,
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            }
        });
    } catch (error) {
        logger.error(`Login error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during login' 
        });
    }
});

// Google Login route (simplified - implement OAuth2 in production)
router.post('/google', async (req, res) => {
    try {
        const { googleToken } = req.body;
        
        // Verify Google token and get user info
        // This is a placeholder - implement actual Google OAuth
        const userInfo = { email: 'user@gmail.com', name: 'Google User' };
        
        req.session.userId = 'google-user-id';
        req.session.userEmail = userInfo.email;
        
        res.json({
            success: true,
            message: 'Google login successful',
            user: userInfo
        });
    } catch (error) {
        logger.error(`Google login error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Google login failed' 
        });
    }
});

// Logout route
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Logout failed' 
            });
        }
        res.json({ success: true, message: 'Logout successful' });
    });
});

// Check session
router.get('/session', (req, res) => {
    if (req.session.userId) {
        res.json({
            success: true,
            authenticated: true,
            user: {
                id: req.session.userId,
                email: req.session.userEmail
            }
        });
    } else {
        res.json({
            success: true,
            authenticated: false
        });
    }
});

module.exports = router;
