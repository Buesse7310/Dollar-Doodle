console.log("AI route loaded");

const express = require("express");
const router = express.Router();
const db = require("../db-connection");
const OpenAI = require("openai");
const auth = require("../middleware/auth");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// GET AI suggestions
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;

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
    const structuredData = rows.map(r => ({
      category: r.Category_Name,
      spent: Number(r.spent),
      budget: Number(r.budget)
    }));


    // Prompts
    const messages = [
      {
        role: "system",
        content: `
You are a personal finance assistant that analyzes spending and budgeting data.

Your job is to identify spending patterns and help users improve financial habits.

Return ONLY valid JSON. No extra text.

JSON format:
{
  "insights": [
    "string",
    "string",
    "string"
  ],
  "suggestions": [
    "string",
    "string",
    "string"
  ]
}

Rules:
- Return exactly 3 insights and 3 suggestions
- Focus on overspending, savings opportunities, and budget health
- Be concise and practical. Each string should be short and meaningful.
- Do not include greetings or unnecessary text
- Do not include markdown or text outside JSON
`
      },
      {
        role: "user",
        content: `
Analyze the following spending vs budget data per category.

For each category:
- Compare spent vs budget
- Identify overspending or good budgeting behavior

Data:
${JSON.stringify(structuredData)}

Return exactly:
- 3 insights about spending behavior
- 3 actionable suggestions to improve finances
`
      }
    ];

    // Call AI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages
    });

    let data;

    try {
      data = JSON.parse(response.choices[0].message.content);
    } catch (err) {
      console.error("Invalid JSON:", response.choices[0].message.content);

      return res.status(500).json({
        error: "AI did not return valid JSON"
      });
    }

    res.json({
      insights: data.insights,
      suggestions: data.suggestions
    });

  } catch (err) {
    console.error("AI Suggestions Error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;