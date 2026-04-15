const express = require("express");
const router = express.Router();
const db = require("../db-connection");
const auth = require("../middleware/auth");

// Disable caching for all routes
router.use((req, res, next) => {
    res.set({
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0"
    });
    next();
});

router.get("/", auth, async (req, res) => {
    try {
        const [rows] = await db.execute(
            "SELECT User_ID, User_email, User_FirstName, User_LastName FROM Users WHERE User_ID = ?",
            [req.user.id]
        );

        if (!rows.length) return res.status(404).json({ error: "User not found" });

        const user = rows[0];
        res.json({
            message: "Welcome to your dashboard",
            user: {
                id: user.User_ID,
                email: user.User_email,
                firstName: user.User_FirstName,
                lastName: user.User_LastName
            }
        });

    } catch (err) {
        console.error("Dashboard error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// ========== UPDATE EXPENSE ==========
router.put("/update/expense", auth, async (req, res) => {
    const { id, description, amount, date, categoryId } = req.body;
    
    if (!id || !amount || !date || !categoryId) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    try {
        const [result] = await db.execute(
            `UPDATE Expenses 
             SET Expense_Amount = ?, 
                 Expense_Description = ?, 
                 Expense_date = ?, 
                 Category_ID = ?,
                 Exp_Updated_At = CURRENT_TIMESTAMP
             WHERE Expense_ID = ? AND User_ID = ?`,
            [amount, description || null, date, categoryId, id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Expense not found" });
        }
        
        res.json({ success: true, message: "Expense updated successfully" });
        
    } catch (err) {
        console.error("Update expense error:", err);
        res.status(500).json({ error: "Server error updating expense" });
    }
});

// ========== UPDATE INCOME ==========
router.put("/update/income", auth, async (req, res) => {
    const { id, amount, source, date, repeating, frequency } = req.body;
    
    if (!id || !amount || !date || !source) {
        return res.status(400).json({ error: "All fields are required" });
    }
    
    try {
        const [result] = await db.execute(
            `UPDATE Incomes 
             SET Income_Amount = ?, 
                 Income_Source = ?, 
                 Income_Date = ?, 
                 Income_Repeating = ?,
                 Income_Recurring_frequency = ?
             WHERE Income_ID = ? AND User_ID = ?`,
            [amount, source, date, repeating ? 1 : 0, repeating ? frequency : null, id, req.user.id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Income not found" });
        }
        
        res.json({ success: true, message: "Income updated successfully" });
        
    } catch (err) {
        console.error("Update income error:", err);
        res.status(500).json({ error: "Server error updating income" });
    }
});

module.exports = router;