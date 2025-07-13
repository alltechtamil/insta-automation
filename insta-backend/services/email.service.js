const { transporter } = require("../config/email.config");
const { MAILER_EMAILID, RECEIVING_EMAILID } = require("../config/envConfig");
const logger = require("../utils/logger");

const sendEmail = async (subject, htmlContent, contextForLog = {}) => {
  if (!to || !subject || !htmlContent) {
    logger.error("sendEmail called with missing parameters.", { subject: !!subject, html: !!htmlContent, contextForLog });
    throw new Error("sendEmail called with missing parameters.");
  }
  const mailOptions = {
    from: `"All Tech Tamil - Insta Automated Post" <${MAILER_EMAILID}>`,
    to: RECEIVING_EMAILID,
    subject: subject,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully to ${to} with subject "${subject}". Message ID: ${info.messageId}`, contextForLog);
    return info;
  } catch (error) {
    logger.error(`Email sending failed for recipient ${to} with subject "${subject}": ${error.message}`, {
      stack: error.stack,
      mailOptions,
      contextForLog,
    });
    throw error;
  }
};

const sendDMError = async (userId, mediaId, commenterId, errorMessage, postRule, now) => {
  const subject = `🚨 DM Automation Failed for Media ${mediaId}`;
  const html = `
                        <h3>DM Automation Error</h3>
                        <p><strong>User:</strong> ${userId}</p>
                        <p><strong>Media:</strong> ${mediaId}</p>
                        <p><strong>Commenter:</strong> ${commenterId}</p>
                        <p><strong>Error:</strong> ${errorMessage}</p>
                        <p><strong>Time:</strong> ${now.toLocaleString()}</p>
                        <hr><p>This is sent only once until resolved.</p>
                      `;

  try {
    const htmlContent = await sendEmail(RECEIVING_EMAILID, subject, html, { type: "DM_ERROR", userId, automationId: postRule._id });
    logger.info(`DM Error email sent successfully to ${RECEIVING_EMAILID} for media ${mediaId}. Message ID: ${htmlContent.messageId}`);
    return htmlContent;
  } catch (error) {
    throw error;
  }
};

const sendReplyError = async (userId, mediaId, commenterId, errorMessage, postRule, now) => {
  const subject = `🚨 Reply Automation Failed for Media ${mediaId}`;
  const html = `
                    <h3>Reply Automation Error</h3>
                    <p><strong>User:</strong> ${userId}</p>
                    <p><strong>Media:</strong> ${mediaId}</p>
                    <p><strong>Commenter:</strong> ${commenterId}</p>
                    <p><strong>Error:</strong> ${errorMessage}</p>
                    <p><strong>Time:</strong> ${now.toLocaleString()}</p>
                    <hr><p>This is sent only once until resolved.</p>
                  `;
  try {
    const htmlContent = await sendEmail(RECEIVING_EMAILID, subject, html, { type: "REPLY_ERROR", userId, automationId: postRule._id });
    logger.info(`Reply Error email sent successfully to ${RECEIVING_EMAILID} for media ${mediaId}. Message ID: ${htmlContent.messageId}`);
    return htmlContent;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  sendEmail,
  sendDMError,
  sendReplyError,
};
