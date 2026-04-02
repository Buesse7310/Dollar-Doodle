const express = require("express");
const router = express.Router();
const db = require("../db-connection");
const auth = require("../middleware/auth");

// --- Get all options for dropdowns ---
router.get("/", auth, async (req, res) => {
  try {
    // 1️⃣ Categories
    const [categoriesRows] = await db.execute(
      "SELECT Category_ID, Category_Name FROM Categories ORDER BY Category_Name"
    );

    // 2️⃣ Income Sources (from ENUM)
    const [incomeSourcesRows] = await db.execute(
      `SELECT COLUMN_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'Incomes' 
         AND COLUMN_NAME = 'Income_Source'
         AND TABLE_SCHEMA = DATABASE()`
    );
    const incomeSources = incomeSourcesRows[0].COLUMN_TYPE
      .substring(5, incomeSourcesRows[0].COLUMN_TYPE.length - 1)
      .split(",")
      .map(s => s.replace(/'/g, ""));

    // 3️⃣ Recurring Frequencies (from ENUM)
    const [freqRows] = await db.execute(
      `SELECT COLUMN_TYPE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_NAME = 'Incomes' 
         AND COLUMN_NAME = 'Income_Recurring_frequency'
         AND TABLE_SCHEMA = DATABASE()`
    );
    const recurringFrequencies = freqRows[0].COLUMN_TYPE
      .substring(5, freqRows[0].COLUMN_TYPE.length - 1)
      .split(",")
      .map(s => s.replace(/'/g, ""));

    res.json({
      categories: categoriesRows,
      incomeSources,
      recurringFrequencies
    });
  } catch (err) {
    console.error("Fetch options error:", err);
    res.status(500).json({ error: "Server error fetching options" });
  }
});

module.exports = router;