const axios = require("axios");
const { VERIFY_TOKEN } = require("../config/envConfig");
const InstagramToken = require("../models/InstagramToken");
const AutomatedPost = require("../models/AutomatedPost");
const DMLog = require("../models/DMLog");
const logger = require("../utils/logger");
const { sendDMError, sendReplyError } = require("./email.service");

const DM_COOLDOWN_MS = 60 * 60 * 1000;
const REPLY_COOLDOWN_MS = 30 * 60 * 1000;
const NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000;

const getWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    logger.info("WEBHOOK_VERIFIED");
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
};

const postWebhook = async (req, res) => {
  try {
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

        logger.debug(`📩 Comment: "${text}" on media ${mediaId} from user ${commenterId}`);
        logger.debug(`📷 Instagram Account ID: ${instagramAccountId}`);

        // Skip bot's own comments
        if (commenterId === instagramAccountId) {
          logger.info("👻 Skipping bot’s own comment.");
          continue;
        }

        const tokenDoc = await InstagramToken.findOne({ instagramAccountId });
        if (!tokenDoc) {
          logger.warn(`⚠️ No token found for IG account: ${instagramAccountId}`);
          continue;
        }

        const userId = tokenDoc.userId;
        logger.debug(`✅ IG Account ${instagramAccountId} mapped to User ${userId}`);

        const postRule = await AutomatedPost.findOne({ mediaId, userId, isEnabled: true });
        logger.debug(`🎯 Rule lookup: ${postRule ? "FOUND" : "NOT FOUND"}`);
        if (!postRule) continue;

        // Check date range
        if ((postRule.startDate && now < postRule.startDate) || (postRule.endDate && now > postRule.endDate)) {
          logger.info(`⏰ Rule is outside active window.`);
          continue;
        }

        const matchedKeyword = postRule.keywords.find((kw) => text.includes(kw.toLowerCase()));
        if (!matchedKeyword) {
          logger.info(`🛑 No keywords matched in comment.`);
          continue;
        }

        logger.info(`✅ Matched keyword: "${matchedKeyword}"`);

        const dmText = postRule.replyMessage;
        const replyText = postRule.replyComment || postRule.replyMessage;

        // === 🚀 Direct Message Block ===
        if (postRule.isDM && (postRule.maxDMs === null || postRule.sentDMs < postRule.maxDMs)) {
          const recentDM = await DMLog.findOne({
            commenterId,
            mediaId,
            type: "dm",
            sent: true,
            sentAt: { $gte: new Date(now.getTime() - DM_COOLDOWN_MS) },
          });

          if (recentDM) {
            logger.info(`⏳ DM cooldown active. Skipping DM for ${commenterId}`);
          } else {
            try {
              const dmUrl = `https://graph.facebook.com/v23.0/${tokenDoc.facebookUserId}/messages`;
              const dmPayload = {
                recipient: { comment_id: commentId },
                message: { text: dmText },
                messaging_type: "RESPONSE",
              };

              const dmResponse = await axios.post(dmUrl, dmPayload, {
                params: { access_token: tokenDoc.pageLongAccessToken },
                headers: { "Content-Type": "application/json" },
              });

              logger.info(`✅ DM sent: ${dmResponse.data.message_id}`);

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
              const errorMessage = err.response?.data?.error?.message || err.message;
              logger.error(`❌ DM send error: ${errorMessage}`);

              postRule.lastDMErrorAt = now;

              const alreadyNotified = postRule.lastDMErrorNotificationSentAt && now.getTime() - postRule.lastDMErrorNotificationSentAt.getTime() < NOTIFICATION_COOLDOWN_MS;

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

        // === 💬 Comment Reply Block ===
        if (postRule.isReply && (postRule.maxReplies === null || postRule.sentReplies < postRule.maxReplies)) {
          const recentReply = await DMLog.findOne({
            commenterId,
            mediaId,
            type: "reply",
            sent: true,
            sentAt: { $gte: new Date(now.getTime() - REPLY_COOLDOWN_MS) },
          });

          if (recentReply) {
            logger.info(`⏳ Reply cooldown active. Skipping reply for ${commenterId}`);
          } else {
            try {
              const replyUrl = `https://graph.facebook.com/v23.0/${commentId}/replies`;
              const replyPayload = { message: replyText };

              const replyResponse = await axios.post(replyUrl, replyPayload, {
                params: { access_token: tokenDoc.pageLongAccessToken },
                headers: { "Content-Type": "application/json" },
              });

              logger.info(`✅ Reply posted via /replies: ${replyResponse.data.id}`);

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
              const errorMessage = err.response?.data?.error?.message || err.message;
              logger.error(`❌ Reply send error via /replies: ${errorMessage}`);

              postRule.lastReplyErrorAt = now;

              const alreadyNotified = postRule.lastReplyErrorNotificationSentAt && now.getTime() - postRule.lastReplyErrorNotificationSentAt.getTime() < NOTIFICATION_COOLDOWN_MS;

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
  } catch (err) {
    logger.error("❌ Unhandled webhook error:", err.message);
    res.sendStatus(500);
  }
};

module.exports = { getWebhook, postWebhook };
