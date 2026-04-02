// Get JWT token from localStorage
const token = localStorage.getItem("token");

// Redirect to login if token missing
if (!token) {
    window.location.replace("login.html");
}

// DOM elements
const expensesList = document.getElementById("transactions");
const balanceDisplay = document.getElementById("balance");
const welcomeMessage = document.getElementById("welcome");
const clearExpensesButton = document.getElementById("clearBtn");
const categoryDropdown = document.getElementById("category");

// Modal elements
const addExpenseBtn = document.getElementById("add-expense-btn");
const addExpenseModal = document.getElementById("add-expense-modal");
const closeBtn = addExpenseModal.querySelector(".close-btn");
const addExpenseForm = document.getElementById("add-expense-form");

// State
let userExpenses = [];

// Helper: fetch with token automatically
async function authFetch(url, options = {}) {
    options.headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
    const res = await fetch(url, options);
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "API error");
    }
    return res.json();
}

// Load user info, categories, and expenses
async function loadDashboard() {
    try {
        const data = await authFetch("/api/dashboard");
        welcomeMessage.textContent = `Welcome, ${data.user.firstName || data.user.email}!`;

        await loadCategories();
        await loadExpenses();
    } catch (err) {
        console.error("Dashboard load error:", err);
        alert(err.message);
        logout();
    }
}

// Load categories from DB
async function loadCategories() {
    try {
        const categories = await authFetch("/api/categories");

        categoryDropdown.innerHTML = '<option value="">Select category</option>';
        categories.forEach(c => {
            const option = document.createElement("option");
            option.value = c.Category_ID;
            option.textContent = c.Category_Name;
            categoryDropdown.appendChild(option);
        });
    } catch (err) {
        console.error("Load categories error:", err);
        alert(err.message);
    }
}

// Load expenses
async function loadExpenses() {
    try {
        userExpenses = await authFetch("/api/expenses");
        renderExpenses();
    } catch (err) {
        console.error("Load expenses error:", err);
        alert(err.message);
    }
}

// Render expenses list
function renderExpenses() {
    expensesList.innerHTML = "";

    let total = 0;

    if (userExpenses.length === 0) {
        // Show placeholder when no expenses
        const placeholder = document.createElement("p");
        placeholder.textContent = "You have no expenses yet.";
        placeholder.style.textAlign = "center";
        placeholder.style.marginBottom = "1rem";
        expensesList.appendChild(placeholder);

        // Hide clear button
        clearExpensesButton.style.display = "none";
        return; // stop here since no expenses
    }

    userExpenses.forEach(e => {
        const li = document.createElement("li");
        li.classList.add("transaction-item");

        // Description left
        const descSpan = document.createElement("span");
        descSpan.classList.add("transaction-desc");
        descSpan.textContent = e.Expense_Description || "";

        // Category below description
        const categorySpan = document.createElement("span");
        categorySpan.classList.add("transaction-category");
        categorySpan.textContent = `[${e.Category_Name}]`;

        const leftDiv = document.createElement("div");
        leftDiv.appendChild(descSpan);
        leftDiv.appendChild(categorySpan);

        // Amount center
        const amountSpan = document.createElement("span");
        const amt = parseFloat(e.Expense_Amount).toFixed(2);
        amountSpan.textContent = `-$${amt}`;
        amountSpan.classList.add("expense-amount");

        // Delete button right
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.classList.add("delete-btn");
        delBtn.onclick = () => deleteExpense(e.Expense_ID);

        li.appendChild(leftDiv);
        li.appendChild(amountSpan);
        li.appendChild(delBtn);

        expensesList.appendChild(li);

        total -= parseFloat(e.Expense_Amount);
    });

    let formattedBalance;
    if (total < 0) {
        formattedBalance = `-$${Math.abs(total).toFixed(2)}`;
        balanceDisplay.style.color = "#d32f2f";
    } else if (total > 0) {
        formattedBalance = `$${total.toFixed(2)}`;
        balanceDisplay.style.color = "#357a38";
    } else {
        formattedBalance = `$0.00`;
        balanceDisplay.style.color = "#333";
    }

    balanceDisplay.textContent = `Balance: ${formattedBalance}`;

    clearExpensesButton.style.display = userExpenses.length ? "block" : "none";
}

// Add new expense
async function addExpense(e) {
    e?.preventDefault();

    const description = document.getElementById("description").value.trim();
    const amount = parseFloat(document.getElementById("amount").value);
    const categoryId = parseInt(categoryDropdown.value);

    if (!amount || !categoryId) {
        alert("Enter valid amount and select category");
        return;
    }

    try {
        const data = await authFetch("/api/expenses", {
            method: "POST",
            body: JSON.stringify({
                amount,
                categoryId,
                description,
                date: new Date().toISOString().slice(0, 10)
            })
        });

        userExpenses.push({
            Expense_ID: data.expenseId,
            Expense_Amount: amount,
            Expense_Description: description,
            Category_Name: categoryDropdown.selectedOptions[0].text
        });

        renderExpenses();

        // Clear form fields
        document.getElementById("description").value = "";
        document.getElementById("amount").value = "";
        categoryDropdown.value = "";

        // Close modal
        addExpenseModal.classList.add("hidden");
    } catch (err) {
        console.error("Add expense error:", err);
        alert(err.message);
    }
}

// Delete expense
async function deleteExpense(id) {
    if (!confirm("Delete this expense?")) return;

    try {
        await authFetch(`/api/expenses/${id}`, { method: "DELETE" });
        userExpenses = userExpenses.filter(e => e.Expense_ID !== id);
        renderExpenses();
    } catch (err) {
        console.error("Delete expense error:", err);
        alert(err.message);
    }
}

// Clear all expenses
async function clearExpenses() {
    if (!confirm("Are you sure you want to clear all expenses?")) return;

    try {
        await authFetch("/api/expenses", { method: "DELETE" });
        userExpenses = [];
        renderExpenses();
        alert("All expenses cleared!");
    } catch (err) {
        console.error("Clear expenses error:", err);
        alert(err.message);
    }
}

// Logout
function logout() {
    localStorage.removeItem("token");
    window.location.replace("login.html");
}

// --- Modal logic ---
addExpenseBtn.addEventListener("click", () => {
    addExpenseModal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
    addExpenseModal.classList.add("hidden");
});

addExpenseModal.addEventListener("click", (e) => {
    if (e.target === addExpenseModal) {
        addExpenseModal.classList.add("hidden");
    }
});

// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("logoutBtn").addEventListener("click", logout);
    addExpenseForm.addEventListener("submit", addExpense);
    clearExpensesButton.addEventListener("click", clearExpenses);
});

// Initial load
loadDashboard();