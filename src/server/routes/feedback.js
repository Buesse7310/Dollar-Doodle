const express = require("express");
const router = express.Router();
const db = require("../db-connection");
const auth = require("../middleware/auth");

router.post("/", auth, async (req, res) => {
    console.log("📝 Feedback endpoint called");

    try {
        //  JWT payload contains { id: ... }
        const userId = req.user.id;

        if (!userId) {
            console.error("❌ No user ID found in decoded token");
            return res.status(400).json({ error: "User ID missing" });
        }

        const { feedback_type, feedback_message } = req.body;

        if (!feedback_type || !feedback_message) {
            return res.status(400).json({ error: "Type and message required" });
        }

        const [result] = await db.query(
            "INSERT INTO Users_Feedbackss (User_ID, Feedback_Type, Feedback_Message) VALUES (?, ?, ?)",
            [userId, feedback_type, feedback_message]
        );

        res.json({ success: true, id: result.insertId });

    } catch (error) {
        console.error("❌ Feedback error:", error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
