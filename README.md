# Dollar-Doodle

> Climb Higher, Spend Smarter

A modern web application to track expenses, visualize spending habits, and achieve financial goals.

## Features

- Log expenses by category
- View clean graphs and spending patterns
- Scan receipts
- Smart suggestions based on habits

## Usage / Development

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

### 2. Import database

Import the latest database.sql (docs/phase3/database.sql) into the database program of your choice.

### 3. Setup environment variables

``` sh
cp .env.example .env
```

Edit .env and fill in the necessary values.

### 4. Install project dependencies

``` sh
cd src/server
npm install
```

### 5. Run server

``` sh
npx nodemon server.js
```

### 6. Open the app

The server is now running on <http://localhost:5000> and nodemon will automatically reload the server when you edit a file.

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
- [x] Phase 3 (Apr 19): Backend development.
- [x] Phase 4 (May 11): Test and debug.

## Members

| Name              | Email                     | Role      |
| :---------------: | :-----------------------: | :-------: |
| Alex Hildreth     | <ah274852@my.stchas.edu>  | Manager   |
| Roumaysae Jerari  | <rj284480@my.stchas.edu>  | Developer |
| Eva Buesse        | <eb116770@my.stchas.edu>  | Developer |
| Nick Schott       | <ns285558@my.stchas.edu>  | Developer |
| Daniel Austin     | <da281540@my.stchas.edu>  | Developer |

> Because managing money shouldn't be a headache.
