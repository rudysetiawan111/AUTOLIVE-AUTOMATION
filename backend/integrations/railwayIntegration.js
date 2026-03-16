// backend/integrations/railwayIntegration.js
const axios = require('axios');
const logger = require('../utils/logger');

class RailwayIntegration {
    constructor() {
        this.apiUrl = 'https://api.railway.app/v2';
        this.apiToken = process.env.RAILWAY_API_TOKEN;
    }

    async deploy(projectId, environment = 'production') {
        try {
            const response = await axios.post(`${this.apiUrl}/deployments`, {
                projectId: projectId,
                environment: environment
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                deploymentId: response.data.id,
                status: response.data.status
            };
        } catch (error) {
            logger.error(`Railway deployment failed: ${error.message}`);
            throw error;
        }
    }

    async getDeploymentStatus(deploymentId) {
        try {
            const response = await axios.get(`${this.apiUrl}/deployments/${deploymentId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            return {
                success: true,
                status: response.data.status,
                url: response.data.url
            };
        } catch (error) {
            logger.error(`Failed to get deployment status: ${error.message}`);
            throw error;
        }
    }

    async getEnvironmentVariables(projectId) {
        try {
            const response = await axios.get(`${this.apiUrl}/projects/${projectId}/variables`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`
                }
            });

            return response.data;
        } catch (error) {
            logger.error(`Failed to get environment variables: ${error.message}`);
            throw error;
        }
    }

    async setEnvironmentVariable(projectId, key, value) {
        try {
            const response = await axios.post(`${this.apiUrl}/projects/${projectId}/variables`, {
                key: key,
                value: value
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                variable: response.data
            };
        } catch (error) {
            logger.error(`Failed to set environment variable: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new RailwayIntegration();
