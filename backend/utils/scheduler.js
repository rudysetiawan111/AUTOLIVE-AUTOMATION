// backend/utils/scheduler.js
const cron = require('node-cron');
const logger = require('./logger');

class Scheduler {
    constructor() {
        this.jobs = new Map();
        this.automationTasks = new Map();
    }

    init() {
        // Initialize daily cleanup job
        this.scheduleDailyCleanup();
        
        // Initialize health check job
        this.scheduleHealthCheck();
        
        logger.info('Scheduler initialized');
    }

    scheduleAutomation(config) {
        try {
            const { userId, videosPerDay, uploadTimes } = config;

            // Stop any existing automation for this user
            this.stopAutomation(userId);

            // Create scheduled jobs for each upload time
            uploadTimes.forEach((time, index) => {
                const [hour, minute] = time.split(':');
                
                // Create cron expression (run at specified time every day)
                const cronExpression = `${minute} ${hour} * * *`;

                const job = cron.schedule(cronExpression, async () => {
                    try {
                        logger.info(`Running automation for user ${userId} at ${time}`);
                        
                        // Trigger automation through n8n
                        const n8nIntegration = require('../integrations/n8nIntegration');
                        await n8nIntegration.triggerWorkflow({
                            userId: userId,
                            config: config
                        });
                        
                    } catch (error) {
                        logger.error(`Automation execution failed for user ${userId}: ${error.message}`);
                    }
                });

                // Store job reference
                const jobId = `${userId}-${index}`;
                this.jobs.set(jobId, job);
                
                logger.info(`Scheduled automation for user ${userId} at ${time}`);
            });

            // Calculate and set videos per day limit
            this.automationTasks.set(userId, {
                config: config,
                videosUploadedToday: 0,
                lastReset: new Date().toDateString()
            });

        } catch (error) {
            logger.error(`Failed to schedule automation: ${error.message}`);
            throw error;
        }
    }

    stopAutomation(userId) {
        try {
            // Find and stop all jobs for this user
            for (const [jobId, job] of this.jobs.entries()) {
                if (jobId.startsWith(userId)) {
                    job.stop();
                    this.jobs.delete(jobId);
                }
            }

            // Remove automation task
            this.automationTasks.delete(userId);

            logger.info(`Stopped automation for user ${userId}`);
        } catch (error) {
            logger.error(`Failed to stop automation: ${error.message}`);
        }
    }

    scheduleDailyCleanup() {
        // Run at midnight every day
        const job = cron.schedule('0 0 * * *', () => {
            try {
                logger.info('Running daily cleanup');
                
                // Reset daily video counts
                for (const [userId, task] of this.automationTasks.entries()) {
                    task.videosUploadedToday = 0;
                    task.lastReset = new Date().toDateString();
                }
                
                logger.info('Daily cleanup completed');
            } catch (error) {
                logger.error(`Daily cleanup failed: ${error.message}`);
            }
        });

        this.jobs.set('daily-cleanup', job);
    }

    scheduleHealthCheck() {
        // Run every hour
        const job = cron.schedule('0 * * * *', () => {
            try {
                logger.info('Running health check');
                
                // Check all active jobs
                let activeJobs = 0;
                for (const [jobId, job] of this.jobs.entries()) {
                    if (!jobId.includes('cleanup') && !jobId.includes('health')) {
                        activeJobs++;
                    }
                }
                
                logger.info(`Health check: ${activeJobs} active automation jobs`);
            } catch (error) {
                logger.error(`Health check failed: ${error.message}`);
            }
        });

        this.jobs.set('health-check', job);
    }

    getActiveAutomations() {
        const active = [];
        for (const [userId, task] of this.automationTasks.entries()) {
            active.push({
                userId: userId,
                videosPerDay: task.config.videosPerDay,
                videosUploadedToday: task.videosUploadedToday,
                lastReset: task.lastReset
            });
        }
        return active;
    }

    incrementVideoCount(userId) {
        const task = this.automationTasks.get(userId);
        if (task) {
            task.videosUploadedToday++;
            return task.videosUploadedToday;
        }
        return null;
    }

    canUploadVideo(userId) {
        const task = this.automationTasks.get(userId);
        if (!task) return false;
        
        // Check if we've hit the daily limit
        return task.videosUploadedToday < task.config.videosPerDay;
    }
}

module.exports = new Scheduler();
