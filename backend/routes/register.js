// backend/routes/register.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const googleSheetsService = require('../services/googleSheetsService');

// In-memory user store (replace with database)
const users = [];

// Registration route with Google Sheets integration
router.post('/', [
    body('fullName').notEmpty().trim().escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('confirmPassword').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Passwords do not match');
        }
        return true;
    }),
    body('phoneNumber').optional().isMobilePhone(),
    body('preferredLanguage').isIn(['en', 'id'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        const { fullName, email, password, phoneNumber, preferredLanguage } = req.body;

        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user object
        const newUser = {
            id: Date.now().toString(),
            fullName,
            email,
            password: hashedPassword,
            phoneNumber,
            preferredLanguage,
            createdAt: new Date().toISOString()
        };

        // Save to in-memory store
        users.push(newUser);

        // Save to Google Sheets
        try {
            await googleSheetsService.appendUserData({
                userId: newUser.id,
                fullName,
                email,
                phoneNumber,
                preferredLanguage,
                registeredAt: newUser.createdAt
            });
            logger.info(`User data saved to Google Sheets: ${email}`);
        } catch (sheetError) {
            logger.error(`Failed to save to Google Sheets: ${sheetError.message}`);
            // Don't fail registration if Google Sheets fails
            // Just log the error
        }

        logger.info(`New user registered: ${email}`);

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            user: {
                id: newUser.id,
                fullName,
                email,
                preferredLanguage
            }
        });
    } catch (error) {
        logger.error(`Registration error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error during registration' 
        });
    }
});

module.exports = router;
