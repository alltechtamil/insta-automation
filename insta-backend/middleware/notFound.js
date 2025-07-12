const logger = require("../utils/logger");

const notFound = (req, res, next) => {
  const message = `🔍 Not Found - ${req.originalUrl}`;
  logger.warn(message);
  res.status(404).json({ error: message });
};

module.exports = notFound;
