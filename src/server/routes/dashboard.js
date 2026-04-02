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

module.exports = router;