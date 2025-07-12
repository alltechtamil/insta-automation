const fs = require("fs");
const path = require("path");
const { createLogger, format, transports } = require("winston");

const { combine, timestamp, printf, colorize, errors } = format;

// Ensure logs directory exists
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create Winston logger
const logger = createLogger({
  level: process.env.NODE_ENV === "production" ? "warn" : "debug",
  format: combine(colorize(), timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), logFormat),
  transports: [new transports.Console(), new transports.File({ filename: path.join(logDir, "error.log"), level: "error" }), new transports.File({ filename: path.join(logDir, "combined.log") })],
  exitOnError: false,
});

module.exports = logger;
