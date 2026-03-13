const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "rootpassword",
  database: process.env.DB_NAME || "Dollar_Doodle",
  waitForConnections: true,         // queue queries if all connections busy
  connectionLimit: 10,              // max simultaneous connections
  queueLimit: 0                     // unlimited queued queries
});

module.exports = db;