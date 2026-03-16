// backend/services/tiktokService.js
const axios = require('axios');
const logger = require('../utils/logger');

class TikTokService {
    async testConnection(credentials) {
        try {
            // TikTok API endpoint for user info
            const response = await axios.get('https://open-api.tiktok.com/user/info/', {
                params: {
                    access_token: credentials.accessToken
                }
            });

            return response.data && response.data.data ? true : false;
        } catch (error) {
            logger.error(`TikTok connection test failed: ${error.message}`);
            return false;
        }
    }

    async getAccountStats(credentials) {
        try {
            const response = await axios.get('https://open-api.tiktok.com/user/info/', {
                params: {
                    access_token: credentials.accessToken
                }
            });

            if (response.data && response.data.data) {
                const user = response.data.data.user;
                return {
                    name: user.display_name,
                    followers: user.follower_count || 0,
                    videos: user.video_count || 0,
                    likes: user.like_count || 0
                };
            }

            return { name: 'Not Connected', followers: 0, videos: 0 };
        } catch (error) {
            logger.error(`Failed to get TikTok stats: ${error.message}`);
            throw error;
        }
    }

    async uploadVideo(videoData, credentials) {
        try {
            // TikTok video upload endpoint
            const response = await axios.post('https://open-api.tiktok.com/video/upload/', {
                access_token: credentials.accessToken,
                video: videoData.video,
                title: videoData.title,
                hashtags: videoData.hashtags
            });

            return response.data;
        } catch (error) {
            logger.error(`Failed to upload to TikTok: ${error.message}`);
            throw error;
        }
    }

    async getVideoStats(videoId, credentials) {
        try {
            const response = await axios.get('https://open-api.tiktok.com/video/data/', {
                params: {
                    access_token: credentials.accessToken,
                    video_id: videoId
                }
            });

            return response.data;
        } catch (error) {
            logger.error(`Failed to get TikTok video stats: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new TikTokService();
