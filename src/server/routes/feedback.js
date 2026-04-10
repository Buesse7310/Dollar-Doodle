const express = require("express");
const router = express.Router();
const db = require("../db-connection");
const auth = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
    console.log("📝 Feedback endpoint called");

    try {
        const userId = req.user.id;

        const { type, message } = req.body;

        if (!type || !message) {
            return res.status(400).json({ error: "Type and message required" });
        }

        const [result] = await db.query(
            "INSERT INTO Users_Feedbackss (User_ID, Feedback_Type, Feedback_Message) VALUES (?, ?, ?)",
            [userId, type, message]
        );

        res.json({ success: true, id: result.insertId });

    } catch (error) {
        console.error("❌ Feedback error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;