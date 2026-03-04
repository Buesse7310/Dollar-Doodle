const express = require("express");
const path = require("path");

const authRoutes = require("./routes/auth");
const auth = require("./middleware/auth");

const expensesRouter = require("./routes/expenses");

const app = express();

app.use(express.json());

// serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

// auth api
app.use("/api/auth", authRoutes);

// test api
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is working" });
});

// dashboard api
app.get("/api/dashboard", auth, (req, res) => {
  res.json({
    message: "Welcome to your dashboard",
    user: req.user
  });
});

// expenses api
app.use("/api/expenses", expensesRouter);

// start server on specified port
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});