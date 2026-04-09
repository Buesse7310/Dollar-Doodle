const express = require("express");
const app = express();

app.use(express.json());

// Database connection
const db = require("./db-connection");

// Multer for file uploads
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const path = require("path");

// Load main .env file (two levels up)
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// Load Veryfi credentials (two levels up, correct filename)
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.veryfi_api_key") });

// serve frontend files
//app.use(express.static(path.join(__dirname, "../client")));

app.use(express.static(path.join(__dirname, "../../src/client")));

// routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/db-lookup", require("./routes/db-lookup"));
app.use("/api/config", require("./routes/config"));

// ========== VERYFI RECEIPT PROCESSING ENDPOINT ==========
app.post("/api/process-receipt", upload.single('receipt'), async (req, res) => {
    console.log('📷 Receipt upload received');
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const filePath = req.file.path;
        
        // Get Veryfi credentials from .env file
const VERYFI_CLIENT_ID = process.env.VERYFI_CLIENT_ID;
const VERYFI_CLIENT_SECRET = process.env.VERYFI_CLIENT_SECRET;
const VERYFI_USERNAME = process.env.VERYFI_USERNAME;
const VERYFI_API_KEY = process.env.VERYFI_API_KEY;
        
        console.log('📤 Sending to Veryfi...');
        
        const FormData = require('form-data');
        const axios = require('axios');
        const fs = require('fs');
        
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
        } catch(e) {
            console.log('Temp file cleanup error:', e.message);
        }
        
        res.json(response.data);
        
    } catch (error) {
        console.error('❌ Veryfi error:', error.response?.data || error.message);
        
        if (req.file && req.file.path) {
            try {
                const fs = require('fs');
                fs.unlinkSync(req.file.path);
            } catch(e) {}
        }
        
        res.status(500).json({ 
            error: 'Failed to process receipt',
            details: error.response?.data || error.message 
        });
    }
});

// ========== CATEGORIZE RECEIPT ITEMS ==========
app.post("/api/categorize-items", async (req, res) => {
    console.log('📊 Categorize endpoint called');
    
    try {
        const { lineItems } = req.body;
        
        if (!lineItems || lineItems.length === 0) {
            console.log('No line items provided');
            return res.json({ categorizedItems: [] });
        }
        
        console.log(`Processing ${lineItems.length} line items`);
        
        // Get all categories from database
        const [categories] = await db.query(
            'SELECT Category_ID, Category_Name FROM Categories'
        );
        
        console.log('Categories loaded:', categories.length);
        
        // Categorize each line item
        const categorizedItems = lineItems.map(item => {
            const description = (item.description || '').toLowerCase();
            let categoryId = null;
            let categoryName = 'Other';
            
            // Simple matching logic based on your receipt items
            if (description.includes('cola') || description.includes('chip') || description.includes('snack') || 
                description.includes('food') || description.includes('drink') || description.includes('soda')) {
                const cat = categories.find(c => c.Category_Name === 'Food & Dining');
                if (cat) {
                    categoryId = cat.Category_ID;
                    categoryName = cat.Category_Name;
                }
            }
            else if (description.includes('sock') || description.includes('clothing') || description.includes('shoe')) {
                const cat = categories.find(c => c.Category_Name === 'Shopping');
                if (cat) {
                    categoryId = cat.Category_ID;
                    categoryName = cat.Category_Name;
                }
            }
            else if (description.includes('earplug')) {
                const cat = categories.find(c => c.Category_Name === 'Healthcare');
                if (cat) {
                    categoryId = cat.Category_ID;
                    categoryName = cat.Category_Name;
                }
            }
            
            // If no category found, use Other
            if (!categoryId) {
                const otherCat = categories.find(c => c.Category_Name === 'Other');
                if (otherCat) {
                    categoryId = otherCat.Category_ID;
                    categoryName = otherCat.Category_Name;
                } else if (categories.length > 0) {
                    categoryId = categories[0].Category_ID;
                    categoryName = categories[0].Category_Name;
                }
            }
            
            return {
                description: item.description || 'Unknown',
                quantity: item.quantity || 1,
                unit_price: item.price || item.total || 0,
                total: item.total || item.price || 0,
                category_id: categoryId,
                category_name: categoryName
            };
        });
        
        console.log('✅ Categorization complete');
        res.json({ categorizedItems });
        
    } catch (error) {
        console.error('❌ Categorization error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Test database connection endpoint
app.get("/api/test-db", async (req, res) => {
    try {
        const [result] = await db.query("SELECT 1 as connected");
        res.json({ success: true, message: "Database connected!" });
    } catch (error) {
        console.error("DB Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test .env variables endpoint
app.get("/api/test-env", (req, res) => {
    res.json({
        db_host: process.env.DB_HOST,
        db_user: process.env.DB_USER,
        db_name: process.env.DB_NAME,
        has_password: !!process.env.DB_PASSWORD,
        port: process.env.PORT,
        veryfi_configured: !!process.env.VERYFI_CLIENT_ID
    });
});

// start server on specified port
const PORT = process.env.PORT || 5000;

/// ========== FEEDBACK ENDPOINT ==========
app.post("/api/feedback", async (req, res) => {
    console.log('Feedback endpoint called');
    
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No token provided' });
        }
        
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        const { type, message } = req.body;
        
        if (!type || !message) {
            return res.status(400).json({ error: 'Type and message required' });
        }
        
        // Make sure table name is correct: users_feedbackss (with two 's')
        const [result] = await db.query(
            'INSERT INTO users_feedbackss (User_ID, Feedback_Type, Feedback_Message) VALUES (?, ?, ?)',
            [userId, type, message]
        );
        
        console.log('Feedback saved, ID:', result.insertId);
        res.json({ success: true, id: result.insertId });
        
    } catch (error) {
        console.error('Feedback error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});