const token = localStorage.getItem("token");

// Redirect to login if not logged in
if (!token) {
    window.location.href = "login.html";
}

const transactionsEl = document.getElementById("transactions");
const balanceEl = document.getElementById("balance");
const welcomeEl = document.getElementById("welcome");
const clearBtn = document.getElementById("clearBtn");

let expenses = [];

// Load user info & expenses
async function loadDashboard() {
    try {
        const res = await fetch("/api/dashboard", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            console.error("Dashboard fetch error:", data);
            alert(data.error || "Session expired. Please login again.");
            logout();
            return;
        }

        welcomeEl.textContent = `Welcome, ${data.user.email}!`;

        // Fetch expenses
        await loadExpenses();

    } catch (err) {
        console.error("Unexpected dashboard error:", err);
        alert("Unexpected server error. Check console for details.");
    }
}

// Load expenses
async function loadExpenses() {
    const res = await fetch("/api/expenses", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    expenses = await res.json();
    renderExpenses();
}

// Render expense list
function renderExpenses() {
    transactionsEl.innerHTML = "";

    let total = 0;

    expenses.forEach(e => {
        const li = document.createElement("li");
        li.textContent = `${e.description} - $${e.amount} [${e.category}]`;
        transactionsEl.appendChild(li);

        total += e.amount;
    });

    balanceEl.textContent = `Balance: $${total}`;

    clearBtn.style.display = expenses.length ? "block" : "none";
}

// Add expense
async function addExpense() {
    const description = document.getElementById("description").value;
    const amount = parseFloat(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    if (!description || !amount) {
        alert("Enter description and amount");
        return;
    }

    const res = await fetch("/api/expenses", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ description, amount, category })
    });

    const data = await res.json();
    expenses.push(data);
    renderExpenses();

    // Clear inputs
    document.getElementById("description").value = "";
    document.getElementById("amount").value = "";
}

// Clear all expenses
async function clearExpenses() {
    if (!confirm("Are you sure you want to clear all expenses?")) return;

    try {
        const res = await fetch("/api/expenses", {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();

        if (!res.ok) {
            alert(data.error || "Failed to clear expenses");
            return;
        }

        expenses = [];
        renderExpenses();
        alert("All expenses cleared!");
    } catch (err) {
        console.error("Error clearing expenses:", err);
        alert("Server error. Try again.");
    }
}

// Logout
function logout() {
    localStorage.removeItem("token");
    window.location.href = "login.html";
}

loadDashboard();