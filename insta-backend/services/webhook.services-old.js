const axios = require("axios");
const { VERIFY_TOKEN, RECEIVING_EMAILID } = require("../config/envConfig");
const InstagramToken = require("../models/InstagramToken");
const AutomatedPost = require("../models/AutomatedPost");
const DMLog = require("../models/DMLog");
const logger = require("../utils/logger");
const { sendDMError, sendReplyError, sendEmail } = require("./email.service");

const DM_COOLDOWN_MS = 60 * 60 * 1000;
const REPLY_COOLDOWN_MS = 30 * 60 * 1000;
const MAX_REPLY_BACKOFF_ATTEMPTS = 5;

// Helper: check if the IG conversation is active (un-archived)
async function isConversationActive(fbUserId, commentId, token) {
  const url = `https://graph.facebook.com/v23.0/${fbUserId}/conversations`;
  const res = await axios.get(url, {
    params: { recipient_comment_id: commentId },
    headers: { Authorization: `Bearer ${token}` },
  });
  return Array.isArray(res.data.data) && res.data.data.length > 0;
}

// Helper: send comment with exponential backoff on rate-limit subcode 368
async function sendReplyWithBackoff(mediaId, payload, headers, attempt = 1) {
  try {
    return await axios.post(`https://graph.facebook.com/v23.0/${mediaId}/comments`, payload, { headers });
  } catch (err) {
    const error = err.response?.data?.error;
    const isRateLimit = error && error.error_subcode === 368;
    if (isRateLimit && attempt < MAX_REPLY_BACKOFF_ATTEMPTS) {
      const backoffMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s...
      logger.warn(`⚠️ Rate limit hit, retrying reply in ${backoffMs}ms (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, backoffMs));
      return sendReplyWithBackoff(mediaId, payload, headers, attempt + 1);
    }
    throw err;
  }
}

const getWebhook = (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WEBHOOK_VERIFIED");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
};

const postWebhook = async (req, res) => {
  console.log("Received Webhook:", JSON.stringify(req.body, null, 2));
  const entries = req.body.entry || [];

  for (const entry of entries) {
    const changes = entry.changes || [];

    for (const change of changes) {
      const comment = change.value;
      const field = change.field;
      if (field !== "comments" || !comment.media?.id || !comment.text) continue;

      const mediaId = comment.media.id;
      const text = comment.text.toLowerCase();
      const commentId = comment.id;
      const commenterId = comment.from?.id;
      const instagramAccountId = entry.id;
      const now = new Date();

      console.log(`📩 Incoming comment: "${text}" on mediaId ${mediaId} from user ${commenterId}`);
      console.log(`📷 Instagram Account ID (from webhook): ${instagramAccountId}`);

      // Skip the bot’s own comments
      if (commenterId === instagramAccountId) {
        console.log("👻 Skipping bot’s own comment to avoid loop.");
        continue;
      }

      // Load tokens & rules
      const tokenDoc = await InstagramToken.findOne({ instagramAccountId });
      if (!tokenDoc) {
        logger.warn(`⚠️ No InstagramToken found for instagramAccountId: ${instagramAccountId}`);
        continue;
      }
      const userId = tokenDoc.userId;
      console.log(`✅ Mapped instagramAccountId ${instagramAccountId} to userId ${userId}`);

      const postRule = await AutomatedPost.findOne({ mediaId, userId, isEnabled: true });
      console.log(`🎯 postRule lookup result: ${postRule ? "FOUND" : "NOT FOUND"}`);
      if (!postRule) {
        console.log(`No active automation rule found for media ID ${mediaId}`);
        continue;
      }
      // Date window check
      if ((postRule.startDate && now < postRule.startDate) || (postRule.endDate && now > postRule.endDate)) {
        console.log(`⏰ Automation rule not active (outside start/end window). Skipping.`);
        continue;
      }
      // Keyword match
      const matchedKeyword = postRule.keywords.find((kw) => text.includes(kw.toLowerCase()));
      if (!matchedKeyword) {
        console.log(`🛑 No keywords matched for comment: "${text}"`);
        continue;
      }
      console.log(`✅ Matched keyword "${matchedKeyword}" in comment "${text}"`);

      const dmText = postRule.replyMessage;
      const replyText = postRule.replyComment || postRule.replyMessage;
      const authHeader = {
        Authorization: `Bearer ${tokenDoc.pageLongAccessToken}`,
        "Content-Type": "application/json",
      };

      // === 🚀 DM Block with Conversation Check + Cooldown ===
      if (postRule.isDM && (postRule.maxDMs === null || postRule.sentDMs < postRule.maxDMs)) {
        const recentDM = await DMLog.findOne({
          commenterId,
          mediaId,
          type: "dm",
          sent: true,
          sentAt: { $gte: new Date(now.getTime() - DM_COOLDOWN_MS) },
        });
        if (recentDM) {
          console.log(`⏳ DM cooldown active. Skipping DM for commenter ${commenterId}`);
        } else {
          try {
            // 1) Check thread state
            const active = await isConversationActive(tokenDoc.facebookUserId, commentId, tokenDoc.pageLongAccessToken);
            if (!active) {
              logger.warn(`🗂️ Thread archived/missing; skipping DM to ${commenterId}`);
              // optional: fallback comment or alert
            } else {
              // 2) Send DM
              const dmUrl = `https://graph.facebook.com/v23.0/${tokenDoc.facebookUserId}/messages`;
              const dmPayload = {
                recipient: { comment_id: commentId },
                message: { text: dmText },  
                messaging_type: "RESPONSE",
              };
              const dmResponse = await axios.post(dmUrl, dmPayload, { headers: authHeader });
              console.log(`✅ DM sent. Message ID: ${dmResponse.data.message_id}`);

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
            }
          } catch (err) {
            const errorMessage = err.response?.data?.error?.message || err.message;
            logger.error(`❌ Failed to send DM: ${errorMessage}`);

            postRule.lastDMErrorAt = now;
            const alreadyNotified = postRule.lastDMErrorNotificationSentAt && postRule.lastDMErrorNotificationSentAt.getTime() === now.getTime();
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

      // === 💬 Reply Block with Cooldown + Backoff ===
      if (postRule.isReply && (postRule.maxReplies === null || postRule.sentReplies < postRule.maxReplies)) {
        const recentReply = await DMLog.findOne({
          commenterId,
          mediaId,
          type: "reply",
          sent: true,
          sentAt: { $gte: new Date(now.getTime() - REPLY_COOLDOWN_MS) },
        });
        if (recentReply) {
          console.log(`⏳ Reply cooldown active. Skipping reply for commenter ${commenterId}`);
        } else {
          try {
            const commentPayload = { message: replyText };
            const commentResponse = await sendReplyWithBackoff(mediaId, commentPayload, authHeader);
            console.log(`✅ Reply sent. Comment ID: ${commentResponse.data.id}`);

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
            logger.error(`❌ Failed to send reply: ${errorMessage}`);

            postRule.lastReplyErrorAt = now;
            const alreadyNotified = postRule.lastReplyErrorNotificationSentAt && postRule.lastReplyErrorNotificationSentAt.getTime() === now.getTime();
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
