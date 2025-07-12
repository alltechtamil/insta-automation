// middleware/auth.js
const { verifyToken } = require("../utils/jwt");
const logger = require("../utils/logger");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  logger.info(`Auth Header In Middleware: ${authHeader}`);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: `Authorization header missing or invalid` });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);
    req.userId = decoded?.userId;
    next();
  } catch (err) {
    console.error("Error verifying token:", err);
    logger.error(`Error verifying token: ${err.message}`);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = authMiddleware;
