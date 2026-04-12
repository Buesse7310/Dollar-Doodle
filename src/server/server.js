const express = require("express");
const app = express();

app.use(express.json());

const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
require("dotenv").config({ path: path.resolve(__dirname, "../../.env.veryfi_api_key") });

// serve frontend files - FIXED PATH
app.use(express.static(path.join(__dirname, "../client")));

// routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/ai-suggestions", require("./routes/ai-suggestions"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/transactions", require("./routes/transactions"));
app.use("/api/db-lookup", require("./routes/db-lookup"));
app.use("/api/config", require("./routes/config"));
app.use("/api/process-receipt", require("./routes/process-receipt"));
app.use("/api/categorize-items", require("./routes/categorize-items"));
app.use("/api/feedback", require("./routes/feedback"));

// start server on specified port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});