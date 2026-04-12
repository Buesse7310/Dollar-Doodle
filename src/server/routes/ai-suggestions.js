console.log("AI route loaded");
const express = require("express");
const router = express.Router();
const db = require("../db-connection");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// GET AI suggestions
router.get("/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Get user expenses
    const [rows] = await db.execute(`
      SELECT 
        c.Category_Name,
        SUM(e.Expense_Amount) AS spent,
        COALESCE(b.Budget_Amount, 0) AS budget
      FROM Expenses e
      JOIN Categories c ON e.Category_ID = c.Category_ID
      LEFT JOIN Monthly_Budgets b 
        ON b.Category_ID = c.Category_ID 
        AND b.User_ID = e.User_ID
      WHERE e.User_ID = ?
      GROUP BY c.Category_Name, b.Budget_Amount
`, [userId]);

    if (rows.length === 0) {
      return res.json({ suggestions: "No expense data available yet." });
    }

    // Format for AI
    const summary = rows
      .map(r => `${r.Category_Name}: Spent  $${r.spent} / Budget $${r.budget}`)
      .join("\n");

    // Prompt
    const prompt = `
You are a financial advisor.

Here is a user's spending vs budget:
${summary}

Give:
- 3 insights (where they overspend or do well)
- 3 specific suggestions to improve savings
Be practical and clear.
`;

    // Call AI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }]
    });

    const suggestions = response.choices[0].message.content;

    res.json({ suggestions });

  }catch (err) {
  console.error("AI Suggestions Error:", err);
  res.status(500).json({ error: err.message });
}
});

module.exports = router;