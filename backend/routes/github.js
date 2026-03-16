// backend/routes/github.js
const express = require('express');
const router = express.Router();
const { Octokit } = require('@octokit/rest');
const logger = require('../utils/logger');
const githubIntegration = require('../integrations/githubIntegration');

// Store GitHub connections (in production, use database)
let githubConnections = {};

// Connect to GitHub
router.post('/connect', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const { token, repoOwner, repoName } = req.body;

        if (!token || !repoOwner || !repoName) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        // Initialize Octokit with token
        const octokit = new Octokit({ auth: token });

        // Test connection
        try {
            const { data } = await octokit.repos.get({
                owner: repoOwner,
                repo: repoName
            });

            // Store connection
            githubConnections[req.session.userId] = {
                token,
                repoOwner,
                repoName,
                repoFullName: data.full_name,
                connectedAt: new Date().toISOString()
            };

            logger.info(`GitHub connected for user ${req.session.userId}: ${data.full_name}`);

            res.json({
                success: true,
                message: 'GitHub connected successfully',
                repository: {
                    name: data.name,
                    fullName: data.full_name,
                    private: data.private,
                    defaultBranch: data.default_branch
                }
            });
        } catch (error) {
            logger.error(`GitHub connection test failed: ${error.message}`);
            res.status(400).json({ 
                success: false, 
                message: 'Failed to access repository. Check token and repository details.' 
            });
        }
    } catch (error) {
        logger.error(`GitHub connect error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Get connection status
router.get('/status', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const connection = githubConnections[req.session.userId];

        if (!connection) {
            return res.json({
                success: true,
                connected: false
            });
        }

        // Get latest commit info
        let lastCommit = null;
        try {
            const octokit = new Octokit({ auth: connection.token });
            const { data } = await octokit.repos.listCommits({
                owner: connection.repoOwner,
                repo: connection.repoName,
                per_page: 1
            });

            if (data.length > 0) {
                lastCommit = {
                    sha: data[0].sha.substring(0, 7),
                    message: data[0].commit.message,
                    date: data[0].commit.author.date,
                    author: data[0].commit.author.name
                };
            }
        } catch (error) {
            logger.error(`Failed to fetch last commit: ${error.message}`);
        }

        res.json({
            success: true,
            connected: true,
            repository: {
                name: connection.repoName,
                fullName: connection.repoFullName,
                owner: connection.repoOwner
            },
            lastCommit: lastCommit
        });
    } catch (error) {
        logger.error(`GitHub status error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
});

// Backup project files
router.post('/backup', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const connection = githubConnections[req.session.userId];

        if (!connection) {
            return res.status(400).json({ 
                success: false, 
                message: 'GitHub not connected' 
            });
        }

        const { files, commitMessage } = req.body;

        if (!files || !Array.isArray(files)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid files data' 
            });
        }

        // Perform backup
        const result = await githubIntegration.backupFiles(
            connection,
            files,
            commitMessage || 'Automated backup from AUTOLIVE'
        );

        logger.info(`Backup completed for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'Backup completed successfully',
            result: result
        });
    } catch (error) {
        logger.error(`Backup error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Backup failed',
            error: error.message 
        });
    }
});

// Create new file in repository
router.post('/create-file', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        const connection = githubConnections[req.session.userId];

        if (!connection) {
            return res.status(400).json({ 
                success: false, 
                message: 'GitHub not connected' 
            });
        }

        const { path, content, message } = req.body;

        if (!path || !content) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing path or content' 
            });
        }

        const octokit = new Octokit({ auth: connection.token });

        // Check if file exists
        let sha = null;
        try {
            const { data } = await octokit.repos.getContent({
                owner: connection.repoOwner,
                repo: connection.repoName,
                path: path
            });
            sha = data.sha;
        } catch (error) {
            // File doesn't exist, that's fine
        }

        // Create or update file
        const { data } = await octokit.repos.createOrUpdateFileContents({
            owner: connection.repoOwner,
            repo: connection.repoName,
            path: path,
            message: message || `Add ${path} via AUTOLIVE`,
            content: Buffer.from(content).toString('base64'),
            sha: sha
        });

        logger.info(`File ${path} created/updated for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'File created successfully',
            commit: {
                sha: data.commit.sha.substring(0, 7),
                url: data.commit.html_url
            }
        });
    } catch (error) {
        logger.error(`Create file error: ${error.message}`);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to create file',
            error: error.message 
        });
    }
});

// Disconnect GitHub
router.post('/disconnect', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Unauthorized' 
            });
        }

        delete githubConnections[req.session.userId];

        logger.info(`GitHub disconnected for user ${req.session.userId}`);

        res.json({
            success: true,
            message: 'GitHub disconnected successfully'
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
