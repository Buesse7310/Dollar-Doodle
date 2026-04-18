const express = require("express");
const router = express.Router();
const db = require("../db-connection");

router.post("/", async (req, res) => {
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

            // Simple matching logic based on receipt items
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

module.exports = router;