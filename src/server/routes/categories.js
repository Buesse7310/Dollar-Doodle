const express = require("express");
const router = express.Router();
const db = require("../db-connection");
const auth = require("../middleware/auth");

// GET all categories
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      "SELECT Category_ID, Category_Name FROM Categories ORDER BY Category_Name"
    );
    res.json(rows);
  } catch (err) {
    console.error("Fetch categories error:", err);
    res.status(500).json({ error: "Server error fetching categories" });
  }
});

module.exports = router;