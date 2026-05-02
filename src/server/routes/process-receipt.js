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
           // Food & Dining
    'Groceries': 'Food & Dining',
    'Groceries & Food': 'Food & Dining',
    'Restaurants': 'Food & Dining',
    'Fast Food': 'Food & Dining',
    'Coffee Shop': 'Food & Dining',
    'Coffee': 'Food & Dining',
    'Bakery': 'Food & Dining',
    'Pizza': 'Food & Dining',
    'Pizza Hut': 'Food & Dining',
    'Subway': 'Food & Dining',
    'Sandwiches': 'Food & Dining',
    'Deli': 'Food & Dining',
    'Burger': 'Food & Dining',
    'Mexican': 'Food & Dining',
    'Chinese': 'Food & Dining',
    'Italian': 'Food & Dining',
    'Seafood': 'Food & Dining',
    'Steakhouse': 'Food & Dining',
    'Breakfast': 'Food & Dining',
    'Brunch': 'Food & Dining',
    'Lunch': 'Food & Dining',
    'Dinner': 'Food & Dining',
    'Takeout': 'Food & Dining',
    'Delivery': 'Food & Dining',
    'Food Truck': 'Food & Dining',
    'Cafe': 'Food & Dining',
    'Tea Shop': 'Food & Dining',
    'Juice Bar': 'Food & Dining',
    'Ice Cream': 'Food & Dining',
    'Donuts': 'Food & Dining',
    'Bagels': 'Food & Dining',
    'Pasta': 'Food & Dining',
    'Sushi': 'Food & Dining',
    'Wings': 'Food & Dining',
    'BBQ': 'Food & Dining',
    'Buffet': 'Food & Dining',
    'Pub Food': 'Food & Dining',
    'Bar Food': 'Food & Dining',
    
    // Shopping
    'Clothing': 'Shopping',
    'Apparel': 'Shopping',
    'Shoes': 'Shopping',
    'Electronics': 'Shopping',
    'Department Store': 'Shopping',
    'Walmart': 'Shopping',
    'Target': 'Shopping',
    'Costco': 'Shopping',
    'Sam\'s Club': 'Shopping',
    'BJ\'s': 'Shopping',
    'Amazon': 'Shopping',
    'eBay': 'Shopping',
    'Online Shopping': 'Shopping',
    'Jewelry': 'Shopping',
    'Accessories': 'Shopping',
    'Beauty Products': 'Shopping',
    'Cosmetics': 'Shopping',
    'Perfume': 'Shopping',
    'Luggage': 'Shopping',
    'Furniture': 'Shopping',
    'Home Decor': 'Shopping',
    'Bedding': 'Shopping',
    'Towels': 'Shopping',
    'Kitchenware': 'Shopping',
    'Tools': 'Shopping',
    'Hardware': 'Shopping',
    'Sporting Goods': 'Shopping',
    'Toys': 'Shopping',
    'Games': 'Shopping',
    'Books': 'Shopping',
    'Music': 'Shopping',
    'Movies': 'Shopping',
    'Office Supplies': 'Shopping',
    'Stationery': 'Shopping',
    
    // Transportation
    'Gas': 'Transportation',
    'Fuel': 'Transportation',
    'Gas Station': 'Transportation',
    'QuikTrip': 'Transportation',
    'Shell': 'Transportation',
    'BP': 'Transportation',
    'Exxon': 'Transportation',
    'Mobil': 'Transportation',
    'Chevron': 'Transportation',
    'Circle K': 'Transportation',
    '7-Eleven': 'Transportation',
    'Uber': 'Transportation',
    'Lyft': 'Transportation',
    'Taxi': 'Transportation',
    'Parking': 'Transportation',
    'Toll': 'Transportation',
    'Public Transit': 'Transportation',
    'Bus': 'Transportation',
    'Train': 'Transportation',
    'Subway': 'Transportation',
    'Airport': 'Transportation',
    'Car Rental': 'Transportation',
    'Auto Repair': 'Transportation',
    'Car Wash': 'Transportation',
    
    // Healthcare
    'Medical': 'Healthcare',
    'Pharmacy': 'Healthcare',
    'Walgreens': 'Healthcare',
    'CVS': 'Healthcare',
    'Rite Aid': 'Healthcare',
    'Doctor': 'Healthcare',
    'Dentist': 'Healthcare',
    'Hospital': 'Healthcare',
    'Clinic': 'Healthcare',
    'Urgent Care': 'Healthcare',
    'Lab': 'Healthcare',
    'X-Ray': 'Healthcare',
    'Physical Therapy': 'Healthcare',
    'Chiropractor': 'Healthcare',
    'Optometrist': 'Healthcare',
    'Eye Exam': 'Healthcare',
    'Glasses': 'Healthcare',
    'Contacts': 'Healthcare',
    'Prescription': 'Healthcare',
    'Vitamins': 'Healthcare',
    'Supplements': 'Healthcare',
    'Therapy': 'Healthcare',
    
    // Entertainment
    'Entertainment': 'Entertainment',
    'Movies': 'Entertainment',
    'Cinema': 'Entertainment',
    'Theater': 'Entertainment',
    'Concert': 'Entertainment',
    'Show': 'Entertainment',
    'Comedy Club': 'Entertainment',
    'Bowling': 'Entertainment',
    'Arcade': 'Entertainment',
    'Escape Room': 'Entertainment',
    'Museum': 'Entertainment',
    'Zoo': 'Entertainment',
    'Aquarium': 'Entertainment',
    'Amusement Park': 'Entertainment',
    'Water Park': 'Entertainment',
    'Sports Event': 'Entertainment',
    'Gaming': 'Entertainment',
    'Netflix': 'Entertainment',
    'Hulu': 'Entertainment',
    'Disney+': 'Entertainment',
    'Spotify': 'Entertainment',
    'Apple Music': 'Entertainment',
    'YouTube Premium': 'Entertainment',
    
    // Bills & Utilities
    'Utilities': 'Bills & Utilities',
    'Electric': 'Bills & Utilities',
    'Electricity': 'Bills & Utilities',
    'Water': 'Bills & Utilities',
    'Gas Bill': 'Bills & Utilities',
    'Internet': 'Bills & Utilities',
    'Cable': 'Bills & Utilities',
    'Phone': 'Bills & Utilities',
    'Mobile': 'Bills & Utilities',
    'Cell Phone': 'Bills & Utilities',
    'Trash': 'Bills & Utilities',
    'Sewer': 'Bills & Utilities',
    'Recycling': 'Bills & Utilities',
    
    // Housing
    'Rent': 'Housing',
    'Mortgage': 'Housing',
    'Home': 'Housing',
    'Apartment': 'Housing',
    'Condo': 'Housing',
    'House': 'Housing',
    'Property Tax': 'Housing',
    'HOA': 'Housing',
    'Home Insurance': 'Housing',
    'Repair': 'Housing',
    'Maintenance': 'Housing',
    'Plumbing': 'Housing',
    'Electrical': 'Housing',
    'HVAC': 'Housing',
    'Roofing': 'Housing',
    'Landscaping': 'Housing',
    'Cleaning': 'Housing',
    'Pest Control': 'Housing',
    
    // Travel
    'Travel': 'Travel',
    'Flight': 'Travel',
    'Airline': 'Travel',
    'Delta': 'Travel',
    'American Airlines': 'Travel',
    'United': 'Travel',
    'Southwest': 'Travel',
    'JetBlue': 'Travel',
    'Spirit': 'Travel',
    'Frontier': 'Travel',
    'Hotel': 'Travel',
    'Motel': 'Travel',
    'Resort': 'Travel',
    'Airbnb': 'Travel',
    'VRBO': 'Travel',
    'Cruise': 'Travel',
    'Vacation': 'Travel',
    'Trip': 'Travel',
    'Rental Car': 'Travel',
    'Luggage': 'Travel',
    'Passport': 'Travel',
    'Visa': 'Travel',
    
    // Education
    'Education': 'Education',
    'Tuition': 'Education',
    'School': 'Education',
    'College': 'Education',
    'University': 'Education',
    'Books': 'Education',
    'Textbooks': 'Education',
    'Supplies': 'Education',
    'Course': 'Education',
    'Online Course': 'Education',
    'Tutoring': 'Education',
    'Student Loan': 'Education',
    
    // Personal Care
    'Personal Care': 'Personal Care',
    'Haircut': 'Personal Care',
    'Salon': 'Personal Care',
    'Spa': 'Personal Care',
    'Massage': 'Personal Care',
    'Nail Salon': 'Personal Care',
    'Barber': 'Personal Care',
    'Gym': 'Personal Care',
    'Fitness': 'Personal Care',
    'Yoga': 'Personal Care',
    'Meditation': 'Personal Care',
    
    // Pets
    'Pets': 'Pets',
    'Pet Food': 'Pets',
    'Pet Store': 'Pets',
    'PetSmart': 'Pets',
    'Petco': 'Pets',
    'Veterinary': 'Pets',
    'Vet': 'Pets',
    'Grooming': 'Pets',
    'Boarding': 'Pets',
    'Daycare': 'Pets',
    'Dog Walking': 'Pets'
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