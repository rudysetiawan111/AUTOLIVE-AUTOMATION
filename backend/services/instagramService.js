// backend/services/instagramService.js
const axios = require('axios');
const logger = require('../utils/logger');

class InstagramService {
    async testConnection(credentials) {
        try {
            const response = await axios.get(`https://graph.instagram.com/me`, {
                params: {
                    access_token: credentials.accessToken,
                    fields: 'id,username'
                }
            });

            return response.data && response.data.id ? true : false;
        } catch (error) {
            logger.error(`Instagram connection test failed: ${error.message}`);
            return false;
        }
    }

    async getAccountStats(credentials) {
        try {
            const response = await axios.get(`https://graph.instagram.com/me`, {
                params: {
                    access_token: credentials.accessToken,
                    fields: 'id,username,media_count,account_type'
                }
            });

            return {
                name: response.data.username,
                followers: 0, // Instagram Basic API doesn't provide followers count
                videos: response.data.media_count || 0,
                accountType: response.data.account_type
            };
        } catch (error) {
            logger.error(`Failed to get Instagram stats: ${error.message}`);
            throw error;
        }
    }

    async uploadVideo(videoData, credentials) {
        try {
            // First create media container
            const createResponse = await axios.post(`https://graph.instagram.com/me/media`, {
                access_token: credentials.accessToken,
                media_type: 'VIDEO',
                video_url: videoData.videoUrl,
                caption: videoData.caption
            });

            const containerId = createResponse.data.id;

            // Then publish the container
            const publishResponse = await axios.post(`https://graph.instagram.com/me/media_publish`, {
                access_token: credentials.accessToken,
                creation_id: containerId
            });

            return publishResponse.data;
        } catch (error) {
            logger.error(`Failed to upload to Instagram: ${error.message}`);
            throw error;
        }
    }

    async getVideoStats(mediaId, credentials) {
        try {
            const response = await axios.get(`https://graph.instagram.com/${mediaId}`, {
                params: {
                    access_token: credentials.accessToken,
                    fields: 'id,media_type,media_url,permalink,caption,like_count,comments_count'
                }
            });

            return response.data;
        } catch (error) {
            logger.error(`Failed to get Instagram video stats: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new InstagramService();
