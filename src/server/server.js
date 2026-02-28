const express = require("express");
const path = require("path");

const app = express();

app.use(express.json());

// serve client html
app.use(express.static(path.join(__dirname, "../client")));

app.post("/expenses", (req, res) => {
  console.log("Expense received:", req.body);
  res.json({ message: "Expense saved" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
