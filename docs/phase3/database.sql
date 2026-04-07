-- =====================================================
-- DOLLAR DOODLE DATABASE - COMPLETE SETUP
-- Run this entire script at once
-- =====================================================

-- Drop database if exists and recreate
DROP DATABASE IF EXISTS Dollar_Doodle;
CREATE DATABASE Dollar_Doodle;
USE Dollar_Doodle;

-- =====================================================
-- 1. CREATE TABLES (No foreign key issues - correct order)
-- =====================================================

-- Table: Users (Parent)
CREATE TABLE Users (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_email VARCHAR(255) UNIQUE NOT NULL,
    User_Pswrd VARCHAR(255) NOT NULL,
    User_FirstName VARCHAR(100) NOT NULL,
    User_LastName VARCHAR(100) NOT NULL,
    User_picture VARCHAR(500),
    User_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    User_Last_login TIMESTAMP,
    User_Active BOOLEAN DEFAULT TRUE,
    User_Auth_Type ENUM('email', 'google') NOT NULL,
    
    INDEX idx_user_email (User_email),
    INDEX idx_user_active (User_Active)
);

-- Table: Categories (Parent)
CREATE TABLE Categories (
    Category_ID INT AUTO_INCREMENT PRIMARY KEY,
    Category_Name ENUM(
        'Food & Dining','Transportation', 'Shopping','Entertainment',
        'Bills & Utilities','Housing','Healthcare','Education','Travel',
        'Personal Care','Pets','Other'
    ) NOT NULL,
    Category_Icon VARCHAR(50),
    Budget_Percentage DECIMAL(5,2),
    
    INDEX idx_category_name (Category_Name)
);

-- Table: Expenses (Child of Users and Categories)
CREATE TABLE Expenses (
    Expense_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Expense_Amount DECIMAL(10,2) NOT NULL,
    Category_ID INT NOT NULL,
    Expense_Description VARCHAR(255),
    Expense_date DATE NOT NULL,
    Exp_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Exp_Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Receipt_Image_url VARCHAR(500),
    Receipt_ID INT NULL,
    
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID) ON DELETE RESTRICT,
    
    INDEX idx_expense_user (User_ID),
    INDEX idx_expense_category (Category_ID),
    INDEX idx_expense_date (Expense_date),
    
    CONSTRAINT chk_expense_amount_positive CHECK (Expense_Amount > 0)
);

-- Table: Incomes (Child of Users)
CREATE TABLE Incomes (
    Income_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Income_Amount DECIMAL(10,2) NOT NULL,
    Income_Source ENUM(
        'Salary', 'Wages', 'Self-Employed', 'Business', 'Freelance',
        'Investment', 'Rental Income', 'Lottery', 'Interest', 'Bonus',
        'Commission', 'Tips', 'Gift', 'Refund', 'Reimbursement',
        'Government Benefits', 'Unemployment', 'Child Support', 'Pension',
        'Social Security', 'Scholarship', 'Student Loan', 'Side Hustle', 'Other'
    ) NOT NULL,
    Income_Date DATE NOT NULL,
    Income_Repeating BOOLEAN DEFAULT FALSE,
    Income_Recurring_frequency ENUM('weekly', 'biweekly', 'monthly', 'yearly') NULL,
    Income_Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    
    INDEX idx_income_user (User_ID),
    INDEX idx_income_date (Income_Date),
    INDEX idx_income_repeating (Income_Repeating),
    
    CONSTRAINT chk_income_amount_positive CHECK (Income_Amount > 0)
);

-- Table: Receipts (Child of Users)
CREATE TABLE Receipts (
    Receipt_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Receipt_Image_URL VARCHAR(500) NOT NULL,
    Rcpt_Uploaded_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vendor_name VARCHAR(255),
    receipt_date DATE,
    total_amount DECIMAL(10,2),
    veryfi_document_id VARCHAR(255),
    extracted_json TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    
    INDEX idx_receipt_user (User_ID),
    INDEX idx_receipt_uploaded (Rcpt_Uploaded_At)
);

-- Table: Receipt_Line_Items (Child of Receipts and Users)
CREATE TABLE Receipt_Line_Items (
    Line_Item_ID INT AUTO_INCREMENT PRIMARY KEY,
    Receipt_ID INT NOT NULL,
    User_ID INT NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2) NOT NULL,
    category_id INT,
    category_name VARCHAR(100),
    veryfi_category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (Receipt_ID) REFERENCES Receipts(Receipt_ID) ON DELETE CASCADE,
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES Categories(Category_ID) ON DELETE SET NULL,
    
    INDEX idx_line_item_receipt (Receipt_ID),
    INDEX idx_line_item_user (User_ID),
    INDEX idx_line_item_category (category_id)
);

-- Table: Monthly_Budgets (Child of Users and Categories)
CREATE TABLE Monthly_Budgets (
    Budget_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Category_ID INT NOT NULL,
    Budget_Date DATE NOT NULL,
    Budget_Amount DECIMAL(10,2) NOT NULL,
    Budget_Spent DECIMAL(10,2) DEFAULT 0.00,
    Budget_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID) ON DELETE CASCADE,
    
    INDEX idx_budget_user (User_ID),
    INDEX idx_budget_category (Category_ID),
    INDEX idx_budget_date (Budget_Date),
    
    CONSTRAINT chk_budget_amount_positive CHECK (Budget_Amount >= 0),
    CONSTRAINT chk_budget_spent_non_negative CHECK (Budget_Spent >= 0)
);

-- Table: Budgets_Suggestions (Child of Users and Categories)
CREATE TABLE Budgets_Suggestions (
    Suggestion_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Category_ID INT NOT NULL,
    Suggestion_Text TEXT NOT NULL,
    Potential_Savings DECIMAL(10,2),
    Sug_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID) ON DELETE CASCADE,
    
    INDEX idx_suggestion_user (User_ID),
    INDEX idx_suggestion_category (Category_ID),
    INDEX idx_suggestion_created (Sug_Created_At),
    
    CONSTRAINT chk_potential_savings_positive CHECK (Potential_Savings >= 0)
);

-- Table: Users_Feedbackss (Child of Users)
CREATE TABLE Users_Feedbackss (
    Feedback_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Feedback_Type ENUM('suggestion', 'bug_report', 'general') NOT NULL,
    Feedback_Message TEXT NOT NULL,
    Fdbk_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    
    INDEX idx_feedback_user (User_ID),
    INDEX idx_feedback_type (Feedback_Type),
    INDEX idx_feedback_created (Fdbk_Created_At)
);

-- =====================================================
-- 2. INSERT DATA
-- =====================================================

-- Insert Users
INSERT INTO Users (User_email, User_Pswrd, User_FirstName, User_LastName, User_picture, User_Last_login, User_Auth_Type) VALUES
('user1@email.com','pass123','John','Doe',NULL,NOW(),'email'),
('user2@email.com','pass123','Jane','Smith',NULL,NOW(),'email'),
('user3@email.com','pass123','Mike','Johnson',NULL,NOW(),'email'),
('user4@email.com','pass123','Emily','Davis',NULL,NOW(),'email'),
('user5@email.com','pass123','Chris','Brown',NULL,NOW(),'email'),
('user6@email.com','pass123','Sarah','Wilson',NULL,NOW(),'email'),
('user7@email.com','pass123','David','Lee',NULL,NOW(),'email'),
('user8@email.com','pass123','Laura','Martinez',NULL,NOW(),'email'),
('user9@email.com','pass123','James','Taylor',NULL,NOW(),'email'),
('user10@email.com','pass123','Olivia','Anderson',NULL,NOW(),'email');

-- Insert Categories
INSERT INTO Categories (Category_Name, Category_Icon, Budget_Percentage) VALUES
('Food & Dining', '🍔', 0.00),
('Transportation', '🚗', 0.00),
('Shopping', '🛍️', 0.00),
('Entertainment', '🎬', 0.00),
('Bills & Utilities', '💡', 0.00),
('Housing', '🏠', 0.00),
('Healthcare', '🏥', 0.00),
('Education', '📚', 0.00),
('Travel', '✈️', 0.00),
('Personal Care', '💇', 0.00),
('Pets', '🐶', 0.00),
('Other', '📦', 0.00);

-- Insert Expenses
INSERT INTO Expenses (User_ID, Category_ID, Expense_Amount, Expense_Description, Expense_date) VALUES
(1, 1, 72.50, 'Grocery shopping at Walmart', '2026-03-01'),
(1, 1, 18.25, 'Lunch at Chipotle', '2026-03-03'),
(1, 1, 5.75, 'Coffee at Starbucks', '2026-03-05'),
(1, 2, 45.00, 'Gas refill at Shell', '2026-03-02'),
(2, 1, 85.20, 'Weekly groceries at Aldi', '2026-03-02'),
(2, 1, 25.00, 'Dinner at Olive Garden', '2026-03-04'),
(3, 1, 68.00, 'Groceries at Costco', '2026-03-01'),
(3, 5, 120.00, 'Electric bill', '2026-03-02'),
(4, 6, 1200.00, 'Monthly rent payment', '2026-03-01'),
(4, 7, 100.00, 'Doctor visit', '2026-03-08'),
(5, 8, 500.00, 'Tuition payment', '2026-03-01'),
(5, 9, 300.00, 'Flight ticket', '2026-03-02'),
(6, 10, 45.00, 'Haircut', '2026-03-03'),
(6, 11, 120.00, 'Vet visit', '2026-03-07'),
(7, 12, 40.00, 'Miscellaneous items', '2026-03-01'),
(8, 1, 95.00, 'Groceries at Walmart', '2026-03-02'),
(9, 5, 130.00, 'Utility bills', '2026-03-02'),
(10, 1, 80.00, 'Groceries', '2026-03-01');

-- Insert Receipts
INSERT INTO Receipts (User_ID, Receipt_Image_URL, vendor_name, receipt_date, total_amount, status) VALUES
(1, '/uploads/receipts/user1/walmart_groceries_20260301.jpg', 'Walmart', '2026-03-01', 87.43, 'processed'),
(1, '/uploads/receipts/user1/chipotle_lunch_20260303.jpg', 'Chipotle', '2026-03-03', 12.85, 'processed'),
(2, '/uploads/receipts/user2/aldi_groceries_20260302.jpg', 'Aldi', '2026-03-02', 63.28, 'processed'),
(3, '/uploads/receipts/user3/costco_groceries_20260301.jpg', 'Costco', '2026-03-01', 156.82, 'processed'),
(4, '/uploads/receipts/user4/rent_receipt_20260301.pdf', 'Rent Payment', '2026-03-01', 1250.00, 'processed'),
(5, '/uploads/receipts/user5/tuition_payment_20260301.pdf', 'University', '2026-03-01', 3500.00, 'processed'),
(6, '/uploads/receipts/user6/haircut_20260303.jpg', 'Supercuts', '2026-03-03', 28.00, 'processed'),
(7, '/uploads/receipts/user7/gift_purchase_20260305.jpg', 'Amazon', '2026-03-05', 52.49, 'processed'),
(8, '/uploads/receipts/user8/walmart_groceries_20260302.jpg', 'Walmart', '2026-03-02', 112.37, 'processed'),
(9, '/uploads/receipts/user9/utility_bills_20260302.pdf', 'Water Dept', '2026-03-02', 67.23, 'processed'),
(10, '/uploads/receipts/user10/groceries_20260301.jpg', 'Kroger', '2026-03-01', 45.89, 'processed');

-- Insert Incomes
INSERT INTO Incomes (User_ID, Income_Amount, Income_Source, Income_Date, Income_Repeating, Income_Recurring_frequency) VALUES
(1, 3200.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(2, 2800.00, 'Wages', '2026-03-01', TRUE, 'monthly'),
(3, 4000.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(4, 3500.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(5, 2200.00, 'Wages', '2026-03-01', TRUE, 'monthly'),
(6, 5000.00, 'Business', '2026-03-01', TRUE, 'monthly'),
(7, 3100.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(8, 2700.00, 'Wages', '2026-03-01', TRUE, 'monthly'),
(9, 4500.00, 'Business', '2026-03-01', TRUE, 'monthly'),
(10, 3800.00, 'Salary', '2026-03-01', TRUE, 'monthly');

-- =====================================================
-- 3. ADD FOREIGN KEY to Expenses for Receipt_ID (after Receipts table exists)
-- =====================================================

ALTER TABLE Expenses ADD FOREIGN KEY (Receipt_ID) REFERENCES Receipts(Receipt_ID) ON DELETE SET NULL;

-- =====================================================
