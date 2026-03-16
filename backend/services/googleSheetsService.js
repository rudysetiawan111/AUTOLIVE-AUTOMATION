// backend/services/googleSheetsService.js
const { google } = require('googleapis');
const logger = require('../utils/logger');

class GoogleSheetsService {
    constructor() {
        this.initialized = false;
        this.sheets = null;
        this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    }

    async initialize() {
        try {
            const auth = new google.auth.GoogleAuth({
                credentials: {
                    client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
                    private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
                },
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const client = await auth.getClient();
            this.sheets = google.sheets({ version: 'v4', auth: client });
            this.initialized = true;
            logger.info('Google Sheets service initialized');
        } catch (error) {
            logger.error(`Failed to initialize Google Sheets: ${error.message}`);
            throw error;
        }
    }

    async ensureInitialized() {
        if (!this.initialized) {
            await this.initialize();
        }
    }

    async appendUserData(userData) {
        try {
            await this.ensureInitialized();

            const values = [[
                userData.userId,
                userData.fullName,
                userData.email,
                userData.phoneNumber || '',
                userData.preferredLanguage,
                userData.registeredAt,
                new Date().toISOString()
            ]];

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Users!A:G',
                valueInputOption: 'USER_ENTERED',
                resource: { values },
            });

            logger.info(`User data appended to sheet: ${response.data.updates.updatedRange}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to append user data: ${error.message}`);
            throw error;
        }
    }

    async appendReportData(reportData) {
        try {
            await this.ensureInitialized();

            const values = [[
                reportData.id,
                reportData.sourceVideoTitle,
                reportData.editedVideoTitle,
                reportData.platform,
                reportData.views || 0,
                reportData.likes || 0,
                reportData.comments || 0,
                reportData.subscriberGrowth || 0,
                reportData.date,
                new Date().toISOString()
            ]];

            const response = await this.sheets.spreadsheets.values.append({
                spreadsheetId: this.spreadsheetId,
                range: 'Reports!A:J',
                valueInputOption: 'USER_ENTERED',
                resource: { values },
            });

            logger.info(`Report data appended to sheet: ${response.data.updates.updatedRange}`);
            return response.data;
        } catch (error) {
            logger.error(`Failed to append report data: ${error.message}`);
            throw error;
        }
    }

    async getReportsData() {
        try {
            await this.ensureInitialized();

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Reports!A:J',
            });

            const rows = response.data.values || [];
            
            // Skip header row if exists
            const dataRows = rows.slice(1);
            
            return dataRows.map(row => ({
                id: row[0],
                sourceVideoTitle: row[1],
                editedVideoTitle: row[2],
                platform: row[3],
                views: parseInt(row[4]) || 0,
                likes: parseInt(row[5]) || 0,
                comments: parseInt(row[6]) || 0,
                subscriberGrowth: parseInt(row[7]) || 0,
                date: row[8]
            }));
        } catch (error) {
            logger.error(`Failed to get reports data: ${error.message}`);
            throw error;
        }
    }

    async getUsersData() {
        try {
            await this.ensureInitialized();

            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Users!A:G',
            });

            const rows = response.data.values || [];
            
            // Skip header row if exists
            const dataRows = rows.slice(1);
            
            return dataRows.map(row => ({
                userId: row[0],
                fullName: row[1],
                email: row[2],
                phoneNumber: row[3],
                preferredLanguage: row[4],
                registeredAt: row[5]
            }));
        } catch (error) {
            logger.error(`Failed to get users data: ${error.message}`);
            throw error;
        }
    }

    async updateReportStats(reportId, stats) {
        try {
            await this.ensureInitialized();

            // Find the row with the matching report ID
            const response = await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: 'Reports!A:J',
            });

            const rows = response.data.values || [];
            let rowIndex = -1;

            for (let i = 1; i < rows.length; i++) {
                if (rows[i][0] === reportId) {
                    rowIndex = i + 1; // +1 because sheets are 1-indexed
                    break;
                }
            }

            if (rowIndex === -1) {
                throw new Error(`Report ${reportId} not found`);
            }

            // Update the stats columns (E, F, G, H)
            const updateResponse = await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: `Reports!E${rowIndex}:H${rowIndex}`,
                valueInputOption: 'USER_ENTERED',
                resource: {
                    values: [[
                        stats.views || 0,
                        stats.likes || 0,
                        stats.comments || 0,
                        stats.subscriberGrowth || 0
                    ]]
                },
            });

            logger.info(`Report stats updated for ID ${reportId}`);
            return updateResponse.data;
        } catch (error) {
            logger.error(`Failed to update report stats: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new GoogleSheetsService();
