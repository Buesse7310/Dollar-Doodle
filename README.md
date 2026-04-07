# Dollar-Doodle

> Climb Higher, Spend Smarter

A modern web application to track expenses, visualize spending habits, and achieve financial goals.

## Features

- Log expenses by category
- View clean graphs and spending patterns
- Scan receipts
- Smart suggestions based on habits

## Usage

### 0. Install system dependencies

[Git](https://git-scm.com) and [Node.js](https://nodejs.org) are required to run this project, meaning the following commands should run in your terminal without error:

``` sh
git -v
npm -v
```

If there is an error when running either of the commands, then you need to install the related dependency.

### 1. Clone the repository

``` sh
git clone https://github.com/Buesse7310/Dollar-Doodle.git
cd Dollar-Doodle
```

### 2. Install project dependencies

``` sh
cd src/server
npm install --omit=dev
```

### 3. Run server

``` sh
node server.js
```

### 4. Open the app

Visit <http://localhost:5000> in your browser.

## Modules

- Frontend
    - Dashboard
    - Add Expense
    - Graphs
    - Receipt Scanner
- Backend
    - Authentication
    - Expense Processing
- Database
    - Users & Expenses Tables

## Timeline

- [x] Phase 1 (Feb 22): Brainstorm + project proposal.
- [x] Phase 2 (Mar 22): Frontend development.
- [ ] Phase 3 (Apr 19): Backend development.
- [ ] Phase 4 (May 11): Test and debug.

## Members

| Name              | Email                     | Role      |
| :---------------: | :-----------------------: | :-------: |
| Alex Hildreth     | <ah274852@my.stchas.edu>  | Manager   |
| Roumaysae Jerari  | <rj284480@my.stchas.edu>  | Developer |
| Eva Buesse        | <eb116770@my.stchas.edu>  | Developer |
| Nick Schott       | <ns285558@my.stchas.edu>  | Developer |
| Daniel Austin     | <da281540@my.stchas.edu>  | Developer |

## Development

### 0. Install system dependencies

[Git](https://git-scm.com) and [Node.js](https://nodejs.org) are required to run this project, meaning the following commands should run in your terminal without error:

``` sh
git -v
npm -v
```

If there is an error when running either of the commands, then you need to install the related dependency.

### 1. Clone the repository

``` sh
git clone https://github.com/Buesse7310/Dollar-Doodle.git
cd Dollar-Doodle
```

### 2. Install project dependencies

``` sh
cd src/server
npm install
```

### 3. Run server

``` sh
npx nodemon server.js
```

### 4. Make changes

The server is now running on <http://localhost:5000> and nodemon will automatically reload the server when you edit a file.

---

### 5. Team Setup Guide for Veryfi API

# Check if Node.js and Git are installed
node -v
npm -v
git -v

# If any command fails, install the missing dependency first

### 1. Clone the repository
git clone https://github.com/Buesse717/Dollar-Doodle.git
cd Dollar-Doodle

### 2. Install dependencies
npm install

### 3. Copy environment template files
cp .env.example .env
cp .env.veryfi_api_key.example .env.veryfi_api_key

### 4. Get your Veryfi API keys
# Go to: https://hub.veryfi.com/signup/api/
# Create a free account

### 5. Add your Veryfi credentials to .env.veryfi_api_key
# Open the file and replace:
# VERYFI_CLIENT_ID=your_client_id_here
# VERYFI_USERNAME=your_username_here
# VERYFI_API_KEY=your_api_key_here

### 6. Configure your database password in .env
# Open .env and set your MySQL password:
# DB_PASSWORD=your_mysql_password

### 7. Start the server
node server.js

### 8. Open your browser and go to:
# http://localhost:5000/login.html

> Because managing money shouldn't be a headache.

