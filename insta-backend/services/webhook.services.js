const axios = require("axios");
const { VERIFY_TOKEN, RECEIVING_EMAILID } = require("../config/envConfig");
const InstagramToken = require("../models/InstagramToken");
const AutomatedPost = require("../models/AutomatedPost");
const DMLog = require("../models/DMLog");
const logger = require("../utils/logger");
const { sendDMError, sendReplyError, sendEmail } = require("../services/email.service");

const DM_COOLDOWN_MS = 60 * 60 * 1000;
const REPLY_COOLDOWN_MS = 30 * 60 * 1000;

const getWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

const postWebhook = async (req, res) => {
  logger.info("Received Webhook:", JSON.stringify(req.body, null, 2));
  const entries = req.body.entry || [];

  for (const entry of entries) {
    const changes = entry?.changes || [];

    for (const change of changes) {
      const comment = change?.value;
      const field = change?.field;

      if (field !== "comments" || !comment?.media?.id || !comment?.text) continue;

      const mediaId = comment.media.id;
      const text = comment.text.toLowerCase();
      const commentId = comment.id;
      const commenterId = comment.from?.id;
      const instagramAccountId = entry.id;
      const now = new Date();

      logger.debug(`📩 Incoming comment: "${text}" on mediaId ${mediaId} from user ${commenterId}`);
      logger.debug(`📷 Instagram Account ID (from webhook): ${instagramAccountId}`);

      if (commenterId === instagramAccountId) {
        logger.info("👻 Skipping bot’s own comment to avoid loop.");
        continue;
      }

      const tokenDoc = await InstagramToken.findOne({ instagramAccountId });
      if (!tokenDoc) {
        logger.warn(`⚠️ No InstagramToken found for instagramAccountId: ${instagramAccountId}`);
        continue;
      }

      const userId = tokenDoc.userId;
      logger.debug(`✅ Mapped instagramAccountId ${instagramAccountId} to userId ${userId}`);

      const postRule = await AutomatedPost.findOne({ mediaId, userId, isEnabled: true });
      logger.debug(`🎯 postRule lookup result: ${postRule ? "FOUND" : "NOT FOUND"}`);
      if (!postRule) {
        logger.info(`No active automation rule found for media ID ${mediaId}`);
        continue;
      }

      if ((postRule.startDate && now < postRule.startDate) || (postRule.endDate && now > postRule.endDate)) {
        logger.info(`⏰ Automation rule not active (outside start/end window). Skipping.`);
        continue;
      }

      const matchedKeyword = postRule.keywords.find((kw) => text.includes(kw.toLowerCase()));
      if (!matchedKeyword) {
        logger.info(`🛑 No keywords matched for comment: "${text}"`);
        continue;
      }

      logger.info(`✅ Matched keyword "${matchedKeyword}" in comment "${text}"`);

      const dmText = postRule.replyMessage;
      const replyText = postRule.replyComment || postRule.replyMessage;
      const authHeader = {
        Authorization: `Bearer ${tokenDoc.pageLongAccessToken}`,
        "Content-Type": "application/json",
      };

      // === 🚀 DM Block with Cooldown + Email Alert ===
      if (postRule.isDM && (postRule.maxDMs === null || postRule.sentDMs < postRule.maxDMs)) {
        const recentDM = await DMLog.findOne({
          commenterId,
          mediaId,
          type: "dm",
          sent: true,
          sentAt: { $gte: new Date(now.getTime() - DM_COOLDOWN_MS) },
        });

        if (recentDM) {
          logger.info(`⏳ DM cooldown active. Skipping DM for commenter ${commenterId}`);
        } else {
          try {
            const dmUrl = `https://graph.facebook.com/v23.0/${tokenDoc.facebookUserId}/messages`;
            const dmPayload = {
              recipient: { comment_id: commentId },
              message: { text: dmText },
              messaging_type: "RESPONSE",
            };

            const dmResponse = await axios.post(dmUrl, dmPayload, { headers: authHeader });
            logger.info(`✅ DM sent. Message ID: ${dmResponse.data.message_id}`);

            postRule.sentDMs += 1;
            postRule.lastDMErrorAt = null;
            postRule.lastDMErrorNotificationSentAt = null;
            await postRule.save();

            await DMLog.create({
              userId,
              mediaId,
              commentId,
              commenterId,
              matchedKeyword,
              message: dmText,
              type: "dm",
              automationId: postRule._id,
              sent: true,
              sentAt: now,
              statusCode: 200,
            });
          } catch (err) {
            console.log(`🚀 Failed to send DM to ${commenterId} for mediaId ${mediaId}`, err);
            sendEmail(
              `🚀 Failed to send DM to ${commenterId} for mediaId ${mediaId}`,
              `🚀 Failed to send DM to ${commenterId} for mediaId ${mediaId}.\n\n${JSON.stringify(err, null, 2)}`,
            )
            const errorMessage = err.response?.data?.error?.message || err.message;
            logger.error(`❌ Failed to send DM: ${errorMessage}`);

            postRule.lastDMErrorAt = now;

            const alreadyNotified = postRule.lastDMErrorNotificationSentAt && postRule.lastDMErrorNotificationSentAt.getTime() === postRule.lastDMErrorAt.getTime();

            if (!alreadyNotified) {
              await sendDMError(userId, mediaId, commenterId, errorMessage, postRule, now);
              postRule.lastDMErrorNotificationSentAt = now;
            }

            await postRule.save();

            await DMLog.create({
              userId,
              mediaId,
              commentId,
              commenterId,
              matchedKeyword,
              message: dmText,
              type: "dm",
              automationId: postRule._id,
              sent: false,
              error: errorMessage,
              sentAt: now,
              statusCode: err.response?.status || 500,
            });
          }
        }
      }

      // === 💬 Reply Block with Cooldown + Email Alert ===
      if (postRule.isReply && (postRule.maxReplies === null || postRule.sentReplies < postRule.maxReplies)) {
        const recentReply = await DMLog.findOne({
          commenterId,
          mediaId,
          type: "reply",
          sent: true,
          sentAt: { $gte: new Date(now.getTime() - REPLY_COOLDOWN_MS) },
        });

        if (recentReply) {
          logger.info(`⏳ Reply cooldown active. Skipping reply for commenter ${commenterId}`);
        } else {
          try {
            const commentUrl = `https://graph.facebook.com/v23.0/${mediaId}/comments`;
            const commentPayload = { message: replyText };

            const commentResponse = await axios.post(commentUrl, commentPayload, { headers: authHeader });
            logger.info(`✅ Reply sent. Comment ID: ${commentResponse.data.id}`);

            postRule.sentReplies += 1;
            postRule.lastReplyErrorAt = null;
            postRule.lastReplyErrorNotificationSentAt = null;
            await postRule.save();

            await DMLog.create({
              userId,
              mediaId,
              commentId,
              commenterId,
              matchedKeyword,
              message: replyText,
              type: "reply",
              automationId: postRule._id,
              sent: true,
              sentAt: now,
              statusCode: 200,
            });
          } catch (err) {
            console.log(`🚨 DM Automation Failed for Media Full  - ${mediaId}`, err);
sendEmail(`🚨 DM Automation Failed for Media Full  - ${mediaId}`, 
`🚨 DM Automation Failed for Media Full  - ${mediaId}.\n\n${JSON.stringify(err, null, 2)}`
);
            const errorMessage = err.response?.data?.error?.message || err.message;
            logger.error(`❌ Failed to send reply: ${errorMessage}`);

            postRule.lastReplyErrorAt = now;

            const alreadyNotified = postRule.lastReplyErrorNotificationSentAt && postRule.lastReplyErrorNotificationSentAt.getTime() === postRule.lastReplyErrorAt.getTime();

            if (!alreadyNotified) {
              await sendReplyError(userId, mediaId, commenterId, errorMessage, postRule, now);
              postRule.lastReplyErrorNotificationSentAt = now;
            }

            await postRule.save();

            await DMLog.create({
              userId,
              mediaId,
              commentId,
              commenterId,
              matchedKeyword,
              message: replyText,
              type: "reply",
              automationId: postRule._id,
              sent: false,
              error: errorMessage,
              sentAt: now,
              statusCode: err.response?.status || 500,
            });
          }
        }
      }
    }
  }

  res.sendStatus(200);
};

module.exports = { getWebhook, postWebhook };
