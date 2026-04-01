
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

INSERT INTO Users 
(User_email, User_Pswrd, User_FirstName, User_LastName, User_picture, User_Last_login, User_Auth_Type)
VALUES
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

INSERT INTO Categories (Category_Name) VALUES
('Food & Dining'),
('Transportation'),
('Shopping'),
('Entertainment'),
('Bills & Utilities'),
('Housing'),
('Healthcare'),
('Education'),
('Travel'),
('Personal Care'),
('Pets'),
('Other');

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

INSERT INTO Expenses (User_ID, Category_ID, Expense_Amount, Expense_Description, Expense_date) VALUES

-- USER 1
(1, 1, 72.50, 'Grocery shopping at Walmart', '2026-03-01'),
(1, 1, 18.25, 'Lunch at Chipotle', '2026-03-03'),
(1, 1, 5.75, 'Coffee at Starbucks', '2026-03-05'),

(1, 2, 45.00, 'Gas refill at Shell', '2026-03-02'),
(1, 2, 12.00, 'Uber ride downtown', '2026-03-06'),
(1, 2, 3.50, 'Bus fare', '2026-03-08'),

(1, 4, 15.99, 'Netflix subscription', '2026-03-01'),
(1, 4, 22.00, 'Movie tickets', '2026-03-07'),
(1, 4, 60.00, 'Concert ticket', '2026-03-10'),

-- USER 2
(2, 1, 85.20, 'Weekly groceries at Aldi', '2026-03-02'),
(2, 1, 25.00, 'Dinner at Olive Garden', '2026-03-04'),
(2, 1, 6.50, 'Morning coffee', '2026-03-06'),

(2, 2, 50.00, 'Gas at BP', '2026-03-03'),
(2, 2, 14.00, 'Lyft ride', '2026-03-05'),
(2, 2, 4.00, 'Train ticket', '2026-03-09'),

(2, 3, 120.00, 'Clothes shopping at Target', '2026-03-08'),
(2, 3, 35.00, 'Shoes purchase', '2026-03-10'),
(2, 3, 20.00, 'Accessories', '2026-03-12'),

-- USER 3
(3, 1, 68.00, 'Groceries at Costco', '2026-03-01'),
(3, 1, 30.00, 'Takeout pizza', '2026-03-04'),
(3, 1, 7.00, 'Coffee shop', '2026-03-06'),

(3, 5, 120.00, 'Electric bill', '2026-03-02'),
(3, 5, 60.00, 'Internet bill', '2026-03-03'),
(3, 5, 40.00, 'Water bill', '2026-03-05'),

-- USER 4
(4, 6, 1200.00, 'Monthly rent payment', '2026-03-01'),
(4, 6, 50.00, 'Maintenance fee', '2026-03-10'),
(4, 6, 75.00, 'Home repairs', '2026-03-15'),

(4, 7, 30.00, 'Pharmacy purchase', '2026-03-03'),
(4, 7, 100.00, 'Doctor visit', '2026-03-08'),
(4, 7, 20.00, 'Vitamins', '2026-03-12'),

-- USER 5
(5, 8, 500.00, 'Tuition payment', '2026-03-01'),
(5, 8, 60.00, 'Books purchase', '2026-03-05'),
(5, 8, 25.00, 'Online course', '2026-03-10'),

(5, 9, 300.00, 'Flight ticket', '2026-03-02'),
(5, 9, 150.00, 'Hotel booking', '2026-03-06'),
(5, 9, 80.00, 'Car rental', '2026-03-09'),

-- USER 6
(6, 10, 45.00, 'Haircut', '2026-03-03'),
(6, 10, 20.00, 'Skincare products', '2026-03-06'),
(6, 10, 35.00, 'Salon visit', '2026-03-09'),

(6, 11, 60.00, 'Pet food', '2026-03-02'),
(6, 11, 120.00, 'Vet visit', '2026-03-07'),
(6, 11, 25.00, 'Pet toys', '2026-03-11'),

-- USER 7
(7, 12, 40.00, 'Miscellaneous items', '2026-03-01'),
(7, 12, 75.00, 'Gift purchase', '2026-03-05'),
(7, 12, 20.00, 'Random expense', '2026-03-08'),

-- USER 8
(8, 1, 95.00, 'Groceries at Walmart', '2026-03-02'),
(8, 2, 65.00, 'Gas refill', '2026-03-03'),
(8, 4, 18.00, 'Streaming subscription', '2026-03-04'),

-- USER 9
(9, 5, 130.00, 'Utility bills', '2026-03-02'),
(9, 6, 1100.00, 'Rent payment', '2026-03-01'),
(9, 3, 200.00, 'Shopping spree', '2026-03-06'),

-- USER 10
(10, 1, 80.00, 'Groceries', '2026-03-01'),
(10, 2, 55.00, 'Gas', '2026-03-02'),
(10, 4, 25.00, 'Movie night', '2026-03-03');


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

INSERT INTO Incomes (
    User_ID,
    Income_Amount,
    Income_Source,
    Income_Date,
    Income_Repeating,
    Income_Recurring_frequency
) VALUES

-- USER 1
(1, 3200.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(1, 200.00, 'Side Hustle', '2026-03-15', FALSE, NULL),

-- USER 2
(2, 2800.00, 'Wages', '2026-03-01', TRUE, 'monthly'),
(2, 150.00, 'Freelance', '2026-03-10', FALSE, NULL),

-- USER 3
(3, 4000.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(3, 300.00, 'Investment', '2026-03-20', FALSE, NULL),

-- USER 4
(4, 3500.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(4, 250.00, 'Bonus', '2026-03-25', FALSE, NULL),

-- USER 5
(5, 2200.00, 'Wages', '2026-03-01', TRUE, 'monthly'),
(5, 500.00, 'Scholarship', '2026-03-05', FALSE, NULL),

-- USER 6
(6, 5000.00, 'Business', '2026-03-01', TRUE, 'monthly'),
(6, 400.00, 'Side Hustle', '2026-03-18', FALSE, NULL),

-- USER 7
(7, 3100.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(7, 100.00, 'Gift', '2026-03-12', FALSE, NULL),

-- USER 8
(8, 2700.00, 'Wages', '2026-03-01', TRUE, 'monthly'),
(8, 200.00, 'Freelance', '2026-03-22', FALSE, NULL),

-- USER 9
(9, 4500.00, 'Business', '2026-03-01', TRUE, 'monthly'),
(9, 350.00, 'Rental Income', '2026-03-15', FALSE, NULL),

-- USER 10
(10, 3800.00, 'Salary', '2026-03-01', TRUE, 'monthly'),
(10, 250.00, 'Bonus', '2026-03-28', FALSE, NULL);


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

DELIMITER $$

CREATE PROCEDURE InsertExpenses()
BEGIN
    DECLARE u INT DEFAULT 1;
    DECLARE c INT;
    DECLARE i INT;

    WHILE u <= 10 DO
        SET c = 1;
        
        WHILE c <= 12 DO
            SET i = 1;
            
            WHILE i <= 10 DO
                INSERT INTO Expenses (
                    User_ID,
                    Expense_Amount,
                    Category_ID,
                    Expense_Description,
                    Expense_date
                )
                VALUES (
                    u,
                    ROUND(10 + (RAND() * 90), 2),
                    c,
                    CONCAT('Expense ', i, ' for category ', c),
                    DATE_SUB(CURDATE(), INTERVAL FLOOR(RAND()*30) DAY)
                );

                SET i = i + 1;
            END WHILE;

            SET c = c + 1;
        END WHILE;

        SET u = u + 1;
    END WHILE;

END$$

DELIMITER ;

CALL InsertExpenses();

SELECT COUNT(*) FROM Expenses;