const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// in-memory storage (temporary, DB later)
const expenses = [];

// GET current expenses
router.get("/", auth, (req, res) => {
  // Only return expenses for this user
  const userExpenses = expenses.filter(e => e.userId === req.user.id);
  res.json(userExpenses);
});

// POST new expense
router.post("/", auth, (req, res) => {
  const { description, amount, category } = req.body;

  if (!description || !amount) {
    return res.status(400).json({ error: "Description and amount required" });
  }

  const expense = {
    id: Date.now().toString(), // simple unique ID
    description,
    amount,
    category: category || "Other",
    userId: req.user.id
  };

  expenses.push(expense);

  console.log(`Expense added for ${req.user.email}:`, expense);

  res.json(expense);
});

module.exports = router;