const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db-connection");

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "testkey";

// --- Register user ---
router.post("/register", async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [existing] = await db.execute(
      "SELECT User_ID FROM Users WHERE User_email = ?",
      [email.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password.trim(), 10);

    const [result] = await db.execute(
      `INSERT INTO Users (User_email, User_Pswrd, User_FirstName, User_LastName, User_Auth_Type)
       VALUES (?, ?, ?, ?, 'email')`,
      [email.trim(), hashedPassword, firstName.trim(), lastName.trim()]
    );

    res.status(201).json({ message: "User registered successfully", userId: result.insertId });

  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// --- Login user ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  try {
    const [rows] = await db.execute(
      "SELECT User_ID, User_email, User_Pswrd FROM Users WHERE User_email = ?",
      [email.trim()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password.trim(), user.User_Pswrd);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    await db.execute(
      "UPDATE Users SET User_Last_login = CURRENT_TIMESTAMP WHERE User_ID = ?",
      [user.User_ID]
    );

    const token = jwt.sign(
      { id: user.User_ID, email: user.User_email },
      SECRET,
      { expiresIn: "1h" }
    );

    res.json({ token });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

module.exports = router;