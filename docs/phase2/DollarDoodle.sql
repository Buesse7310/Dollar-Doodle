CREATE DATABASE DollarDoodle;
USE DollarDoodle;

CREATE TABLE Users (
    User_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_email VARCHAR(255) NOT NULL UNIQUE,
    User_Pswrd VARCHAR(255) NOT NULL,
    User_FirstName VARCHAR(100),
    User_LastName VARCHAR(100),
    User_picture VARCHAR(500),
    User_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    User_Last_login TIMESTAMP NULL,
    User_Active BOOLEAN DEFAULT TRUE,
    User_Auth_Type ENUM('email', 'google') DEFAULT 'email'
);    
    
    
CREATE TABLE Categories (
    Category_ID INT AUTO_INCREMENT PRIMARY KEY,
    Category_Name ENUM('Food','Transportation','Bills','Entertainment','Shopping','Healthcare','Education','Other') NOT NULL,
    Category_Icon VARCHAR(50),
    Budget_Percentage DECIMAL(5,2)
);   


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
    Exp_Repeating BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID) ON DELETE CASCADE
);


CREATE TABLE Incomes (
    Income_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Income_Amount DECIMAL(10,2) NOT NULL,
    Income_Source VARCHAR(100) NOT NULL,
    Income_Date DATE NOT NULL,
    Income_Repeating BOOLEAN DEFAULT FALSE,
    Income_Recurring_frequency ENUM('weekly','biweekly','monthly','yearly') NULL,
    Income_Created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);


CREATE TABLE Budgets_Suggestions (
    Suggestion_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Category_ID INT NOT NULL,
    Suggestion_Text TEXT NOT NULL,
    Potential_Savings DECIMAL(10,2),
    Sug_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID) ON DELETE CASCADE
);


CREATE TABLE Users_Feedbackss (
    Feedback_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Feedback_Type ENUM('suggestion','bug_report','general') NOT NULL,
    Feedback_Message TEXT NOT NULL,
    Fdbk_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);


CREATE TABLE Receipts (
    Receipt_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Receipt_Image_Url VARCHAR(500) NOT NULL,
    Rcpt_Uploaded_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE
);


CREATE TABLE Monthly_Budgets (
    Budget_ID INT AUTO_INCREMENT PRIMARY KEY,
    User_ID INT NOT NULL,
    Category_ID INT NOT NULL,
    Budget_Date DATE NOT NULL,
    Budget_Amount DECIMAL(10,2) NOT NULL,
    Budget_Spent DECIMAL(10,2) DEFAULT 0.00,
    Budget_Created_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (User_ID) REFERENCES Users(User_ID) ON DELETE CASCADE,
    FOREIGN KEY (Category_ID) REFERENCES Categories(Category_ID) ON DELETE CASCADE
);