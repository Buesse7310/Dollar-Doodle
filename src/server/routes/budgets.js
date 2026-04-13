const express = require("express");
const router = express.Router();
const db = require("../db-connection");

router.post("/", async (req, res) => {
  const { userId, categoryId, amount } = req.body;

  try {
    await db.execute(`
      INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount)
      VALUES (?, ?, CURDATE(), ?)
      ON DUPLICATE KEY UPDATE Budget_Amount = ?
    `, [userId, categoryId, amount, amount]);

    res.json({ message: "Budget saved successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error saving budget" });
  }
});

module.exports = router;