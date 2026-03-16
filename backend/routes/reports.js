// backend/routes/reports.js
const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const googleSheetsService = require('../services/googleSheetsService');

// Mock data for reports (in production, fetch from database)
let reportsData = [
    {
        id: '1',
        sourceVideoTitle: 'Amazing Viral Video',
        editedVideoTitle: 'Viral Clip - Motivation',
        platform: 'youtube',
        views: 15000,
        likes: 1200,
        comments: 350,
        subscriberGrowth: 45,
        date: '2024-01-15'
    },
    {
        id: '2',
        sourceVideoTitle: 'Funny Cat Compilation',
        editedVideoTitle: 'Cat Funny Moments',
        platform: 'tiktok',
        views: 50000,
        likes: 8000,
        comments: 1200,
        subscriberGrowth: 200,
        date: '2024-01-16'
    }
];

// Get all reports
router.get('/', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        // Fetch from Google Sheets
        let sheetData = [];
        try {
            sheetData = await googleSheetsService.getReportsData();
        } catch (sheetError) {
            logger.error(`Failed to fetch from Google Sheets: ${sheetError.message}`);
            // Use mock data if Google Sheets fails
        }

        const data = sheetData.length > 0 ? sheetData : reportsData;

        // Calculate summary statistics
        const summary = {
            totalVideos: data.length,
            totalViews: data.reduce((sum, item) => sum + (item.views || 0), 0),
            totalLikes: data.reduce((sum, item) => sum + (item.likes || 0), 0),
            totalComments: data.reduce((sum, item) => sum + (item.comments || 0), 0),
            totalGrowth: data.reduce((sum, item) => sum + (item.subscriberGrowth || 0), 0),
            platformBreakdown: {}
        };

        // Platform breakdown
        data.forEach(item => {
            if (!summary.platformBreakdown[item.platform]) {
                summary.platformBreakdown[item.platform] = {
                    count: 0,
                    views: 0,
                    likes: 0
                };
            }
            summary.platformBreakdown[item.platform].count++;
            summary.platformBreakdown[item.platform].views += item.views || 0;
            summary.platformBreakdown[item.platform].likes += item.likes || 0;
        });

        res.json({
            success: true,
            summary: summary,
            reports: data
        });
    } catch (error) {
        logger.error(`Reports fetch error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get report by ID
router.get('/:id', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const report = reportsData.find(r => r.id === req.params.id);
        
        if (!report) {
            return res.status(404).json({ 
                success: false, 
                message: 'Report not found' 
            });
        }

        res.json({
            success: true,
            report: report
        });
    } catch (error) {
        logger.error(`Report fetch error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get reports by platform
router.get('/platform/:platform', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const platform = req.params.platform;
        const filteredReports = reportsData.filter(r => r.platform === platform);

        res.json({
            success: true,
            platform: platform,
            reports: filteredReports
        });
    } catch (error) {
        logger.error(`Platform reports error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Add new report (for webhook callbacks)
router.post('/add', async (req, res) => {
    try {
        const { sourceVideoTitle, editedVideoTitle, platform, views, likes, comments, subscriberGrowth } = req.body;

        const newReport = {
            id: Date.now().toString(),
            sourceVideoTitle,
            editedVideoTitle,
            platform,
            views: views || 0,
            likes: likes || 0,
            comments: comments || 0,
            subscriberGrowth: subscriberGrowth || 0,
            date: new Date().toISOString().split('T')[0]
        };

        reportsData.push(newReport);

        // Save to Google Sheets
        try {
            await googleSheetsService.appendReportData(newReport);
        } catch (sheetError) {
            logger.error(`Failed to save report to Google Sheets: ${sheetError.message}`);
        }

        logger.info(`New report added for platform: ${platform}`);

        res.status(201).json({
            success: true,
            message: 'Report added successfully',
            report: newReport
        });
    } catch (error) {
        logger.error(`Add report error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

module.exports = router;
