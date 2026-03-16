// backend/integrations/n8nIntegration.js
const axios = require('axios');
const logger = require('../utils/logger');

class N8nIntegration {
    async testConnection(config) {
        try {
            const headers = {};
            if (config.apiKey) {
                headers['X-N8N-API-KEY'] = config.apiKey;
            }

            const response = await axios.get(`${config.webhookUrl}/healthz`, { headers });

            return response.status === 200;
        } catch (error) {
            logger.error(`n8n connection test failed: ${error.message}`);
            throw error;
        }
    }

    async triggerWorkflow(params) {
        try {
            const { webhookUrl, workflowId, apiKey, data } = params;

            const url = webhookUrl.includes('/webhook/') 
                ? webhookUrl 
                : `${webhookUrl}/webhook/${workflowId || 'trigger'}`;

            const headers = {
                'Content-Type': 'application/json'
            };

            if (apiKey) {
                headers['X-N8N-API-KEY'] = apiKey;
            }

            const response = await axios.post(url, data, { headers });

            return {
                success: true,
                status: response.status,
                data: response.data
            };
        } catch (error) {
            logger.error(`Failed to trigger n8n workflow: ${error.message}`);
            throw error;
        }
    }

    async getWorkflowStatus(webhookUrl, workflowId, apiKey) {
        try {
            const headers = {};
            if (apiKey) {
                headers['X-N8N-API-KEY'] = apiKey;
            }

            // This endpoint may vary based on n8n configuration
            const response = await axios.get(`${webhookUrl}/webhook/${workflowId}/status`, { headers });

            return response.data;
        } catch (error) {
            logger.error(`Failed to get workflow status: ${error.message}`);
            throw error;
        }
    }

    async createWorkflow(config) {
        try {
            const { apiUrl, apiKey, name, nodes, connections } = config;

            const response = await axios.post(`${apiUrl}/api/v1/workflows`, {
                name: name,
                nodes: nodes,
                connections: connections,
                settings: {
                    executionOrder: 'v1'
                }
            }, {
                headers: {
                    'X-N8N-API-KEY': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                workflowId: response.data.id,
                workflowUrl: `${apiUrl}/workflow/${response.data.id}`
            };
        } catch (error) {
            logger.error(`Failed to create n8n workflow: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new N8nIntegration();
