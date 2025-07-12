const axios = require("axios");
const { VERIFY_TOKEN } = require("../config/envConfig");
const InstagramToken = require("../models/InstagramToken");
const AutomatedPost = require("../models/AutomatedPost");
const DMLog = require("../models/DMLog");
const logger = require("../utils/logger");

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
  console.log("Received Webhook:", JSON.stringify(req.body, null, 2));
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

      logger.debug(`📩 Incoming comment: "${text}" on mediaId ${mediaId} from user ${commenterId}`);
      logger.debug(`📷 Instagram Account ID (from webhook): ${instagramAccountId}`);

      if (commenterId === instagramAccountId) {
        logger.info("👻 Skipping bot’s own comment to avoid loop.");
        continue;
      }

      // 🔍 Look up token to get internal userId
      const tokenDoc = await InstagramToken.findOne({ instagramAccountId });

      if (!tokenDoc) {
        logger.warn(`⚠️ No InstagramToken found for instagramAccountId: ${instagramAccountId}`);
        continue;
      }

      const userId = tokenDoc.userId;
      logger.debug(`✅ Mapped instagramAccountId ${instagramAccountId} to userId ${userId}`);

      // ✅ Fetch automation rule for this media & user
      const postRule = await AutomatedPost.findOne({
        mediaId,
        userId,
        isEnabled: true,
      });

      logger.debug(`🎯 postRule lookup result: ${postRule ? "FOUND" : "NOT FOUND"}`);
      if (!postRule) {
        logger.info(`No active automation rule found for media ID ${mediaId}`);
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

      // === 🚀 DM Block ===
      if (postRule.isDM && (postRule.maxDMs === null || postRule.sentDMs < postRule.maxDMs)) {
        try {
          const dmUrl = `https://graph.facebook.com/v18.0/${tokenDoc.facebookUserId}/messages`;
          const dmPayload = {
            recipient: { comment_id: commentId },
            message: { text: dmText },
            messaging_type: "RESPONSE",
          };

          const dmResponse = await axios.post(dmUrl, dmPayload, { headers: authHeader });

          logger.info(`✅ DM sent. Message ID: ${dmResponse.data.message_id}`);

          postRule.sentDMs += 1;
          await postRule.save();

          await DMLog.create({
            userId: postRule.userId,
            mediaId,
            commentId,
            commenterId,
            matchedKeyword,
            message: dmText,
            type: "dm",
            automationId: postRule._id,
            sent: true,
            sentAt: new Date(),
            statusCode: 200,
          });
        } catch (err) {
          logger.error(`❌ Failed to send DM: ${err.response?.data?.error?.message || err.message}`);

          await DMLog.create({
            userId: postRule.userId,
            mediaId,
            commentId,
            commenterId,
            matchedKeyword,
            message: dmText,
            type: "dm",
            automationId: postRule._id,
            sent: false,
            error: err.response?.data?.error?.message || err.message,
            statusCode: err.response?.status || 500,
          });
        }
      }

      // === 🚀 Reply Block ===
      if (postRule.isReply && (postRule.maxReplies === null || postRule.sentReplies < postRule.maxReplies)) {
        try {
          const replyUrl = `https://graph.facebook.com/v18.0/${commentId}/replies`;
          const replyPayload = { message: replyText };

          const replyResponse = await axios.post(replyUrl, replyPayload, { headers: authHeader });

          logger.info(`✅ Comment reply sent. Reply ID: ${replyResponse.data.id}`);

          postRule.sentReplies += 1;
          await postRule.save();

          await DMLog.create({
            userId: postRule.userId,
            mediaId,
            commentId,
            commenterId,
            matchedKeyword,
            message: replyText,
            type: "reply",
            automationId: postRule._id,
            sent: true,
            sentAt: new Date(),
            statusCode: 200,
          });
        } catch (err) {
          logger.error(`❌ Failed to send reply: ${err.response?.data?.error?.message || err.message}`);

          await DMLog.create({
            userId: postRule.userId,
            mediaId,
            commentId,
            commenterId,
            matchedKeyword,
            message: replyText,
            type: "reply",
            automationId: postRule._id,
            sent: false,
            error: err.response?.data?.error?.message || err.message,
            statusCode: err.response?.status || 500,
          });
        }
      }
    }
  }

  res.sendStatus(200);
};

module.exports = { getWebhook, postWebhook };


// const { default: axios } = require("axios");
// const { VERIFY_TOKEN, FACEBOOK_API_URL } = require("../config/envConfig");
// const InstagramToken = require("../models/InstagramToken");
// const logger = require("../utils/logger");

// const getWebhook = (req, res) => {
//   const mode = req.query["hub.mode"];
//   const token = req.query["hub.verify_token"];
//   const challenge = req.query["hub.challenge"];

//   if (mode && token && mode === "subscribe" && token === VERIFY_TOKEN) {
//     logger.info("WEBHOOK_VERIFIED");
//     res.status(200).send(challenge);
//   } else {
//     res.sendStatus(403);
//   }
// };
// const keywords = ["dm me", "text"];
// const monitoredMediaId = "18094308574617939";

// const isReply = true; // 📝 toggle this to enable comment reply
// const isDM = true; // 💬 toggle this to enable auto DM

// const postWebhook = async (req, res) => {
//   logger.info("Received Webhook:", JSON.stringify(req.body, null, 2));

//   const entries = req.body.entry || [];

//   for (const entry of entries) {
//     const changes = entry?.changes || [];

//     for (const change of changes) {
//       const comment = change?.value;
//       const field = change?.field;

//       if (field !== "comments" || !comment?.media?.id || !comment?.text) continue;

//       const mediaId = comment.media.id;
//       const text = comment.text.toLowerCase();
//       const commentId = comment.id;
//       const commenterId = comment.from?.id;
//       const instagramAccountId = entry.id;

//       // 🛑 Prevent loop: ignore own bot's comments
//       if (commenterId === instagramAccountId) {
//         logger.info("👻 Skipping bot’s own comment to avoid loop.");
//         continue;
//       }

//       logger.info(`New comment: ${text}`);

//       if (mediaId !== monitoredMediaId) continue;

//       const matchedKeyword = keywords.find((kw) => text.includes(kw));
//       if (!matchedKeyword) {
//         logger.info(`No keywords matched for comment: "${text}"`);
//         continue;
//       }

//       logger.info(`Matched keyword "${matchedKeyword}" in comment "${text}"`);

//       try {
//         const tokenDoc = await InstagramToken.findOne({ instagramAccountId });
//         if (!tokenDoc || !tokenDoc.pageLongAccessToken || !tokenDoc.facebookUserId) {
//           logger.warn(`No valid token found for IG Account ID: ${instagramAccountId}`);
//           continue;
//         }

//         const messageText = `Hi there! 👋 Thanks for mentioning "${matchedKeyword}"! How can I help?`;

//         // ✅ Send DM
//         if (isDM) {
//           const dmUrl = `https://graph.facebook.com/v18.0/${tokenDoc.facebookUserId}/messages`;
//           const dmPayload = {
//             recipient: { comment_id: commentId },
//             message: { text: messageText },
//             messaging_type: "RESPONSE",
//           };

//           const dmResponse = await axios.post(dmUrl, dmPayload, {
//             headers: {
//               Authorization: `Bearer ${tokenDoc.pageLongAccessToken}`,
//               "Content-Type": "application/json",
//             },
//           });

//           logger.info(`✅ DM sent. Message ID: ${dmResponse.data.message_id}`);
//         }

//         // ✅ Send public reply to the comment
//         if (isReply) {
//           const replyUrl = `https://graph.facebook.com/v18.0/${commentId}/replies`;
//           const replyPayload = { message: messageText };

//           const replyResponse = await axios.post(replyUrl, replyPayload, {
//             headers: {
//               Authorization: `Bearer ${tokenDoc.pageLongAccessToken}`,
//               "Content-Type": "application/json",
//             },
//           });

//           logger.info(`✅ Comment reply sent. Reply ID: ${replyResponse.data.id}`);
//         }
//       } catch (err) {
//         logger.error(`❌ Failed to send reply/DM: ${err.response?.data?.error?.message || err.message}`);
//       }
//     }
//   }

//   res.sendStatus(200);
// };

// module.exports = { getWebhook, postWebhook };
