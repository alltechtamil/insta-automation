// utils/jwt.js
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/envConfig");

function generateToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { generateToken, verifyToken };
