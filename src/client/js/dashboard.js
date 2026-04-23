// ------------------------
// Variables
// ------------------------
let currentPage = 1;
const itemsPerPage = 10;
let filteredTransactions = [];
let allTransactions = [];
let currentVendorFilter = "all";
let currentDateFilter = "all";
let receiptsData = [];

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
        localStorage.removeItem("token");
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

const aiBtn = document.getElementById("ai-insights-btn");
const aiModal = document.getElementById("ai-modal");
const closeAiModal = document.getElementById("close-ai-modal");
const aiError = document.getElementById("ai-error");

const aiLoading = document.getElementById("ai-loading");
const aiInsightsList = document.getElementById("ai-insights");
const aiSuggestionsList = document.getElementById("ai-suggestions");

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
// Fetch receipts to get vendor names
// ------------------------
async function fetchReceipts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/receipts', {
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (!response.ok) {
            console.error('Failed to fetch receipts:', response.status);
            return;
        }
        
        const vendors = await response.json();
        console.log('Vendors loaded from receipts:', vendors);
        populateVendorFilter(vendors);
    } catch (err) {
        console.error("Fetch receipts error:", err);
    }
}

// ------------------------
// Populate vendor dropdown from receipt vendor_name (unique)
// ------------------------
function populateVendorFilter(vendors) {
    const vendorSelect = document.getElementById('vendor-filter');
    if (!vendorSelect) return;
    
    if (!vendors || vendors.length === 0) {
        vendorSelect.innerHTML = '<option value="all">All Vendors</option>';
        return;
    }
    
    vendorSelect.innerHTML = '<option value="all">All Vendors</option>';
    vendors.forEach(vendor => {
        const option = document.createElement('option');
        option.value = vendor.vendor_name;
        option.textContent = vendor.vendor_name;
        vendorSelect.appendChild(option);
    });
}

// ------------------------
// Fetch transactions
// ------------------------
async function fetchTransactions() {
    try {
        const res = await authFetch("/api/transactions");
        if (!res) return;

        const data = await res.json();
        
        if (Array.isArray(data)) {
            allTransactions = data;
        } else {
            const expenses = data.expenses || [];
            const incomes = data.incomes || [];
            allTransactions = [...expenses, ...incomes];
        }
        
        applyFilters();
    } catch (err) {
        console.error("Fetch transactions error:", err);
    }
}
// ------------------------
// Filter functions
// ------------------------
function filterByVendor(transaction) {
    if (currentVendorFilter === 'all') return true;
    
    // For expenses, check if the description matches the selected vendor
    if (transaction.type === 'expense') {
        return transaction.description === currentVendorFilter;
    }
    return false;
}

function filterByDate(transaction, filterType) {
    let transactionDate = new Date(transaction.date);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    
    switch(filterType) {
        case 'today':
            return transactionDate.toDateString() === today.toDateString();
        case 'week':
            return transactionDate >= startOfWeek;
        case 'month':
            return transactionDate >= startOfMonth;
        case 'year':
            return transactionDate >= startOfYear;
        default:
            return true;
    }
}

function applyFilters() {
    let filtered = [...allTransactions];
    
    if (currentVendorFilter !== 'all') {
        filtered = filtered.filter(t => filterByVendor(t));
    }
    
    if (currentDateFilter !== 'all') {
        filtered = filtered.filter(t => filterByDate(t, currentDateFilter));
    }
    
    filteredTransactions = filtered;
    currentPage = 1;
    renderTransactions();
    updatePaginationControls();
}

function setupFilters() {
    const vendorFilter = document.getElementById('vendor-filter');
    const dateFilter = document.getElementById('date-filter');
    const clearFiltersBtn = document.getElementById('clear-filters-btn');
    
    if (vendorFilter) {
        vendorFilter.addEventListener('change', (e) => {
            currentVendorFilter = e.target.value;
            applyFilters();
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', (e) => {
            currentDateFilter = e.target.value;
            applyFilters();
        });
    }
    
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentVendorFilter = 'all';
            currentDateFilter = 'all';
            if (vendorFilter) vendorFilter.value = 'all';
            if (dateFilter) dateFilter.value = 'all';
            applyFilters();
        });
    }
}

// ------------------------
// Pagination functions
// ------------------------
function updatePaginationControls() {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    
    if (pageInfo) {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages || 1}`;
    }
    
    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
        prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';
        prevBtn.style.cursor = currentPage === 1 ? 'not-allowed' : 'pointer';
    }
    
    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages || totalPages === 0;
        nextBtn.style.opacity = (currentPage === totalPages || totalPages === 0) ? '0.5' : '1';
        nextBtn.style.cursor = (currentPage === totalPages || totalPages === 0) ? 'not-allowed' : 'pointer';
    }
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTransactions();
        updatePaginationControls();
        document.getElementById('transactions').scrollIntoView({ behavior: 'smooth' });
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderTransactions();
        updatePaginationControls();
        document.getElementById('transactions').scrollIntoView({ behavior: 'smooth' });
    }
}

// ------------------------
// Render transactions & balance
// ------------------------
function renderTransactions() {
    transactionsList.innerHTML = "";

    if (filteredTransactions.length === 0) {
        const placeholder = document.createElement("p");
        placeholder.textContent = "No transactions yet. Click 'Add Transaction' to get started.";
        placeholder.style.textAlign = "center";
        placeholder.style.marginBottom = "1rem";
        transactionsList.appendChild(placeholder);
        
        const balanceTotal = 0;
        balanceDisplay.textContent = `Balance: $0.00`;
        clearTransactionsButton.style.display = "none";
        return;
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    let total = 0;

    pageTransactions.forEach(t => {
        const li = document.createElement("li");
        li.classList.add("transaction-item");
        
        const descSpan = document.createElement("span");
        descSpan.classList.add("transaction-desc");
        descSpan.textContent = t.type === "expense" ? t.description || "(No description)" : t.source;

        const typeSpan = document.createElement("span");
        typeSpan.classList.add("transaction-category");
        typeSpan.textContent = t.type === "expense"
            ? `[${t.category}]`
            : t.repeating
                ? `Recurring (${t.frequency})`
                : "One-time";

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
        amountSpan.style.color = t.type === "expense" ? "#d32f2f" : "#357a38";

        const buttonDiv = document.createElement("div");
        buttonDiv.classList.add("button-group");
        
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.classList.add("edit-btn");
        editBtn.onclick = () => {
            openEditModal(t);
        };
        
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
        li.appendChild(editBtn);
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
    clearTransactionsButton.style.display = filteredTransactions.length ? "block" : "none";
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
    try {
        const token = localStorage.getItem('token');
        
        let url;
        if (type === 'expense') {
            url = `http://localhost:5000/api/transactions/expense/${id}`;
        } else {
            url = `http://localhost:5000/api/transactions/income/${id}`;
        }
        
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            await fetchTransactions();
        } else {
            const error = await response.json();
            alert('Failed to delete: ' + (error.error || 'Unknown error'));
        }
    } catch (err) {
        console.error('Delete error:', err);
        alert('Failed to delete transaction');
    }
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

// ========== RECEIPT UPLOAD FEATURE ==========

const uploadReceiptBtn = document.getElementById('upload-receipt-btn');
const receiptInput = document.getElementById('receiptInput');
const loadingOverlay = document.getElementById('loadingOverlay');

if (uploadReceiptBtn) {
    uploadReceiptBtn.addEventListener('click', function () {
        receiptInput.click();
    });
}

if (receiptInput) {
    receiptInput.addEventListener('change', function (event) {
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
        const formData = new FormData();
        formData.append('receipt', file);

        const token = localStorage.getItem('token');

        const response = await fetch('http://localhost:5000/api/process-receipt', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token
            },
            body: formData
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Success! Saved ${result.lineItemsCount} items from your receipt.`);
            await fetchTransactions();
            loadingOverlay.style.display = 'none';
            receiptInput.value = '';
        } else {
            alert('Failed to process receipt: ' + (result.error || 'Unknown error'));
            if (loadingOverlay) {
                loadingOverlay.style.display = 'none';
            }
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Failed to process receipt: ' + error.message);
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }
}

// ========== FEEDBACK FEATURE ==========

const feedbackBtn = document.getElementById('feedback-btn');
if (feedbackBtn) {
    feedbackBtn.onclick = function () {
        document.getElementById('feedback-modal').style.display = 'flex';
        document.getElementById('feedback-message').value = '';
    };
}

const closeFeedbackBtn = document.querySelector('.close-feedback-btn');
if (closeFeedbackBtn) {
    closeFeedbackBtn.onclick = function () {
        document.getElementById('feedback-modal').style.display = 'none';
    };
}

const feedbackForm = document.getElementById('feedback-form');
if (feedbackForm) {
    feedbackForm.onsubmit = async function (e) {
        e.preventDefault();

        const type = document.getElementById('feedback-type').value;
        const message = document.getElementById('feedback-message').value;

        if (!message) {
            alert('Please enter a message');
            return;
        }

        const tokenFeedback = localStorage.getItem('token');

        const responseFeedback = await fetch('http://localhost:5000/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + tokenFeedback
            },
            body: JSON.stringify({
                feedback_type: type,
                feedback_message: message
            })
        });

        if (responseFeedback.ok) {
            alert('Feedback sent!');
            document.getElementById('feedback-modal').style.display = 'none';
            document.getElementById('feedback-message').value = '';
        } else {
            alert('Failed to send feedback');
        }
    };
}

// AI state (prevents spam clicks)
let aiLoadingState = false;

function renderAI(data) {
    const insights = data?.insights || [];
    const suggestions = data?.suggestions || [];

    if (insights.length === 0 && suggestions.length === 0) {
        aiInsightsList.innerHTML = "<li>No insights available</li>";
        return;
    }

    insights.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        aiInsightsList.appendChild(li);
    });

    suggestions.forEach(text => {
        const li = document.createElement("li");
        li.textContent = text;
        aiSuggestionsList.appendChild(li);
    });
}

aiBtn.addEventListener("click", async () => {
    if (aiLoadingState) return;
    aiLoadingState = true;

    aiModal.style.display = "flex";

    aiInsightsList.innerHTML = "";
    aiSuggestionsList.innerHTML = "";
    aiError.style.display = "none";
    aiError.textContent = "";

    aiLoading.style.display = "block";

    try {
        const res = await authFetch("/api/ai-suggestions");

        if (!res || !res.ok) {
            throw new Error("Failed to fetch AI suggestions");
        }

        let data;
        try {
            data = await res.json();
        } catch (err) {
            throw new Error("Invalid AI response");
        }

        renderAI(data);

    } catch (err) {
        console.error("AI error:", err);
        aiError.textContent = "⚠️ Failed to load AI insights. Please try again.";
        aiError.style.display = "block";

    } finally {
        aiLoading.style.display = "none";
        aiLoadingState = false;
    }
});

closeAiModal.addEventListener("click", () => {
    aiModal.style.display = "none";
});

// ------------------------
// Pagination event listeners
// ------------------------
const prevBtn = document.getElementById('prev-page-btn');
const nextBtn = document.getElementById('next-page-btn');

if (prevBtn) {
    prevBtn.addEventListener('click', goToPrevPage);
}

if (nextBtn) {
    nextBtn.addEventListener('click', goToNextPage);
}

// ------------------------
// Init
// ------------------------
fetchDropdowns();
fetchReceipts();
fetchTransactions();
setupFilters();

// ========== EDIT EXPENSE & INCOME FEATURE ==========

const editModalHTML = `
<div id="edit-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1003; justify-content: center; align-items: center;">
    <div style="background: white; padding: 25px; border-radius: 10px; width: 90%; max-width: 500px;">
        <span class="close-edit-modal" style="float: right; cursor: pointer; font-size: 24px;">&times;</span>
        <h3 id="edit-modal-title">Edit Transaction</h3>
        <form id="edit-form">
            <input type="hidden" id="edit-id">
            <input type="hidden" id="edit-type">
            
            <div id="edit-expense-fields">
                <label>Description:</label>
                <input type="text" id="edit-description" style="width: 100%; padding: 10px; margin: 10px 0;">
                
                <label>Category:</label>
                <select id="edit-category" style="width: 100%; padding: 10px; margin: 10px 0;"></select>
            </div>
            
            <div id="edit-income-fields" style="display: none;">
                <label>Source:</label>
                <select id="edit-source" style="width: 100%; padding: 10px; margin: 10px 0;">
                    <option value="Salary">Salary</option>
                    <option value="Wages">Wages</option>
                    <option value="Self-Employed">Self-Employed</option>
                    <option value="Business">Business</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Investment">Investment</option>
                    <option value="Rental Income">Rental Income</option>
                    <option value="Lottery">Lottery</option>
                    <option value="Interest">Interest</option>
                    <option value="Bonus">Bonus</option>
                    <option value="Commission">Commission</option>
                    <option value="Tips">Tips</option>
                    <option value="Gift">Gift</option>
                    <option value="Refund">Refund</option>
                    <option value="Reimbursement">Reimbursement</option>
                    <option value="Government Benefits">Government Benefits</option>
                    <option value="Unemployment">Unemployment</option>
                    <option value="Child Support">Child Support</option>
                    <option value="Pension">Pension</option>
                    <option value="Social Security">Social Security</option>
                    <option value="Scholarship">Scholarship</option>
                    <option value="Student Loan">Student Loan</option>
                    <option value="Side Hustle">Side Hustle</option>
                    <option value="Other">Other</option>
                </select>
                
                <label>Repeating:</label>
                <select id="edit-repeating" style="width: 100%; padding: 10px; margin: 10px 0;">
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                </select>
                
                <label>Frequency:</label>
                <select id="edit-frequency" style="width: 100%; padding: 10px; margin: 10px 0;">
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                </select>
            </div>
            
            <label>Amount ($):</label>
            <input type="number" id="edit-amount" step="0.01" required style="width: 100%; padding: 10px; margin: 10px 0;">
            
            <label>Date:</label>
            <input type="date" id="edit-date" required style="width: 100%; padding: 10px; margin: 10px 0;">
            
            <button type="submit" style="background-color: #4CAF50; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer; width: 100%;">Update Transaction</button>
        </form>
    </div>
</div>
`;

if (!document.getElementById('edit-modal')) {
    document.body.insertAdjacentHTML('beforeend', editModalHTML);
}

const editModal = document.getElementById('edit-modal');
const closeEditModal = document.querySelector('.close-edit-modal');
const editForm = document.getElementById('edit-form');
const editRepeating = document.getElementById('edit-repeating');
const editFrequency = document.getElementById('edit-frequency');

if (editRepeating) {
    editRepeating.addEventListener('change', function() {
        editFrequency.disabled = this.value !== 'true';
    });
}

async function openEditModal(transaction) {
    document.getElementById('edit-id').value = transaction.id;
    document.getElementById('edit-type').value = transaction.type;
    document.getElementById('edit-amount').value = transaction.amount;
    
    let formattedDate = "";
    if (transaction.date) {
        if (typeof transaction.date === 'string' && transaction.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = transaction.date;
        } else {
            const dateObj = new Date(transaction.date);
            if (!isNaN(dateObj.getTime())) {
                formattedDate = dateObj.toISOString().split('T')[0];
            }
        }
    }
    document.getElementById('edit-date').value = formattedDate;
    
    if (transaction.type === 'expense') {
        document.getElementById('edit-modal-title').textContent = 'Edit Expense';
        document.getElementById('edit-expense-fields').style.display = 'block';
        document.getElementById('edit-income-fields').style.display = 'none';
        document.getElementById('edit-description').value = transaction.description || '';
        
        const res = await authFetch('/api/db-lookup');
        const data = await res.json();
        const categorySelect = document.getElementById('edit-category');
        categorySelect.innerHTML = '';
        data.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.Category_ID;
            option.textContent = cat.Category_Name;
            if (cat.Category_Name === transaction.category) {
                option.selected = true;
            }
            categorySelect.appendChild(option);
        });
    } else {
        document.getElementById('edit-modal-title').textContent = 'Edit Income';
        document.getElementById('edit-expense-fields').style.display = 'none';
        document.getElementById('edit-income-fields').style.display = 'block';
        
        const sourceSelect = document.getElementById('edit-source');
        if (sourceSelect) {
            sourceSelect.value = transaction.source || 'Salary';
        }
        
        document.getElementById('edit-repeating').value = transaction.repeating ? 'true' : 'false';
        document.getElementById('edit-frequency').value = transaction.frequency || 'monthly';
        
        if (editFrequency) {
            editFrequency.disabled = !transaction.repeating;
        }
    }
    
    editModal.style.display = 'flex';
}

if (closeEditModal) {
    closeEditModal.onclick = function() {
        editModal.style.display = 'none';
    }
}

window.onclick = function(e) {
    if (e.target === editModal) {
        editModal.style.display = 'none';
    }
}

if (editForm) {
    editForm.onsubmit = async function(e) {
        e.preventDefault();
        
        const id = document.getElementById('edit-id').value;
        const type = document.getElementById('edit-type').value;
        let amount = document.getElementById('edit-amount').value;
        const date = document.getElementById('edit-date').value;
        
        const token = localStorage.getItem('token');
        let response;
        
        if (type === 'expense') {
            const description = document.getElementById('edit-description').value;
            const categoryId = document.getElementById('edit-category').value;
            
            response = await fetch(`http://localhost:5000/api/transactions/expense/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    description: description,
                    amount: parseFloat(amount),
                    date: date,
                    categoryId: categoryId
                })
            });
        } else {
            const source = document.getElementById('edit-source').value;
            const repeating = document.getElementById('edit-repeating').value === 'true';
            let frequency = document.getElementById('edit-frequency').value;
            
            if (!repeating) {
                frequency = null;
            }
            
            response = await fetch(`http://localhost:5000/api/transactions/income/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    source: source,
                    date: date,
                    repeating: repeating,
                    frequency: frequency
                })
            });
        }
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Transaction updated successfully!');
            editModal.style.display = 'none';
            fetchTransactions();
        } else {
            alert('Failed to update transaction: ' + (result.error || 'Unknown error'));
        }
    }
}