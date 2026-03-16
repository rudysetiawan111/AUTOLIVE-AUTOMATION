// backend/routes/automation.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const n8nIntegration = require('../integrations/n8nIntegration');
const scheduler = require('../utils/scheduler');

// Store automation configurations (in production, use database)
let automationConfigs = [];

// Save automation configuration
router.post('/configure', [
    body('category').isIn(['motivation', 'technology', 'sports', 'gaming', 'movies', 'music', 'lifestyle', 'business']),
    body('minViews').isInt({ min: 10000 }),
    body('uploadAge').isIn(['1h', '6h', '24h', '7d']),
    body('clipDuration').isIn([15, 30, 60]),
    body('subtitleType').isIn(['single', 'dual']),
    body('platforms').isArray(),
    body('videosPerDay').isInt({ min: 1, max: 50 }),
    body('uploadTimes').isArray()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                errors: errors.array() 
            });
        }

        // Check if user is authenticated
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const config = {
            id: Date.now().toString(),
            userId: req.session.userId,
            ...req.body,
            createdAt: new Date().toISOString(),
            status: 'active'
        };

        // Save configuration
        automationConfigs.push(config);

        // Schedule automation based on configuration
        if (config.scheduling && config.scheduling.enabled) {
            scheduler.scheduleAutomation(config);
        }

        logger.info(`Automation configured for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'Automation configuration saved',
            config: config
        });
    } catch (error) {
        logger.error(`Automation config error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Start automation
router.post('/start', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        // Get user's active configuration
        const userConfig = automationConfigs.find(
            c => c.userId === req.session.userId && c.status === 'active'
        );

        if (!userConfig) {
            return res.status(400).json({ 
                success: false, 
                message: 'No active automation configuration found' 
            });
        }

        // Trigger n8n webhook
        const webhookResponse = await n8nIntegration.triggerWorkflow({
            workflowId: userConfig.workflowId || process.env.N8N_AUTOMATION_WORKFLOW_ID,
            config: userConfig,
            userId: req.session.userId
        });

        logger.info(`Automation started for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'Automation started successfully',
            webhookResponse: webhookResponse
        });
    } catch (error) {
        logger.error(`Start automation error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to start automation',
            error: error.message 
        });
    }
});

// Stop automation
router.post('/stop', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        // Update configuration status
        const configIndex = automationConfigs.findIndex(
            c => c.userId === req.session.userId && c.status === 'active'
        );

        if (configIndex !== -1) {
            automationConfigs[configIndex].status = 'stopped';
        }

        // Remove from scheduler
        scheduler.stopAutomation(req.session.userId);

        logger.info(`Automation stopped for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'Automation stopped successfully'
        });
    } catch (error) {
        logger.error(`Stop automation error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to stop automation' 
        });
    }
});

// Get automation status
router.get('/status', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const userConfig = automationConfigs.find(
            c => c.userId === req.session.userId
        );

        res.json({
            success: true,
            status: userConfig ? userConfig.status : 'inactive',
            config: userConfig || null
        });
    } catch (error) {
        logger.error(`Status check error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get automation history
router.get('/history', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        // In production, fetch from database
        const history = [];

        res.json({
            success: true,
            history: history
        });
    } catch (error) {
        logger.error(`History fetch error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;
