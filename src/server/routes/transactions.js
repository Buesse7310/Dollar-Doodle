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
   GET all transactions by order */
   
router.get("/", auth, async (req, res) => {
    try {
        // Expenses - NOW WITH ORDER BY (latest first)
        const [expenses] = await db.execute(
            "SELECT e.Expense_ID AS id, e.Expense_Amount AS amount, e.Expense_Description AS description, e.Expense_date AS date, c.Category_Name AS category, 'expense' AS type " +
            "FROM Expenses e JOIN Categories c ON e.Category_ID = c.Category_ID " +
            "WHERE e.User_ID = ? " +
            "ORDER BY e.Expense_date DESC, e.Expense_ID DESC",
            [req.user.id]
        );

        // Incomes - ALSO with ORDER BY (latest first)
        const [incomes] = await db.execute(
            "SELECT i.Income_ID AS id, i.Income_Amount AS amount, i.Income_Source AS source, i.Income_Date AS date, i.Income_Repeating AS repeating, i.Income_Recurring_frequency AS frequency, 'income' AS type " +
            "FROM Incomes i WHERE i.User_ID = ? " +
            "ORDER BY i.Income_Date DESC, i.Income_ID DESC",
            [req.user.id]
        );

        // Merge and sort by date descending
        const transactions = [...expenses, ...incomes].sort((a, b) => new Date(b.date) - new Date(a.date));

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
   DELETE transaction by ID
   ---------------------- */
router.delete("/:type/:id", auth, async (req, res) => {
    const { type, id } = req.params;

    try {
        if (type === "expense") {
            const [result] = await db.execute(
                "DELETE FROM Expenses WHERE Expense_ID = ? AND User_ID = ?",
                [id, req.user.id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ error: "Expense not found" });
        } else if (type === "income") {
            const [result] = await db.execute(
                "DELETE FROM Incomes WHERE Income_ID = ? AND User_ID = ?",
                [id, req.user.id]
            );
            if (result.affectedRows === 0) return res.status(404).json({ error: "Income not found" });
        } else {
            return res.status(400).json({ error: "Invalid transaction type" });
        }

        res.json({ message: `${type} deleted` });
    } catch (err) {
        console.error("Delete transaction error:", err);
        res.status(500).json({ error: "Server error deleting transaction" });
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