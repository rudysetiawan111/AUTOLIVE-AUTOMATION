// backend/routes/platforms.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const youtubeService = require('../services/youtubeService');
const tiktokService = require('../services/tiktokService');
const instagramService = require('../services/instagramService');
const facebookService = require('../services/facebookService');

// Store platform credentials (in production, use encrypted database)
let platformCredentials = {};

// Save platform credentials
router.post('/save', [
    body('youtubeApiKey').optional(),
    body('youtubeChannelId').optional(),
    body('tiktokAccessToken').optional(),
    body('instagramAccessToken').optional(),
    body('facebookPageToken').optional()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        // Save credentials (in production, encrypt before saving)
        platformCredentials[req.session.userId] = {
            youtube: {
                apiKey: req.body.youtubeApiKey,
                channelId: req.body.youtubeChannelId
            },
            tiktok: {
                accessToken: req.body.tiktokAccessToken
            },
            instagram: {
                accessToken: req.body.instagramAccessToken
            },
            facebook: {
                pageToken: req.body.facebookPageToken
            },
            updatedAt: new Date().toISOString()
        };

        logger.info(`Platform credentials saved for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'Platform credentials saved successfully'
        });
    } catch (error) {
        logger.error(`Save platforms error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get platform credentials
router.get('/credentials', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const credentials = platformCredentials[req.session.userId] || {};

        // Don't send actual tokens back to client
        const safeCredentials = {
            youtube: {
                hasApiKey: !!credentials.youtube?.apiKey,
                hasChannelId: !!credentials.youtube?.channelId,
                channelId: credentials.youtube?.channelId // Channel ID is safe to send
            },
            tiktok: {
                connected: !!credentials.tiktok?.accessToken
            },
            instagram: {
                connected: !!credentials.instagram?.accessToken
            },
            facebook: {
                connected: !!credentials.facebook?.pageToken
            }
        };

        res.json({
            success: true,
            credentials: safeCredentials
        });
    } catch (error) {
        logger.error(`Get credentials error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Test YouTube connection
router.post('/test/youtube', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const credentials = platformCredentials[req.session.userId];
        
        if (!credentials?.youtube?.apiKey) {
            return res.status(400).json({ 
                success: false, 
                message: 'YouTube API key not configured' 
            });
        }

        const isValid = await youtubeService.testConnection(credentials.youtube);

        res.json({
            success: isValid,
            message: isValid ? 'YouTube connection successful' : 'YouTube connection failed'
        });
    } catch (error) {
        logger.error(`Test YouTube error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Connection test failed' 
        });
    }
});

// Test TikTok connection
router.post('/test/tiktok', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const credentials = platformCredentials[req.session.userId];
        
        if (!credentials?.tiktok?.accessToken) {
            return res.status(400).json({ 
                success: false, 
                message: 'TikTok access token not configured' 
            });
        }

        const isValid = await tiktokService.testConnection(credentials.tiktok);

        res.json({
            success: isValid,
            message: isValid ? 'TikTok connection successful' : 'TikTok connection failed'
        });
    } catch (error) {
        logger.error(`Test TikTok error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Connection test failed' 
        });
    }
});

// Get channel overview
router.get('/overview', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const credentials = platformCredentials[req.session.userId];
        const overview = {
            youtube: { name: 'Not Connected', subscribers: 0, videos: 0 },
            tiktok: { name: 'Not Connected', followers: 0, videos: 0 }
        };

        // Fetch YouTube stats if connected
        if (credentials?.youtube?.apiKey && credentials?.youtube?.channelId) {
            try {
                const youtubeStats = await youtubeService.getChannelStats(credentials.youtube);
                overview.youtube = youtubeStats;
            } catch (error) {
                logger.error(`Failed to fetch YouTube stats: ${error.message}`);
            }
        }

        // Fetch TikTok stats if connected
        if (credentials?.tiktok?.accessToken) {
            try {
                const tiktokStats = await tiktokService.getAccountStats(credentials.tiktok);
                overview.tiktok = tiktokStats;
            } catch (error) {
                logger.error(`Failed to fetch TikTok stats: ${error.message}`);
            }
        }

        res.json({
            success: true,
            overview: overview
        });
    } catch (error) {
        logger.error(`Overview error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Delete platform connection
router.delete('/:platform', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const platform = req.params.platform;
        
        if (platformCredentials[req.session.userId]) {
            delete platformCredentials[req.session.userId][platform];
        }

        logger.info(`Platform ${platform} disconnected for user ${req.session.userId}`);

        res.json({
            success: true,
            message: `${platform} disconnected successfully`
        });
    } catch (error) {
        logger.error(`Disconnect error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;
