const express = require('express');
const router = express.Router();
const { google } = require('googleapis');

router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    // To use this, you need a service_account.json from Google Cloud
    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: 'config/google_credentials.json',
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });
        await sheets.spreadsheets.values.append({
            spreadsheetId: process.env.GOOGLE_SHEETS_ID,
            range: 'Users!A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[name, email, password, new Date()]] },
        });

        res.json({ success: true });
    } catch (e) {
        res.status(500).send("Google Sheets Integration Error");
    }
});

module.exports = router;
