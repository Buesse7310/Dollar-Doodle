
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

INSERT INTO categories (Category_Name, Category_Icon, Budget_Percentage) VALUES
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

-- USER 1
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(1, 1, '2026-04-01', 400, 0.00),
(1, 2, '2026-04-01', 250, 0.00),
(1, 3, '2026-04-01', 300, 0.00),
(1, 4, '2026-04-01', 200, 0.00),
(1, 5, '2026-04-01', 350, 0.00),
(1, 6, '2026-04-01', 1200, 0.00),
(1, 7, '2026-04-01', 150, 0.00),
(1, 8, '2026-04-01', 200, 0.00),
(1, 9, '2026-04-01', 300, 0.00),
(1, 10, '2026-04-01', 100, 0.00),
(1, 11, '2026-04-01', 120, 0.00),
(1, 12, '2026-04-01', 150, 0.00);

-- USER 2
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(2, 1, '2026-04-01', 420, 0.00),
(2, 2, '2026-04-01', 260, 0.00),
(2, 3, '2026-04-01', 310, 0.00),
(2, 4, '2026-04-01', 210, 0.00),
(2, 5, '2026-04-01', 360, 0.00),
(2, 6, '2026-04-01', 1250, 0.00),
(2, 7, '2026-04-01', 160, 0.00),
(2, 8, '2026-04-01', 210, 0.00),
(2, 9, '2026-04-01', 310, 0.00),
(2, 10, '2026-04-01', 110, 0.00),
(2, 11, '2026-04-01', 130, 0.00),
(2, 12, '2026-04-01', 160, 0.00);

-- USER 3
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(3, 1, '2026-04-01', 380, 0.00),
(3, 2, '2026-04-01', 240, 0.00),
(3, 3, '2026-04-01', 290, 0.00),
(3, 4, '2026-04-01', 190, 0.00),
(3, 5, '2026-04-01', 340, 0.00),
(3, 6, '2026-04-01', 1150, 0.00),
(3, 7, '2026-04-01', 140, 0.00),
(3, 8, '2026-04-01', 190, 0.00),
(3, 9, '2026-04-01', 280, 0.00),
(3, 10, '2026-04-01', 90, 0.00),
(3, 11, '2026-04-01', 100, 0.00),
(3, 12, '2026-04-01', 140, 0.00);


-- USER 4
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(4, 1, '2026-04-01', 410, 0.00),
(4, 2, '2026-04-01', 255, 0.00),
(4, 3, '2026-04-01', 305, 0.00),
(4, 4, '2026-04-01', 205, 0.00),
(4, 5, '2026-04-01', 355, 0.00),
(4, 6, '2026-04-01', 1220, 0.00),
(4, 7, '2026-04-01', 155, 0.00),
(4, 8, '2026-04-01', 205, 0.00),
(4, 9, '2026-04-01', 305, 0.00),
(4, 10, '2026-04-01', 105, 0.00),
(4, 11, '2026-04-01', 125, 0.00),
(4, 12, '2026-04-01', 155, 0.00);


-- USER 5
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(4, 1, '2026-04-01', 410, 0.00),
(4, 2, '2026-04-01', 255, 0.00),
(4, 3, '2026-04-01', 305, 0.00),
(4, 4, '2026-04-01', 205, 0.00),
(4, 5, '2026-04-01', 355, 0.00),
(4, 6, '2026-04-01', 1220, 0.00),
(4, 7, '2026-04-01', 155, 0.00),
(4, 8, '2026-04-01', 205, 0.00),
(4, 9, '2026-04-01', 305, 0.00),
(4, 10, '2026-04-01', 105, 0.00),
(4, 11, '2026-04-01', 125, 0.00),
(4, 12, '2026-04-01', 155, 0.00);



-- USER 6
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(4, 1, '2026-04-01', 420, 0.00),
(4, 2, '2026-04-01', 250, 0.00),
(4, 3, '2026-04-01', 220, 0.00),
(4, 4, '2026-04-01', 150, 0.00),
(4, 5, '2026-04-01', 400, 0.00),
(4, 6, '2026-04-01', 1600, 0.00),
(4, 7, '2026-04-01', 250, 0.00),
(4, 8, '2026-04-01', 200, 0.00),
(4, 9, '2026-04-01', 100, 0.00),
(4, 10, '2026-04-01', 250, 0.00),
(4, 11, '2026-04-01', 400, 0.00),
(4, 12, '2026-04-01', 210, 0.00);


-- USER 7
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(4, 1, '2026-04-01', 410, 0.00),
(4, 2, '2026-04-01', 255, 0.00),
(4, 3, '2026-04-01', 305, 0.00),
(4, 4, '2026-04-01', 205, 0.00),
(4, 5, '2026-04-01', 355, 0.00),
(4, 6, '2026-04-01', 1220, 0.00),
(4, 7, '2026-04-01', 155, 0.00),
(4, 8, '2026-04-01', 205, 0.00),
(4, 9, '2026-04-01', 305, 0.00),
(4, 10, '2026-04-01', 105, 0.00),
(4, 11, '2026-04-01', 125, 0.00),
(4, 12, '2026-04-01', 155, 0.00);




-- USER 8
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(4, 1, '2026-04-01', 500, 0.00),
(4, 2, '2026-04-01', 150, 0.00),
(4, 3, '2026-04-01', 250, 0.00),
(4, 4, '2026-04-01', 1000, 0.00),
(4, 5, '2026-04-01', 320, 0.00),
(4, 6, '2026-04-01', 1500, 0.00),
(4, 7, '2026-04-01', 200, 0.00),
(4, 8, '2026-04-01', 0, 0.00),
(4, 9, '2026-04-01', 0, 0.00),
(4, 10, '2026-04-01', 400, 0.00),
(4, 11, '2026-04-01', 0, 0.00),
(4, 12, '2026-04-01', 200, 0.00);




-- USER 9
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(3, 1, '2026-04-01', 580, 0.00),
(3, 2, '2026-04-01', 140, 0.00),
(3, 3, '2026-04-01', 290, 0.00),
(3, 4, '2026-04-01', 120, 0.00),
(3, 5, '2026-04-01', 390, 0.00),
(3, 6, '2026-04-01', 1850, 0.00),
(3, 7, '2026-04-01', 1140, 0.00),
(3, 8, '2026-04-01', 130, 0.00),
(3, 9, '2026-04-01', 180, 0.00),
(3, 10, '2026-04-01', 100, 0.00),
(3, 11, '2026-04-01', 200, 0.00),
(3, 12, '2026-04-01', 640, 0.00);



-- USER 10
INSERT INTO Monthly_Budgets (User_ID, Category_ID, Budget_Date, Budget_Amount, Budget_Spent) VALUES
(3, 1, '2026-04-01', 260, 0.00),
(3, 2, '2026-04-01', 230, 0.00),
(3, 3, '2026-04-01', 160, 0.00),
(3, 4, '2026-04-01', 320, 0.00),
(3, 5, '2026-04-01', 190, 0.00),
(3, 6, '2026-04-01', 850, 0.00),
(3, 7, '2026-04-01', 140, 0.00),
(3, 8, '2026-04-01', 330, 0.00),
(3, 9, '2026-04-01', 580, 0.00),
(3, 10, '2026-04-01', 65, 0.00),
(3, 11, '2026-04-01', 40, 0.00),
(3, 12, '2026-04-01', 320, 0.00);

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

-- Insert data into Budgets_Suggestions (respects User_ID and Category_ID foreign keys)
INSERT INTO Budgets_Suggestions (User_ID, Category_ID, Suggestion_Text, Potential_Savings) VALUES
(1, 1, 'Reduce dining out by meal prepping on Sundays. You spent $72.50 on groceries but also $18.25 on lunch.', 75.00),
(1, 4, 'Cancel unused streaming services. You have Netflix and other subscriptions that total $15.99 monthly.', 190.00),
(1, 2, 'Use public transit more often instead of Uber. Your $12 Uber ride could be replaced with $3.50 bus fare.', 8.50),
(2, 3, 'Wait for sales before buying clothes. You spent $120 at Target on regular-priced items.', 40.00),
(2, 1, 'Make coffee at home. Your $6.50 daily coffee costs $195 per month.', 150.00),
(3, 5, 'Switch to energy-efficient appliances to reduce your $120 electric bill.', 30.00),
(3, 1, 'Buy generic brands instead of name brands at Costco.', 25.00),
(4, 6, 'Consider finding a roommate to share your $1200 rent.', 600.00),
(4, 7, 'Use generic medications instead of brand name at the pharmacy.', 15.00),
(5, 8, 'Look for free online courses instead of paid ones.', 25.00),
(5, 9, 'Book flights on Tuesdays when prices are typically lower.', 50.00),
(6, 10, 'Learn to cut your own hair or go to a beauty school for discounts.', 30.00),
(6, 11, 'Buy pet food in bulk to save money.', 20.00),
(7, 12, 'Track miscellaneous spending - your $40 expense could be categorized better.', 0.00),
(8, 1, 'Use cashback apps like Rakuten for grocery purchases.', 15.00),
(9, 3, 'Create a shopping list before going to the mall to avoid impulse buys.', 50.00),
(10, 2, 'Carpool with coworkers to save on gas.', 25.00);


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

-- Insert data into Users_Feedbackss (respects User_ID foreign key)
INSERT INTO Users_Feedbackss (User_ID, Feedback_Type, Feedback_Message) VALUES
(1, 'suggestion', 'It would be great to have a dark mode option for the dashboard.'),
(1, 'general', 'Really loving the app so far! Very helpful for tracking my spending.'),
(2, 'bug_report', 'The expense chart is not loading properly on mobile devices.'),
(2, 'suggestion', 'Can you add a feature to export expenses to Excel?'),
(3, 'general', 'The budget alerts are very useful. Thank you!'),
(3, 'suggestion', 'Would be nice to have recurring expense templates.'),
(4, 'bug_report', 'I noticed the category percentages are not calculating correctly.'),
(4, 'general', 'Great app for managing my monthly budget.'),
(5, 'suggestion', 'Please add integration with bank accounts for automatic tracking.'),
(5, 'bug_report', 'The receipt upload feature is not working on Safari.'),
(6, 'general', 'This app helped me save $200 this month!'),
(6, 'suggestion', 'Add a feature to split expenses across multiple categories.'),
(7, 'general', 'Very intuitive interface. Easy to use.'),
(7, 'bug_report', 'The login page sometimes redirects to a blank screen.'),
(8, 'suggestion', 'A mobile app version would be amazing.'),
(8, 'general', 'Good job on the budget vs actual spending comparison.'),
(9, 'suggestion', 'Add notifications when approaching budget limits.'),
(9, 'bug_report', 'The date picker is not working on Firefox.'),
(10, 'general', 'Best budgeting app I have used so far.'),
(10, 'suggestion', 'Would love to see a yearly summary report.');

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

-- Insert data into Receipts (respects User_ID foreign key)
INSERT INTO Receipts (User_ID, Receipt_Image_Url) VALUES
(1, '/uploads/receipts/user1/walmart_groceries_20260301.jpg'),
(1, '/uploads/receipts/user1/chipotle_lunch_20260303.jpg'),
(1, '/uploads/receipts/user1/starbucks_coffee_20260305.jpg'),
(1, '/uploads/receipts/user1/shell_gas_20260302.jpg'),
(2, '/uploads/receipts/user2/aldi_groceries_20260302.jpg'),
(2, '/uploads/receipts/user2/olive_garden_dinner_20260304.jpg'),
(2, '/uploads/receipts/user2/target_clothes_20260308.jpg'),
(3, '/uploads/receipts/user3/costco_groceries_20260301.jpg'),
(3, '/uploads/receipts/user3/electric_bill_20260302.pdf'),
(3, '/uploads/receipts/user3/internet_bill_20260303.pdf'),
(4, '/uploads/receipts/user4/rent_receipt_20260301.pdf'),
(4, '/uploads/receipts/user4/doctor_visit_20260308.jpg'),
(5, '/uploads/receipts/user5/tuition_payment_20260301.pdf'),
(5, '/uploads/receipts/user5/flight_ticket_20260302.jpg'),
(6, '/uploads/receipts/user6/haircut_20260303.jpg'),
(6, '/uploads/receipts/user6/vet_visit_20260307.jpg'),
(7, '/uploads/receipts/user7/gift_purchase_20260305.jpg'),
(8, '/uploads/receipts/user8/walmart_groceries_20260302.jpg'),
(9, '/uploads/receipts/user9/utility_bills_20260302.pdf'),
(10, '/uploads/receipts/user10/groceries_20260301.jpg');