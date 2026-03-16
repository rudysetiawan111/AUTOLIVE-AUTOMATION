// backend/services/youtubeService.js
const axios = require('axios');
const logger = require('../utils/logger');

class YouTubeService {
    async testConnection(credentials) {
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    part: 'snippet,statistics',
                    id: credentials.channelId,
                    key: credentials.apiKey
                }
            });

            return response.data.items && response.data.items.length > 0;
        } catch (error) {
            logger.error(`YouTube connection test failed: ${error.message}`);
            return false;
        }
    }

    async getChannelStats(credentials) {
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
                params: {
                    part: 'snippet,statistics',
                    id: credentials.channelId,
                    key: credentials.apiKey
                }
            });

            if (response.data.items && response.data.items.length > 0) {
                const channel = response.data.items[0];
                return {
                    name: channel.snippet.title,
                    subscribers: parseInt(channel.statistics.subscriberCount) || 0,
                    videos: parseInt(channel.statistics.videoCount) || 0,
                    views: parseInt(channel.statistics.viewCount) || 0
                };
            }

            return { name: 'Not Found', subscribers: 0, videos: 0 };
        } catch (error) {
            logger.error(`Failed to get YouTube stats: ${error.message}`);
            throw error;
        }
    }

    async searchVideos(query, maxResults = 50) {
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
                params: {
                    part: 'snippet',
                    q: query,
                    type: 'video',
                    maxResults: maxResults,
                    order: 'viewCount',
                    key: process.env.YOUTUBE_API_KEY
                }
            });

            return response.data.items.map(item => ({
                id: item.id.videoId,
                title: item.snippet.title,
                description: item.snippet.description,
                thumbnail: item.snippet.thumbnails.high.url,
                publishedAt: item.snippet.publishedAt
            }));
        } catch (error) {
            logger.error(`Failed to search YouTube videos: ${error.message}`);
            throw error;
        }
    }

    async getVideoDetails(videoId) {
        try {
            const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
                params: {
                    part: 'snippet,statistics',
                    id: videoId,
                    key: process.env.YOUTUBE_API_KEY
                }
            });

            if (response.data.items && response.data.items.length > 0) {
                const video = response.data.items[0];
                return {
                    id: video.id,
                    title: video.snippet.title,
                    description: video.snippet.description,
                    viewCount: parseInt(video.statistics.viewCount) || 0,
                    likeCount: parseInt(video.statistics.likeCount) || 0,
                    commentCount: parseInt(video.statistics.commentCount) || 0,
                    publishedAt: video.snippet.publishedAt
                };
            }

            return null;
        } catch (error) {
            logger.error(`Failed to get video details: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new YouTubeService();
