const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const FormData = require('form-data');
const axios = require('axios');
const fs = require('fs');
const db = require("../db-connection");

router.post("/", upload.single('receipt'), async (req, res) => {
    console.log('📷 Receipt upload received');
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        const filePath = req.file.path;
        
        const VERYFI_CLIENT_ID = process.env.VERYFI_CLIENT_ID;
        const VERYFI_USERNAME = process.env.VERYFI_USERNAME;
        const VERYFI_API_KEY = process.env.VERYFI_API_KEY;
        
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
        
        const receiptData = response.data;
        
        const token = req.headers.authorization?.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.id;
        
        // 1. Save to receipts table
        const imageUrl = `/uploads/receipts/${Date.now()}.jpg`;
        
        const [receiptResult] = await db.query(
            `INSERT INTO receipts (User_ID, Receipt_Image_URL, vendor_name, receipt_date, total_amount, veryfi_document_id, extracted_json, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, 'processed')`,
            [userId, imageUrl, receiptData.vendor?.name || 'Unknown', receiptData.date || new Date(), receiptData.total || 0, receiptData.id || null, JSON.stringify(receiptData)]
        );
        
        const receiptId = receiptResult.insertId;
        console.log('Receipt saved, ID:', receiptId);
        
        // 2. Save each line item to receipt_line_items and expenses
        const lineItems = receiptData.line_items || [];
        let savedItems = 0;
        
        for (const item of lineItems) {
            const itemTotal = item.total || item.price || 0;
            const itemQuantity = item.quantity || 1;
            const itemUnitPrice = item.price || (itemTotal / itemQuantity) || 0;
            
            // Save to receipt_line_items
            await db.query(
                `INSERT INTO receipt_line_items 
                 (Receipt_ID, User_ID, description, quantity, unit_price, total_price, category_name, veryfi_category)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    receiptId, userId,
                    item.description || 'Unknown',
                    itemQuantity,
                    itemUnitPrice,
                    itemTotal,
                    item.category || 'Uncategorized',
                    item.category || null
                ]
            );
            
            // Save to expenses (so it appears on dashboard)
            await db.query(
                `INSERT INTO expenses (User_ID, Expense_Amount, Category_ID, Expense_Description, Expense_date, Receipt_ID)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    itemTotal,
                    12,  // Default to category ID 12 (Other)
                    item.description || 'Unknown',
                    receiptData.date || new Date(),
                    receiptId
                ]
            );
            
            savedItems++;
        }
        
        console.log(`✅ Saved ${savedItems} items to receipt_line_items and expenses`);
        
        // Clean up temp file
        try { fs.unlinkSync(filePath); } catch(e) {}
        
        res.json({ success: true, receiptId: receiptId, lineItemsCount: savedItems });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;