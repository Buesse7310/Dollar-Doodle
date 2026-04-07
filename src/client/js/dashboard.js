// ------------------------
// Auth check (JWT)
// ------------------------
const token = localStorage.getItem("token");

if (!token) {
    window.location.replace("/login.html");
}

// ------------------------
// Auth Fetch Helper
// ------------------------
async function authFetch(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
        logout();
        return;
    }

    options.headers = {
        ...(options.headers || {}),
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    };

    const res = await fetch(url, options);

    if (res.status === 401) {
        // Token expired, redirect to login with expired flag
        window.location.replace("/login.html?expired=1");
        return null;
    }

    return res;
}

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

const logoutBtn = document.getElementById("logout-btn");

let userTransactions = [];

// ------------------------
// Fetch dropdown data
// ------------------------
async function fetchDropdowns() {
    try {
        const res = await authFetch("/api/db-lookup");
        if (!res) return;

        const data = await res.json();

        categorySelect.innerHTML = "";
        data.categories.forEach(c => {
            const option = document.createElement("option");
            option.value = c.Category_ID;
            option.textContent = c.Category_Name;
            categorySelect.appendChild(option);
        });

        incomeSourceSelect.innerHTML = "";
        data.incomeSources.forEach(s => {
            const option = document.createElement("option");
            option.value = s;
            option.textContent = s;
            incomeSourceSelect.appendChild(option);
        });

        incomeFrequencySelect.innerHTML = "";
        data.recurringFrequencies.forEach(f => {
            const option = document.createElement("option");
            option.value = f;
            option.textContent = f;
            incomeFrequencySelect.appendChild(option);
        });

        incomeFrequencySelect.disabled = true;

    } catch (err) {
        console.error("Dropdown error:", err);
    }
}

// ------------------------
// Fetch transactions
// ------------------------
async function fetchTransactions() {
    try {
        const res = await authFetch("/api/transactions");
        if (!res) return;

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
// Type toggle
// ------------------------
function handleTypeChange() {
    if (typeSelect.value === "income") {
        descriptionInput.style.display = "none";
        categoryWrapper.style.display = "none";
        incomeSourceWrapper.style.display = "block";
        incomeRepeatingWrapper.style.display = "flex";
        incomeFrequencyWrapper.style.display = "block";
        incomeFrequencySelect.disabled = !incomeRepeatingCheckbox.checked;
    } else {
        descriptionInput.style.display = "block";
        categoryWrapper.style.display = "block";
        incomeSourceWrapper.style.display = "none";
        incomeRepeatingWrapper.style.display = "none";
        incomeFrequencyWrapper.style.display = "none";
        incomeRepeatingCheckbox.checked = false;
        incomeFrequencySelect.disabled = true;
    }
}

incomeRepeatingCheckbox.addEventListener("change", () => {
    incomeFrequencySelect.disabled = !incomeRepeatingCheckbox.checked;
});

// ------------------------
// Add transaction
// ------------------------
addTransactionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const type = typeSelect.value;
    const body = {
        type,
        amount: parseFloat(document.getElementById("amount").value),
        date: document.getElementById("date").value,
        description: descriptionInput.value,
        categoryId: type === "expense" ? categorySelect.value : null,
        source: type === "income" ? incomeSourceSelect.value : null,
        repeating: incomeRepeatingCheckbox.checked,
        frequency: incomeRepeatingCheckbox.checked ? incomeFrequencySelect.value : null
    };

    try {
        const res = await authFetch("/api/transactions", {
            method: "POST",
            body: JSON.stringify(body)
        });
        if (!res) return;

        await fetchTransactions();

        addTransactionForm.reset();
        addTransactionModal.classList.add("hidden");
        handleTypeChange();

    } catch (err) {
        console.error(err);
    }
});

// ------------------------
// Delete transaction
// ------------------------
async function deleteTransaction(type, id) {
    const res = await authFetch(`/api/transactions/${type}/${id}`, {
        method: "DELETE"
    });
    if (!res) return;

    fetchTransactions();
}

// ------------------------
// Clear all
// ------------------------
clearTransactionsButton.addEventListener("click", async () => {
    if (!confirm("Clear all transactions?")) return;

    const res = await authFetch("/api/transactions", {
        method: "DELETE"
    });
    if (!res) return;

    fetchTransactions();
});

// ------------------------
// Modal
// ------------------------
addTransactionBtn.addEventListener("click", () => {
    addTransactionForm.reset();
    typeSelect.value = "expense";
    incomeRepeatingCheckbox.checked = false;
    incomeFrequencySelect.disabled = true;

    addTransactionModal.classList.remove("hidden");
    handleTypeChange();
});

typeSelect.addEventListener("change", handleTypeChange);
closeModalBtn.addEventListener("click", () =>
    addTransactionModal.classList.add("hidden")
);

// ------------------------
// Logout
// ------------------------
function logout() {
    localStorage.removeItem("token");
    window.location.replace("/login.html");
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to log out?")) logout();
    });
}

// ------------------------
// Init
// ------------------------
fetchDropdowns();
fetchTransactions();

// ========== RECEIPT UPLOAD FEATURE ==========

const uploadReceiptBtn = document.getElementById('upload-receipt-btn');
const receiptInput = document.getElementById('receiptInput');
const loadingOverlay = document.getElementById('loadingOverlay');

if (uploadReceiptBtn) {
    uploadReceiptBtn.addEventListener('click', function() {
        receiptInput.click();
    });
}

if (receiptInput) {
    receiptInput.addEventListener('change', function(event) {
        if (event.target.files && event.target.files[0]) {
            processReceipt(event.target.files[0]);
        }
    });
}

async function processReceipt(file) {
    if (!file) return;
    
    if (loadingOverlay) {
        loadingOverlay.style.display = 'flex';
    }
    
    try {
        // Step 1: Get receipt data from Veryfi
        const formData = new FormData();
        formData.append('receipt', file);
        
        const response = await fetch('http://localhost:5000/api/process-receipt', {
            method: 'POST',
            body: formData,
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to process receipt');
        }
        
        const receiptData = await response.json();
        
        if (!receiptData.line_items || receiptData.line_items.length === 0) {
            alert('No items found on this receipt. Please try a clearer image.');
            return;
        }
        
        console.log('Found', receiptData.line_items.length, 'line items');
        
        // Step 2: Categorize each line item
        const categorizeResponse = await fetch('http://localhost:5000/api/categorize-items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                lineItems: receiptData.line_items
            })
        });
        
        if (!categorizeResponse.ok) {
            throw new Error('Failed to categorize items');
        }
        
        const categorizeData = await categorizeResponse.json();
        const categorizedItems = categorizeData.categorizedItems || [];
        
        // Step 3: Show breakdown to user
        let itemsList = '';
        let totalAmount = 0;
        
        categorizedItems.forEach((item, index) => {
            itemsList += `${index + 1}. ${item.description}\n   $${item.total.toFixed(2)} → ${item.category_name}\n\n`;
            totalAmount += item.total;
        });
        
        const confirmMessage = `📋 RECEIPT BREAKDOWN\n\nStore: ${receiptData.vendor?.name || 'Unknown'}\nDate: ${receiptData.date || new Date().toLocaleDateString()}\n\nITEMS (${categorizedItems.length}):\n${itemsList}━━━━━━━━━━━━━━━━━━━━\nTOTAL: $${totalAmount.toFixed(2)}\n\nDo you want to save all items as separate transactions?`;
        
        if (confirm(confirmMessage)) {
            // Step 4: Save each item as an expense
            let savedCount = 0;
            
            for (const item of categorizedItems) {
                const saveResponse = await fetch('http://localhost:5000/api/transactions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        type: 'expense',
                        amount: item.total,
                        description: item.description,
                        date: receiptData.date || new Date().toISOString().split('T')[0],
                        categoryId: item.category_id,
                        source: null,
                        repeating: false,
                        frequency: null
                    })
                });
                
                if (saveResponse.ok) {
                    savedCount++;
                }
            }
            
            alert(`✅ Success! Saved ${savedCount} transactions from your receipt.`);
            location.reload();
        }
        
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to process receipt: ' + error.message);
    } finally {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        if (receiptInput) {
            receiptInput.value = '';
        }
    }
}