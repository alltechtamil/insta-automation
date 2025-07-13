const nodemailer = require("nodemailer");
const logger = require("../utils/logger");
const { MAILER_EMAILID, MAILER_PASSWORD, RECEIVING_EMAILID } = require("./envConfig");

if (!MAILER_EMAILID || !MAILER_PASSWORD) {
  logger.error("Email credentials missing in environment variables");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: MAILER_EMAILID,
    pass: MAILER_PASSWORD,
  },
  tls: {
    rejectUnauthorized: true,
  },
});

async function checkEmailConnection() {
  try {
    await transporter.verify();
    logger.info(`Email server connection successful to ${RECEIVING_EMAILID}`);
  } catch (error) {
    logger.error(`Email server connection error: ${error}`);
    process.exit(1);
  }
}

module.exports = {
  transporter,
  checkEmailConnection,
};
