require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    GOOGLE_SHEETS_API_KEY: process.env.GOOGLE_SHEETS_API_KEY,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN,
    N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL
};
