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

/* ----------------------
   GET all transactions
   ---------------------- */
router.get("/", auth, async (req, res) => {
    try {
        // Expenses - ordered by upload date (newest first)
        const [expenses] = await db.execute(
            "SELECT e.Expense_ID AS id, e.Expense_Amount AS amount, e.Expense_Description AS description, e.Expense_date AS date, e.Exp_Created_At AS upload_date, c.Category_Name AS category, 'expense' AS type " +
            "FROM Expenses e JOIN Categories c ON e.Category_ID = c.Category_ID " +
            "WHERE e.User_ID = ? " +
            "ORDER BY e.Exp_Created_At DESC, e.Expense_ID DESC",
            [req.user.id]
        );

        // Incomes - ordered by creation date (newest first)
        const [incomes] = await db.execute(
            "SELECT i.Income_ID AS id, i.Income_Amount AS amount, i.Income_Source AS source, i.Income_Date AS date, i.Income_Created_at AS upload_date, i.Income_Repeating AS repeating, i.Income_Recurring_frequency AS frequency, 'income' AS type " +
            "FROM Incomes i WHERE i.User_ID = ? " +
            "ORDER BY i.Income_Created_at DESC, i.Income_ID DESC",
            [req.user.id]
        );

        // Merge and sort by upload date descending (newest first)
        const transactions = [...expenses, ...incomes].sort((a, b) => new Date(b.upload_date) - new Date(a.upload_date));

        res.json(transactions);
    } catch (err) {
        console.error("Get transactions error:", err);
        res.status(500).json({ error: "Server error fetching transactions" });
    }
});

/* ----------------------
   ADD transaction
   ---------------------- */
router.post("/", auth, async (req, res) => {
    const { type, amount, date, description, categoryId, source, repeating, frequency } = req.body;

    if (!type || !amount || !date) {
        return res.status(400).json({ error: "Transaction type, amount, and date are required" });
    }

    try {
        if (type === "expense") {
            if (!categoryId) return res.status(400).json({ error: "Category is required for expenses" });
            const [result] = await db.execute(
                "INSERT INTO Expenses (User_ID, Expense_Amount, Category_ID, Expense_Description, Expense_date) VALUES (?, ?, ?, ?, ?)",
                [req.user.id, amount, categoryId, description || null, date]
            );
            res.status(201).json({ message: "Expense added", transactionId: result.insertId });
        } else if (type === "income") {
            if (!source) return res.status(400).json({ error: "Income source is required" });
            const [result] = await db.execute(
                "INSERT INTO Incomes (User_ID, Income_Amount, Income_Source, Income_Date, Income_Repeating, Income_Recurring_frequency) VALUES (?, ?, ?, ?, ?, ?)",
                [req.user.id, amount, source, date, repeating ? 1 : 0, repeating ? frequency : null]
            );
            res.status(201).json({ message: "Income added", transactionId: result.insertId });
        } else {
            return res.status(400).json({ error: "Invalid transaction type" });
        }
    } catch (err) {
        console.error("Add transaction error:", err);
        res.status(500).json({ error: "Server error adding transaction" });
    }
});

/* ----------------------
   DELETE expense by ID
   ---------------------- */
router.delete("/expense/:id", auth, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.execute(
            "DELETE FROM Expenses WHERE Expense_ID = ? AND User_ID = ?",
            [id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Expense not found" });
        
        res.json({ message: "Expense deleted" });
    } catch (err) {
        console.error("Delete expense error:", err);
        res.status(500).json({ error: "Server error deleting expense" });
    }
});

/* ----------------------
   DELETE income by ID
   ---------------------- */
router.delete("/income/:id", auth, async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await db.execute(
            "DELETE FROM Incomes WHERE Income_ID = ? AND User_ID = ?",
            [id, req.user.id]
        );
        if (result.affectedRows === 0) return res.status(404).json({ error: "Income not found" });
        
        res.json({ message: "Income deleted" });
    } catch (err) {
        console.error("Delete income error:", err);
        res.status(500).json({ error: "Server error deleting income" });
    }
});

/* ----------------------
   UPDATE expense
   ---------------------- */
router.put("/expense/:id", auth, async (req, res) => {
    const { id } = req.params;
    const { description, amount, date, categoryId } = req.body;
    
    if (!amount || !date || !categoryId) {
        return res.status(400).json({ error: "Amount, date, and category are required" });
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

/* ----------------------
   UPDATE income
   ---------------------- */
router.put("/income/:id", auth, async (req, res) => {
    const { id } = req.params;
    const { amount, source, date, repeating, frequency } = req.body;
    
    if (!amount || !date || !source) {
        return res.status(400).json({ error: "Amount, date, and source are required" });
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

/* ----------------------
   CLEAR ALL transactions
   ---------------------- */
router.delete("/", auth, async (req, res) => {
    try {
        await db.execute("DELETE FROM Expenses WHERE User_ID = ?", [req.user.id]);
        await db.execute("DELETE FROM Incomes WHERE User_ID = ?", [req.user.id]);
        res.json({ message: "All transactions cleared" });
    } catch (err) {
        console.error("Clear transactions error:", err);
        res.status(500).json({ error: "Server error clearing transactions" });
    }
});

module.exports = router;