// backend/services/facebookService.js
const axios = require('axios');
const logger = require('../utils/logger');

class FacebookService {
    async testConnection(credentials) {
        try {
            const response = await axios.get(`https://graph.facebook.com/v18.0/me/accounts`, {
                params: {
                    access_token: credentials.pageToken
                }
            });

            return response.data && response.data.data ? true : false;
        } catch (error) {
            logger.error(`Facebook connection test failed: ${error.message}`);
            return false;
        }
    }

    async getPageStats(credentials) {
        try {
            const response = await axios.get(`https://graph.facebook.com/v18.0/me`, {
                params: {
                    access_token: credentials.pageToken,
                    fields: 'id,name,fan_count,new_like_count'
                }
            });

            return {
                name: response.data.name,
                followers: response.data.fan_count || 0,
                pageId: response.data.id
            };
        } catch (error) {
            logger.error(`Failed to get Facebook page stats: ${error.message}`);
            throw error;
        }
    }

    async uploadVideo(videoData, credentials) {
        try {
            const response = await axios.post(`https://graph.facebook.com/v18.0/me/videos`, {
                access_token: credentials.pageToken,
                file_url: videoData.videoUrl,
                description: videoData.description,
                title: videoData.title
            });

            return response.data;
        } catch (error) {
            logger.error(`Failed to upload to Facebook: ${error.message}`);
            throw error;
        }
    }

    async getVideoStats(videoId, credentials) {
        try {
            const response = await axios.get(`https://graph.facebook.com/v18.0/${videoId}`, {
                params: {
                    access_token: credentials.pageToken,
                    fields: 'id,title,description,views,likes,comments'
                }
            });

            return response.data;
        } catch (error) {
            logger.error(`Failed to get Facebook video stats: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new FacebookService();
