const dotenv = require("dotenv");
const logger = require("../utils/logger");
dotenv.config();

const envConfig = {
  PORT: process.env.PORT || 3000,
  INSTAGRAM_APP_ID: process.env.INSTAGRAM_APP_ID || "1039187608381687",
  INSTAGRAM_APP_SECRET: process.env.INSTAGRAM_APP_SECRET || "ed8b29869ca2eb4a3e452d6f039ec49d",
  INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI || "https://insta-backend-n6j5.onrender.com/auth/callback",
  VERIFY_TOKEN: process.env.VERIFY_TOKEN || "alltechtamil123",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  JWT_SECRET: process.env.JWT_SECRET || "MaThanMiThun@1999",
  NODE_ENV: process.env.NODE_ENV || "development",
  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/insta-auto",
  FACEBOOK_API_URL: process.env.FACEBOOK_API_URL || "https://graph.facebook.com/v23.0",
  MAILER_EMAILID: process.env.MAILER_EMAILID || "namakkaldt123@gmail.com",
  MAILER_PASSWORD: process.env.MAILER_PASSWORD || "qjthxmibauetfldf",
  RECEIVING_EMAILID: process.env.RECEIVING_EMAILID || "mathanmithun8838@gmail.com",
};

logger.debug(`Environment Config: ${JSON.stringify(envConfig, null, 2)}`);

module.exports = envConfig;
