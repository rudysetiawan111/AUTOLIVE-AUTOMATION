// backend/config/env.js
const dotenv = require('dotenv');
const path = require('path');
const logger = require('../utils/logger');

class EnvironmentConfig {
    constructor() {
        this.loadEnvironment();
        this.validateEnvironment();
    }

    loadEnvironment() {
        const envPath = path.join(__dirname, '../../.env');
        const result = dotenv.config({ path: envPath });

        if (result.error) {
            logger.warn('Environment file not found, using system environment variables');
        } else {
            logger.info('Environment variables loaded successfully');
        }
    }

    validateEnvironment() {
        const requiredVars = [
            'PORT',
            'SESSION_SECRET'
        ];

        const missingVars = requiredVars.filter(varName => !process.env[varName]);

        if (missingVars.length > 0) {
            logger.warn(`Missing environment variables: ${missingVars.join(', ')}`);
            
            // Set defaults for development
            if (process.env.NODE_ENV !== 'production') {
                missingVars.forEach(varName => {
                    this.setDefault(varName);
                });
            }
        }
    }

    setDefault(varName) {
        const defaults = {
            'PORT': '3000',
            'SESSION_SECRET': 'autolive-dev-secret-key',
            'NODE_ENV': 'development'
        };

        if (defaults[varName]) {
            process.env[varName] = defaults[varName];
            logger.info(`Set default value for ${varName}: ${defaults[varName]}`);
        }
    }

    get(key, defaultValue = null) {
        return process.env[key] || defaultValue;
    }

    isProduction() {
        return process.env.NODE_ENV === 'production';
    }

    isDevelopment() {
        return !this.isProduction();
    }

    getApiKeys() {
        return {
            googleSheets: this.get('GOOGLE_SHEETS_API_KEY'),
            github: this.get('GITHUB_TOKEN'),
            youtube: this.get('YOUTUBE_API_KEY'),
            tiktok: this.get('TIKTOK_ACCESS_TOKEN'),
            instagram: this.get('INSTAGRAM_ACCESS_TOKEN'),
            facebook: this.get('FACEBOOK_PAGE_TOKEN')
        };
    }

    getWebhookUrls() {
        return {
            n8n: this.get('N8N_WEBHOOK_URL'),
            github: this.get('GITHUB_WEBHOOK_URL')
        };
    }
}

module.exports = new EnvironmentConfig();
