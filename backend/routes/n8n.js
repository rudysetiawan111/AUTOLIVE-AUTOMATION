// backend/routes/n8n.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');
const n8nIntegration = require('../integrations/n8nIntegration');

// Store n8n configurations (in production, use database)
let n8nConfigs = {};

// Configure n8n connection
router.post('/configure', [
    body('webhookUrl').isURL(),
    body('workflowId').optional()
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

        const { webhookUrl, workflowId, apiKey } = req.body;

        // Test the webhook connection
        try {
            await n8nIntegration.testConnection({ webhookUrl, apiKey });
        } catch (error) {
            return res.status(400).json({ 
                success: false, 
                message: 'Failed to connect to n8n webhook',
                error: error.message 
            });
        }

        // Save configuration
        n8nConfigs[req.session.userId] = {
            webhookUrl,
            workflowId: workflowId || 'default',
            apiKey: apiKey,
            configuredAt: new Date().toISOString()
        };

        logger.info(`n8n configured for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'n8n configuration saved successfully'
        });
    } catch (error) {
        logger.error(`n8n configure error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get n8n configuration
router.get('/config', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const config = n8nConfigs[req.session.userId];

        res.json({
            success: true,
            configured: !!config,
            config: config ? {
                webhookUrl: config.webhookUrl,
                workflowId: config.workflowId,
                configuredAt: config.configuredAt
            } : null
        });
    } catch (error) {
        logger.error(`n8n config fetch error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Trigger n8n workflow
router.post('/trigger', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const config = n8nConfigs[req.session.userId];

        if (!config) {
            return res.status(400).json({ 
                success: false, 
                message: 'n8n not configured' 
            });
        }

        const { workflowId, data } = req.body;

        // Trigger the workflow
        const result = await n8nIntegration.triggerWorkflow({
            webhookUrl: config.webhookUrl,
            workflowId: workflowId || config.workflowId,
            apiKey: config.apiKey,
            data: {
                ...data,
                userId: req.session.userId,
                timestamp: new Date().toISOString()
            }
        });

        logger.info(`n8n workflow triggered for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'Workflow triggered successfully',
            result: result
        });
    } catch (error) {
        logger.error(`n8n trigger error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to trigger workflow',
            error: error.message 
        });
    }
});

// Get workflow status
router.get('/workflow/:workflowId/status', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const config = n8nConfigs[req.session.userId];

        if (!config) {
            return res.status(400).json({ 
                success: false, 
                message: 'n8n not configured' 
            });
        }

        // In production, implement actual status checking
        // This is a placeholder
        const status = {
            workflowId: req.params.workflowId,
            status: 'active',
            lastRun: new Date().toISOString(),
            nextRun: new Date(Date.now() + 3600000).toISOString()
        };

        res.json({
            success: true,
            status: status
        });
    } catch (error) {
        logger.error(`n8n status error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to get workflow status' 
        });
    }
});

// Webhook receiver for n8n callbacks
router.post('/webhook', async (req, res) => {
    try {
        const { event, workflowId, data } = req.body;

        logger.info(`Received n8n webhook: ${event} for workflow ${workflowId}`);

        // Process different event types
        switch (event) {
            case 'workflow.start':
                logger.info(`Workflow ${workflowId} started`);
                break;
            case 'workflow.success':
                logger.info(`Workflow ${workflowId} completed successfully`);
                // Update reports or other services
                break;
            case 'workflow.error':
                logger.error(`Workflow ${workflowId} failed: ${data?.error}`);
                break;
            default:
                logger.info(`Unknown event type: ${event}`);
        }

        res.json({ 
            success: true, 
            message: 'Webhook received' 
        });
    } catch (error) {
        logger.error(`Webhook processing error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Webhook processing failed' 
        });
    }
});

// Disconnect n8n
router.post('/disconnect', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        delete n8nConfigs[req.session.userId];

        logger.info(`n8n disconnected for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'n8n disconnected successfully'
        });
    } catch (error) {
        logger.error(`n8n disconnect error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;
