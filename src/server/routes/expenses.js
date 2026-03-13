const express = require("express");
const router = express.Router();
const db = require("../db-connection");
const auth = require("../middleware/auth"); // your JWT auth middleware

// --- Get all expenses for logged-in user ---
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT e.Expense_ID, e.Expense_Amount, e.Expense_Description, e.Expense_date, c.Category_Name " +
      "FROM Expenses e JOIN Categories c ON e.Category_ID = c.Category_ID " +
      "WHERE e.User_ID = ? ORDER BY e.Expense_date DESC",
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error("Get expenses error:", err);
    res.status(500).json({ error: "Server error fetching expenses" });
  }
});

// --- Add new expense ---
router.post("/", auth, async (req, res) => {
  const { amount, categoryId, description, date } = req.body;

  if (!amount || !categoryId || !date) {
    return res.status(400).json({ error: "Amount, category, and date are required" });
  }

  try {
    const [result] = await db.execute(
      "INSERT INTO Expenses (User_ID, Expense_Amount, Category_ID, Expense_Description, Expense_date) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, amount, categoryId, description || null, date]
    );

    res.status(201).json({ message: "Expense added", expenseId: result.insertId });
  } catch (err) {
    console.error("Add expense error:", err);
    res.status(500).json({ error: "Server error adding expense" });
  }
});

// --- Delete an expense by ID ---
router.delete("/:id", auth, async (req, res) => {
  const expenseId = req.params.id;

  try {
    const [result] = await db.execute(
      "DELETE FROM Expenses WHERE Expense_ID = ? AND User_ID = ?",
      [expenseId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Expense not found" });
    }

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({ error: "Server error deleting expense" });
  }
});

// --- Clear all expenses for logged-in user ---
router.delete("/", auth, async (req, res) => {
  try {
    const [result] = await db.execute(
      "DELETE FROM Expenses WHERE User_ID = ?",
      [req.user.id]
    );

    console.log(`All expenses cleared for ${req.user.email} (${result.affectedRows})`);
    res.json({ message: "All expenses cleared" });
  } catch (err) {
    console.error("Clear expenses error:", err);
    res.status(500).json({ error: "Server error clearing expenses" });
  }
});

module.exports = router;