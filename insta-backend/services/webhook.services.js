const axios = require("axios");
const { VERIFY_TOKEN } = require("../config/envConfig");
const InstagramToken = require("../models/InstagramToken");
const AutomatedPost = require("../models/AutomatedPost");
const DMLog = require("../models/DMLog");
const logger = require("../utils/logger");
const { sendAutomationPausedNotification } = require("./email.service");
const SystemSetting = require("../models/SystemSetting");

const DM_COOLDOWN_MS = 60 * 60 * 1000;
const REPLY_COOLDOWN_MS = 30 * 60 * 1000;
const MIN_DELAY_MS = 5000; // 5 seconds
const MAX_DELAY_MS = 30000; // 30 seconds

const actionQueue = [];
let isProcessingQueue = false;

const processQueue = async () => {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (actionQueue.length > 0) {
    const queuedAction = actionQueue.shift();
    const delay = Math.floor(Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS + 1)) + MIN_DELAY_MS;

    try {
      await new Promise((resolve) => setTimeout(resolve, delay));
      await queuedAction();
    } catch (err) {
      logger.error("❌ Error processing queued action:", err);
    }
  }

  isProcessingQueue = false;
};

// Helper function to send DM with error handling
const sendDirectMessage = async (data) => {
  const { tokenDoc, commentId, dmText, postRule, userId, mediaId, commenterId, matchedKeyword } = data;
  const now = new Date(); // Use actual send time

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
    postRule.pausedUntil = null;
    postRule.lastViolationMessage = null;
    postRule.pauseNotificationSentAt = null;
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
    const status = err.response?.status;
    logger.error(`❌ DM send error: ${errorMessage}`);

    postRule.lastDMErrorAt = now;

    // Pause automation on violation
    if ([429, 10].includes(status)) {
      const cooldownSetting = await SystemSetting.findOne({ key: "violationCooldownMinutes" });
      const VIOLATION_COOLDOWN_MS = (cooldownSetting?.value || 30) * 60 * 1000;

      postRule.pausedUntil = new Date(now.getTime() + VIOLATION_COOLDOWN_MS);
      postRule.lastViolationMessage = errorMessage;

      if (!postRule.pauseNotificationSentAt || new Date(now) - new Date(postRule.pauseNotificationSentAt) > NOTIFICATION_COOLDOWN_MS) {
        await sendAutomationPausedNotification(postRule, errorMessage);
        postRule.pauseNotificationSentAt = now;
      }

      logger.warn(`⏸ Automation ${postRule._id} paused for violation: ${errorMessage}`);
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
      statusCode: status || 500,
    });
  }
};

// Helper function to send reply with error handling
const sendReply = async (data) => {
  const { tokenDoc, commentId, replyText, postRule, userId, mediaId, commenterId, matchedKeyword } = data;
  const now = new Date();

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
    postRule.pausedUntil = null;
    postRule.lastViolationMessage = null;
    postRule.pauseNotificationSentAt = null;
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
    const status = err.response?.status;
    logger.error(`❌ Reply send error: ${errorMessage}`);

    postRule.lastReplyErrorAt = now;

    if ([429, 10].includes(status)) {
      const cooldownSetting = await SystemSetting.findOne({ key: "violationCooldownMinutes" });
      const VIOLATION_COOLDOWN_MS = (cooldownSetting?.value || 30) * 60 * 1000;

      postRule.pausedUntil = new Date(now.getTime() + VIOLATION_COOLDOWN_MS);
      postRule.lastViolationMessage = errorMessage;

      if (!postRule.pauseNotificationSentAt || new Date(now) - new Date(postRule.pauseNotificationSentAt) > NOTIFICATION_COOLDOWN_MS) {
        await sendAutomationPausedNotification(postRule, errorMessage);
        postRule.pauseNotificationSentAt = now;
      }

      logger.warn(`⏸ Automation ${postRule._id} paused for violation: ${errorMessage}`);
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
      statusCode: status || 500,
    });
  }
};

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

        if (commenterId === instagramAccountId) {
          logger.info("👻 Skipping bot's own comment.");
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

        // Check active dates
        if ((postRule.startDate && now < postRule.startDate) || (postRule.endDate && now > postRule.endDate)) {
          logger.info(`⏰ Rule is outside active window.`);
          continue;
        }

        // Check if automation is paused
        if (postRule.pausedUntil && now < postRule.pausedUntil) {
          logger.info(`🛑 Automation paused until ${postRule.pausedUntil}. Skipping.`);
          continue;
        }

        // Find matching keyword (case-insensitive)
        const matchedKeyword = postRule.keywords.find((kw) => text.includes(kw.toLowerCase()));
        if (!matchedKeyword) {
          logger.info(`🛑 No keywords matched in comment.`);
          continue;
        }

        logger.info(`✅ Matched keyword: "${matchedKeyword}"`);

        const dmText = postRule.replyMessage;
        const replyText = postRule.replyComment || postRule.replyMessage;

        // ===== Direct Message Handling =====
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
            actionQueue.push(() =>
              sendDirectMessage({
                tokenDoc,
                commentId,
                dmText,
                postRule,
                userId,
                mediaId,
                commenterId,
                matchedKeyword,
              })
            );
          }
        }

        // ===== Comment Reply Handling =====
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
            actionQueue.push(() =>
              sendReply({
                tokenDoc,
                commentId,
                replyText,
                postRule,
                userId,
                mediaId,
                commenterId,
                matchedKeyword,
              })
            );
          }
        }
      }
    }

    // Process queue in background
    if (actionQueue.length > 0 && !isProcessingQueue) {
      processQueue().catch((err) => logger.error("Queue processing error:", err));
    }

    res.sendStatus(200);
  } catch (err) {
    logger.error("❌ Unhandled webhook error:", err.message);
    res.sendStatus(500);
  }
};

module.exports = { getWebhook, postWebhook };
