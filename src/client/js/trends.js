// ------------------------
// GLOBAL STATE
// ------------------------
let allTransactions = [];
let currentRange = "month";

let lineChart;
let pieChart;
let categoryBarChart;
let incomeExpenseChart;

// ------------------------
// LOAD DATA
// ------------------------
async function loadData() {
  const token = localStorage.getItem("token");

  const res = await fetch("/api/transactions", {
    headers: {
      Authorization: "Bearer " + token
    }
  });

  const data = await res.json();

  allTransactions = Array.isArray(data)
    ? data
    : [...(data.expenses || []), ...(data.incomes || [])];

  updateCharts();
}

// ------------------------
// FILTER LOGIC
// ------------------------
function filterTransactions(range) {
  const now = new Date();

  return allTransactions.filter(t => {
    const d = new Date(t.date);

    if (range === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return d >= weekAgo;
    }

    if (range === "month") {
      return d.getMonth() === now.getMonth() &&
             d.getFullYear() === now.getFullYear();
    }

    if (range === "year") {
      return d.getFullYear() === now.getFullYear();
    }

    return true;
  });
}

// ------------------------
// UPDATE CHARTS
// ------------------------
function updateCharts() {
  const transactions = filterTransactions(currentRange);

  // -------- LINE CHART --------
  const grouped = {};

  transactions.forEach(t => {
    const date = new Date(t.date).toLocaleDateString("en-CA");
    const value = (t.type || "").toLowerCase() === "expense"
      ? -Number(t.amount)
      : Number(t.amount);

    grouped[date] = (grouped[date] || 0) + value;
  });

  const labels = Object.keys(grouped).sort();
  const values = labels.map(date => grouped[date]);

  if (lineChart) lineChart.destroy();

  const ctx1 = document.getElementById("lineChart").getContext("2d");

  lineChart = new Chart(ctx1, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Net Spending ($)",
        data: values,
        tension: 0.3
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Net Spending Over Time"
        },
        tooltip: {
          callbacks: {
            label: (context) => `$${context.raw.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Amount ($)"
          }
        },
        x: {
          title: {
            display: true,
            text: "Date"
          }
        }
      }
    }
  });

  // -------- CATEGORY TOTALS --------
  const categoryTotals = {};

  transactions.forEach(t => {
    if ((t.type || "").toLowerCase() === "expense") {
      const cat = t.category || t.Category_Name || "Other";
      categoryTotals[cat] =
        (categoryTotals[cat] || 0) + Number(t.amount);
    }
  });

  // -------- PIE CHART --------
  if (pieChart) pieChart.destroy();

  const ctx2 = document.getElementById("pieChart").getContext("2d");

  pieChart = new Chart(ctx2, {
    type: "pie",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals)
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Spending by Category"
        },
        tooltip: {
          callbacks: {
            label: (context) =>
              `${context.label}: $${context.raw.toLocaleString()}`
          }
        }
      }
    }
  });

  // -------- SORTED CATEGORY BAR CHART --------
  const sorted = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1]);

  const sortedLabels = sorted.map(item => item[0]);
  const sortedValues = sorted.map(item => item[1]);

  if (categoryBarChart) categoryBarChart.destroy();

  const ctx3 = document.getElementById("categoryBarChart").getContext("2d");

  categoryBarChart = new Chart(ctx3, {
    type: "bar",
    data: {
      labels: sortedLabels,
      datasets: [{
        label: "Spending ($)",
        data: sortedValues
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Spending by Category (Highest First)"
        },
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `$${context.raw.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount ($)"
          }
        },
        x: {
          title: {
            display: true,
            text: "Category"
          }
        }
      }
    }
  });

  // -------- INCOME VS EXPENSE CHART --------
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach(t => {
    const amount = Number(t.amount);
    const type = (t.type || "").toLowerCase();

    if (type === "income") {
      totalIncome += amount;
    } else if (type === "expense") {
      totalExpenses += amount;
    }
  });

  if (incomeExpenseChart) incomeExpenseChart.destroy();

  const ctx4 = document.getElementById("incomeExpenseChart").getContext("2d");

  incomeExpenseChart = new Chart(ctx4, {
    type: "bar",
    data: {
      labels: ["Income", "Expenses"],
      datasets: [{
        label: "Amount ($)",
        data: [totalIncome, totalExpenses]
      }]
    },
    options: {
      plugins: {
        title: {
          display: true,
          text: "Income vs Expenses"
        },
        tooltip: {
          callbacks: {
            label: (context) => `$${context.raw.toLocaleString()}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount ($)"
          }
        }
      }
    }
  });
}

// ------------------------
// FILTER BUTTON EVENTS
// ------------------------
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".filter-btn")
      .forEach(b => b.classList.remove("active"));

    btn.classList.add("active");

    currentRange = btn.dataset.range;
    updateCharts();
  });
});

// ------------------------
// INIT
// ------------------------
loadData();