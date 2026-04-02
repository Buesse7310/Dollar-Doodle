// ------------------------
// Dashboard Elements
// ------------------------
const welcomeDisplay = document.getElementById("welcome");
const balanceDisplay = document.getElementById("balance");
const transactionsList = document.getElementById("transactions");
const addTransactionBtn = document.getElementById("add-expense-btn");
const clearTransactionsButton = document.getElementById("clearBtn");

const addTransactionModal = document.getElementById("add-expense-modal");
const closeModalBtn = addTransactionModal.querySelector(".close-btn");
const addTransactionForm = document.getElementById("add-expense-form");

const typeSelect = document.getElementById("type");
const descriptionInput = document.getElementById("description");
const categoryWrapper = document.getElementById("category-wrapper");
const categorySelect = document.getElementById("category");

const incomeSourceWrapper = document.getElementById("income-source-wrapper");
const incomeSourceSelect = document.getElementById("income-source");

const incomeRepeatingWrapper = document.getElementById("income-repeating-wrapper");
const incomeRepeatingCheckbox = document.getElementById("income-repeating");

const incomeFrequencyWrapper = document.getElementById("income-frequency-wrapper");
const incomeFrequencySelect = document.getElementById("income-frequency");

let userTransactions = [];

// ------------------------
// Fetch dropdown data from server
// ------------------------
async function fetchDropdowns() {
    try {
        const res = await fetch("/api/db-lookup", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (!res.ok) throw new Error("Failed to fetch dropdown data");

        const data = await res.json();

        // 1️⃣ Populate categories
        categorySelect.innerHTML = "";
        data.categories.forEach(c => {
            const option = document.createElement("option");
            option.value = c.Category_ID;
            option.textContent = c.Category_Name;
            categorySelect.appendChild(option);
        });

        // 2️⃣ Populate income sources
        incomeSourceSelect.innerHTML = "";
        data.incomeSources.forEach(s => {
            const option = document.createElement("option");
            option.value = s;
            option.textContent = s;
            incomeSourceSelect.appendChild(option);
        });

        // 3️⃣ Populate recurring frequencies
        incomeFrequencySelect.innerHTML = "";
        data.recurringFrequencies.forEach(f => {
            const option = document.createElement("option");
            option.value = f;
            option.textContent = f;
            incomeFrequencySelect.appendChild(option);
        });

        // Disable frequency dropdown by default
        incomeFrequencySelect.disabled = true;

    } catch (err) {
        console.error("Error fetching dropdowns:", err);
    }
}

// ------------------------
// Fetch transactions from server
// ------------------------
async function fetchTransactions() {
    try {
        const res = await fetch("/api/transactions", {
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (!res.ok) throw new Error("Failed to fetch transactions");
        userTransactions = await res.json();
        renderTransactions();
    } catch (err) {
        console.error(err);
    }
}

// ------------------------
// Render transactions & balance
// ------------------------
function renderTransactions() {
    transactionsList.innerHTML = "";

    if (userTransactions.length === 0) {
        const placeholder = document.createElement("p");
        placeholder.textContent = "No transactions yet. Click 'Add Transaction' to get started.";
        placeholder.style.textAlign = "center";
        placeholder.style.marginBottom = "1rem";
        transactionsList.appendChild(placeholder);
    }

    let total = 0;

    userTransactions.forEach(t => {
        const li = document.createElement("li");
        li.classList.add("transaction-item");

        const descSpan = document.createElement("span");
        descSpan.classList.add("transaction-desc");
        descSpan.textContent = t.type === "expense" ? t.description || "(No description)" : t.source;

        const typeSpan = document.createElement("span");
        typeSpan.classList.add("transaction-category");
        typeSpan.textContent = t.type === "expense" ? `[${t.category}]` :
            t.repeating ? `Recurring (${t.frequency})` : "One-time";

        const dateSpan = document.createElement("span");
        dateSpan.classList.add("transaction-date");
        dateSpan.textContent = new Date(t.date).toLocaleDateString();

        const leftDiv = document.createElement("div");
        leftDiv.appendChild(descSpan);
        leftDiv.appendChild(typeSpan);
        leftDiv.appendChild(dateSpan);

        const amountSpan = document.createElement("span");
        const amt = parseFloat(t.amount).toFixed(2);
        amountSpan.textContent = t.type === "expense" ? `-$${amt}` : `+$${amt}`;
        amountSpan.classList.add("expense-amount");
        amountSpan.style.color = t.type === "expense" ? "#d32f2f" : "#357a38";

        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.classList.add("delete-btn");
        delBtn.onclick = () => {
            if (confirm("Are you sure you want to delete this transaction?")) {
                deleteTransaction(t.type, t.id);
            }
        };

        li.appendChild(leftDiv);
        li.appendChild(amountSpan);
        li.appendChild(delBtn);

        transactionsList.appendChild(li);

        total += t.type === "income" ? parseFloat(t.amount) : -parseFloat(t.amount);
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
    clearTransactionsButton.style.display = userTransactions.length ? "block" : "none";
}

// ------------------------
// Update modal fields based on type
// ------------------------
function handleTypeChange() {
    if (typeSelect.value === "income") {
        descriptionInput.style.display = "none";
        categoryWrapper.style.display = "none";

        incomeSourceWrapper.style.display = "block";
        incomeRepeatingWrapper.style.display = "flex";

        // Recurring dropdown always visible, disabled initially
        incomeFrequencyWrapper.style.display = "block";
        incomeFrequencySelect.disabled = !incomeRepeatingCheckbox.checked;
    } else {
        descriptionInput.style.display = "block";
        categoryWrapper.style.display = "block";

        incomeSourceWrapper.style.display = "none";
        incomeRepeatingWrapper.style.display = "none";  // Hide completely for expense
        incomeFrequencyWrapper.style.display = "none"; // Hide completely for expense
        incomeRepeatingCheckbox.checked = false;
        incomeFrequencySelect.disabled = true;
    }
}

// ------------------------
// Recurring checkbox toggle
// ------------------------
incomeRepeatingCheckbox.addEventListener("change", () => {
    incomeFrequencySelect.disabled = !incomeRepeatingCheckbox.checked;
});

// ------------------------
// Add transaction
// ------------------------
addTransactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = typeSelect.value;
    const amount = parseFloat(document.getElementById("amount").value);
    const date = document.getElementById("date").value;
    const description = descriptionInput.value;
    const categoryId = type === "expense" ? categorySelect.value : null;
    const source = type === "income" ? incomeSourceSelect.value : null;
    const repeating = type === "income" ? incomeRepeatingCheckbox.checked : false;
    const frequency = repeating ? incomeFrequencySelect.value : null;

    try {
        const res = await fetch("/api/transactions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
            body: JSON.stringify({ type, amount, date, description, categoryId, source, repeating, frequency })
        });

        if (!res.ok) throw new Error("Failed to add transaction");

        // Immediately fetch and render transactions without page refresh
        await fetchTransactions();

        // Reset modal form and state
        addTransactionForm.reset();
        typeSelect.value = "expense";
        incomeRepeatingCheckbox.checked = false;
        incomeFrequencySelect.disabled = true;
        addTransactionModal.classList.add("hidden");

        handleTypeChange(); // ensures fields visibility matches default type

    } catch (err) {
        console.error(err);
    }
});

// ------------------------
// Delete transaction
// ------------------------
async function deleteTransaction(type, id) {
    try {
        const res = await fetch(`/api/transactions/${type}/${id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (!res.ok) throw new Error("Failed to delete transaction");
        fetchTransactions();
    } catch (err) {
        console.error(err);
    }
}

// ------------------------
// Clear all transactions
// ------------------------
clearTransactionsButton.addEventListener("click", async () => {
    if (!confirm("Are you sure you want to clear all transactions? This cannot be undone.")) return;

    try {
        const res = await fetch("/api/transactions", {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
        });
        if (!res.ok) throw new Error("Failed to clear transactions");
        fetchTransactions();
    } catch (err) {
        console.error(err);
    }
});

// ------------------------
// Modal open/close
// ------------------------
addTransactionBtn.addEventListener("click", () => {
    // Reset form
    addTransactionForm.reset();

    // Default type to expense
    typeSelect.value = "expense";

    // Reset recurring checkbox and dropdown
    incomeRepeatingCheckbox.checked = false;
    incomeFrequencySelect.disabled = true;

    // Show modal first
    addTransactionModal.classList.remove("hidden");

    // Apply type logic
    handleTypeChange();
});

typeSelect.addEventListener("change", handleTypeChange);

closeModalBtn.addEventListener("click", () => addTransactionModal.classList.add("hidden"));

// ------------------------
// Initial fetch
// ------------------------
fetchDropdowns();
fetchTransactions();