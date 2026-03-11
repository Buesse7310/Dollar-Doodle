-- Create Dollar Doodle Database
CREATE DATABASE IF NOT EXISTS Dollar_Doodle;
USE Dollar_Doodle;

-- Drop existing tables in correct order (children before parents)
DROP TABLE IF EXISTS Receipts;
DROP TABLE IF EXISTS Users_Feedbackss;
DROP TABLE IF EXISTS Budgets_Suggestions;
DROP TABLE IF EXISTS Monthly_Budgets;
DROP TABLE IF EXISTS Incomes;
DROP TABLE IF EXISTS Expenses;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Users;

-- Table: Users
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
    
    -- Index on email for faster user login and search operations
    INDEX idx_user_email (User_email),
    -- Index on active status for quick filtering of active/inactive users
    INDEX idx_user_active (User_Active)
);

-- Table: Categories
CREATE TABLE Categories (
    Category_ID INT AUTO_INCREMENT PRIMARY KEY,
    Category_Name ENUM(
        'Food & Dining','Transportation', 'Shopping','Entertainment','Bills & Utilities','Housing','Healthcare','Education','Travel',
        'Personal Care','Pets','Other'
    )NOT NULL,
    Category_Icon VARCHAR(50),
    Budget_Percentage DECIMAL(5,2),
    
    -- Speed up queries that search or filter categories by name
    INDEX idx_category_name (Category_Name)
);

-- Table: Expenses
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
    
    -- Automatically delete user's expenses when the user account is deleted
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,

    -- Prevent deletion of categories that have existing expenses linked to them
    -- So the financial history doesn't get messed up 
    -- by deleting categories that still have expenses linked to them.
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID) ON DELETE RESTRICT,
    
    -- Speed up finding all expenses for a specific user
    INDEX idx_expense_user (User_ID),

    -- Speed up filtering expenses by category 
    INDEX idx_expense_category (Category_ID),

    -- Speed up searching expenses by date
    INDEX idx_expense_date (Expense_date),
    
    -- Ensure expense amounts are always positive numbers (no negative or zero transactions)
    CONSTRAINT chk_expense_amount_positive CHECK (Expense_Amount > 0)
);

-- Table: Incomes
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
    
    -- Speed up finding all income records for a specific user
    INDEX idx_income_user (User_ID),

    -- Speed up searching income by date 
    INDEX idx_income_date (Income_Date),

    -- Speed up filtering recurring vs one-time income
    INDEX idx_income_repeating (Income_Repeating),
    
    -- Ensure income amounts are always positive (no negative income entries)
    CONSTRAINT chk_income_amount_positive CHECK (Income_Amount > 0)
);

-- Table: Monthly_Budgets
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
    
    -- Speed up finding all budget records for a specific user
    INDEX idx_budget_user (User_ID),

    -- Speed up finding budgets by category
    INDEX idx_budget_category (Category_ID),

    -- Speed up searching budgets by date 
    INDEX idx_budget_date (Budget_Date),
    
    -- Ensure budget limits are not negative and spent amounts never go below zero
    CONSTRAINT chk_budget_amount_positive CHECK (Budget_Amount >= 0),
    CONSTRAINT chk_budget_spent_non_negative CHECK (Budget_Spent >= 0)
    
);

-- Table: Budgets_Suggestions
CREATE TABLE Budgets_Suggestions (
    Suggestion_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Category_ID INT NOT NULL,
    Suggestion_Text TEXT NOT NULL,
    Potential_Savings DECIMAL(10,2),
    Sug_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Automatically delete user's budgets when user is deleted, and category budgets when category is deleted
    -- So when a user or category is removed, their associated budget records
    -- are automatically cleaned up to avoid orphaned data.
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID) ON DELETE CASCADE,
    
    -- Speed up finding suggestions by user, category, or when they were created
    INDEX idx_suggestion_user (User_ID),
    INDEX idx_suggestion_category (Category_ID),
    INDEX idx_suggestion_created (Sug_Created_At),
    
    -- Prevent negative savings estimates (savings can't be less than zero)
    CONSTRAINT chk_potential_savings_positive CHECK (Potential_Savings >= 0)
);

-- Table: Users_Feedbackss
CREATE TABLE Users_Feedbackss (
    Feedback_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Feedback_Type ENUM('suggestion', 'bug_report', 'general') NOT NULL,
    Feedback_Message TEXT NOT NULL,
    Fdbk_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Automatically delete feedback when user account is deleted
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    
    -- Speed up finding feedback by user, feedback type, or when it was submitted
    INDEX idx_feedback_user (User_ID),
    INDEX idx_feedback_type (Feedback_Type),
    INDEX idx_feedback_created (Fdbk_Created_At)
);

-- Table: Receipts
CREATE TABLE Receipts (
    Receipt_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Receipt_Image_Url VARCHAR(500) NOT NULL,
    Rcpt_Uploaded_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Automatically delete receipt records when the associated user account is deleted
    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    
    -- Speed up finding receipts by user or when they were uploaded
    INDEX idx_receipt_user (User_ID),
    INDEX idx_receipt_uploaded (Rcpt_Uploaded_At)
);