const jwt = require("jsonwebtoken");

const SECRET = "supersecretkey";

function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader);

  if (!authHeader) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, SECRET);
    req.user = decoded;
    console.log("Decoded user:", decoded);
    next();
  } catch (err) {
    console.log("JWT verify error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = auth;