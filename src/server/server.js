const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");

// load .env from project root
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

// serve frontend files
app.use(express.static(path.join(__dirname, "../client")));

// routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/config", require("./routes/config"));

// start server on specified port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});