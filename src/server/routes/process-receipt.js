const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const auth = require("../middleware/auth");

const upload = multer({ dest: "uploads/" });

const VERYFI_CLIENT_ID = process.env.VERYFI_CLIENT_ID;
//const VERYFI_CLIENT_SECRET = process.env.VERYFI_CLIENT_SECRET;
const VERYFI_USERNAME = process.env.VERYFI_USERNAME;
const VERYFI_API_KEY = process.env.VERYFI_API_KEY;

if (!VERYFI_CLIENT_ID || !VERYFI_USERNAME || !VERYFI_API_KEY) {
    console.warn("⚠️ Veryfi env variables missing. Receipt feature will not work.");
}

router.post("/", auth, upload.single("receipt"), async (req, res) => {
    console.log('📷 Receipt upload received');

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;

        console.log('📤 Sending to Veryfi...');

        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const response = await axios({
            method: 'post',
            url: 'https://api.veryfi.com/api/v8/partner/documents/',
            data: formData,
            headers: {
                ...formData.getHeaders(),
                'CLIENT-ID': VERYFI_CLIENT_ID,
                'AUTHORIZATION': `apikey ${VERYFI_USERNAME}:${VERYFI_API_KEY}`
            },
            timeout: 30000
        });

        console.log('✅ Veryfi response received');

        try {
            fs.unlinkSync(filePath);
        } catch (e) {
            console.log('Temp file cleanup error:', e.message);
        }

        res.json(response.data);

    } catch (error) {
        console.error('❌ Veryfi error:', error.response?.data || error.message);

        if (req.file && req.file.path) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (e) { }
        }

        res.status(500).json({
            error: 'Failed to process receipt',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router;