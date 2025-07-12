const mongoose = require("mongoose");
const { MONGODB_URI } = require("./envConfig");
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    logger.info("Connected to MongoDB");
  } catch (err) {
    console.error(`DB Error: ${err.message}`);
    logger.error(`DB Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
