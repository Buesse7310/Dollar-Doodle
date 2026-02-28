const express = require("express");
const app = express();
app.use(express.json());

app.post("/expenses", (req, res) => {
  console.log("Expense received:", req.body);
  res.json({ message: "Expense saved" });
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
