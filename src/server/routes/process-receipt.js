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
        
        // Get categories from database
        const [categories] = await db.query('SELECT Category_ID, Category_Name FROM categories');
        const categoryMap = {};
        categories.forEach(cat => {
            categoryMap[cat.Category_Name.toLowerCase()] = cat.Category_ID;
        });
        
        // MAPPING from Veryfi categories to table categories
        const veryfiToYourCategory = {
            'Groceries': 'Food & Dining',
            'Restaurants': 'Food & Dining',
            'Fast Food': 'Food & Dining',
            'Coffee Shop': 'Food & Dining',
            'Coffee': 'Food & Dining',
            'Bakery': 'Food & Dining',
            'Clothing': 'Shopping',
            'Apparel': 'Shopping',
            'Shoes': 'Shopping',
            'Electronics': 'Shopping',
            'Department Store': 'Shopping',
            'Gas': 'Transportation',
            'Fuel': 'Transportation',
            'Gas Station': 'Transportation',
            'Uber': 'Transportation',
            'Lyft': 'Transportation',
            'Taxi': 'Transportation',
            'Parking': 'Transportation',
            'Medical': 'Healthcare',
            'Pharmacy': 'Healthcare',
            'Doctor': 'Healthcare',
            'Hospital': 'Healthcare',
            'Dentist': 'Healthcare',
            'Entertainment': 'Entertainment',
            'Movies': 'Entertainment',
            'Cinema': 'Entertainment',
            'Concert': 'Entertainment',
            'Utilities': 'Bills & Utilities',
            'Electric': 'Bills & Utilities',
            'Water': 'Bills & Utilities',
            'Internet': 'Bills & Utilities',
            'Phone': 'Bills & Utilities',
            'Rent': 'Housing',
            'Mortgage': 'Housing',
            'Travel': 'Travel',
            'Flight': 'Travel',
            'Hotel': 'Travel',
            'Education': 'Education',
            'Tuition': 'Education',
            'Books': 'Education',
            'Personal Care': 'Personal Care',
            'Haircut': 'Personal Care',
            'Salon': 'Personal Care',
            'Spa': 'Personal Care',
            'Pets': 'Pets',
            'Pet Food': 'Pets',
            'Veterinary': 'Pets',
            'Home Improvement': 'Housing',
            'Hardware': 'Shopping'
        };
        
        // Keyword mapping for items without Veryfi category
        const keywordToCategory = {
            'Food & Dining': ['avocado', 'potato', 'tofu', 'olive', 'cheese', 'milk', 'bread', 'egg', 'meat', 'chicken', 'beef', 'pork', 'fish', 'fruit', 'vegetable', 'salad', 'soup', 'pizza', 'burger', 'pasta', 'rice', 'bean', 'corn', 'tomato', 'onion', 'garlic', 'carrot', 'lettuce', 'spinach', 'broccoli', 'apple', 'banana', 'orange', 'grape', 'berry', 'yogurt', 'butter', 'cream', 'sauce', 'oil', 'snack', 'chip', 'candy', 'chocolate', 'cookie', 'cake', 'bread'],
            'Shopping': ['shirt', 'pant', 'shoe', 'sock', 'dress', 'jacket', 'hat', 'belt', 'bag', 'wallet', 'watch', 'jewelry', 'toy', 'game', 'book', 'pen', 'paper', 'tape', 'glue', 'battery', 'light', 'lamp'],
            'Healthcare': ['medicine', 'pill', 'vitamin', 'bandage', 'cream', 'lotion', 'soap', 'shampoo', 'toothpaste', 'brush', 'mask', 'glove', 'earplug'],
            'Transportation': ['gas', 'fuel', 'tire', 'oil change', 'repair', 'parking', 'toll'],
            'Bills & Utilities': ['electric', 'water', 'gas bill', 'internet', 'phone', 'utility'],
            'Housing': ['rent', 'mortgage', 'furniture', 'table', 'chair', 'bed', 'sofa', 'desk', 'lamp', 'rug', 'curtain'],
            'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'concert', 'ticket', 'show'],
            'Travel': ['hotel', 'flight', 'airline', 'vacation', 'trip', 'luggage'],
            'Education': ['book', 'tuition', 'course', 'school', 'college', 'class', 'notebook'],
            'Personal Care': ['haircut', 'salon', 'spa', 'massage', 'nail', 'barber', 'cosmetic', 'makeup'],
            'Pets': ['dog', 'cat', 'pet', 'food pet', 'toy pet', 'leash', 'collar', 'bed pet']
        };
        
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
            const itemDescription = (item.description || '').toLowerCase();
            
            // Try to get category from Veryfi first
            let veryfiCategoryName = item.category || '';
            let yourCategoryName = '';
            
            // If Veryfi has a category, try to map it
            if (veryfiCategoryName && veryfiToYourCategory[veryfiCategoryName]) {
                yourCategoryName = veryfiToYourCategory[veryfiCategoryName];
                console.log(`📌 Veryfi category found: "${veryfiCategoryName}" → mapped to "${yourCategoryName}"`);
            } else {
                // No Veryfi category, try keyword matching
                for (const [category, keywords] of Object.entries(keywordToCategory)) {
                    for (const keyword of keywords) {
                        if (itemDescription.includes(keyword)) {
                            yourCategoryName = category;
                            console.log(`🔍 Keyword match: "${item.description}" contains "${keyword}" → "${category}"`);
                            break;
                        }
                    }
                    if (yourCategoryName) break;
                }
            }
            
            // If still no category, use 'Other'
            if (!yourCategoryName) {
                yourCategoryName = 'Other';
                console.log(`❌ No match for "${item.description}" → Using "Other"`);
            }
            
            // Get category ID from the database
            let categoryId = categoryMap[yourCategoryName.toLowerCase()];
            let categoryName = yourCategoryName;
            
            // If category not found in database, use 'Other'
            if (!categoryId) {
                categoryId = categoryMap['other'] || 12;
                categoryName = 'Other';
                console.log(`⚠️ Category "${yourCategoryName}" not found in DB. Using "Other"`);
            }
            
            console.log(`✅ Final: "${item.description}" → Category: "${categoryName}" (ID: ${categoryId})`);
            
            // Save to receipt_line_items
            await db.query(
                `INSERT INTO receipt_line_items 
                 (Receipt_ID, User_ID, description, quantity, unit_price, total_price, category_id, category_name, veryfi_category)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    receiptId, userId,
                    item.description || 'Unknown',
                    itemQuantity,
                    itemUnitPrice,
                    itemTotal,
                    categoryId,
                    categoryName,
                    item.category || null
                ]
            );
            
            // Save to expenses table
            await db.query(
                `INSERT INTO expenses (User_ID, Expense_Amount, Category_ID, Expense_Description, Expense_date, Receipt_ID, Receipt_Image_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId,
                    itemTotal,
                    categoryId,
                    item.description || 'Unknown',
                    receiptData.date ? new Date(receiptData.date) : new Date(),
                    receiptId,
                    imageUrl
                ]
            );
            
            savedItems++;
        }
        
        console.log(`✅ Saved ${savedItems} items`);
        
        // Clean up temp file
        try { fs.unlinkSync(filePath); } catch(e) {}
        
        res.json({ success: true, receiptId: receiptId, lineItemsCount: savedItems });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;