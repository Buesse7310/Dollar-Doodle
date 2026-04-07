const mysql = require("mysql2/promise");

const db = mysql.createPool({
    host: "localhost",
    port: 3306,
    user: "root",
    password: "Roma1234",
    database: "dollar_doodle",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = db;