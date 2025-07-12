const axios = require("axios");
const InstagramToken = require("../models/InstagramToken");
const logger = require("../utils/logger");
const { FACEBOOK_API_URL } = require("../config/envConfig");

const sendPrivateReply = async (req, res) => {
  const { commentId, message } = req.body;
  console.log("req.body: ", req.body);
  const userId = req.userId;
  console.log("userId: ", userId);

  if (!commentId || !message) {
    return res.status(400).json({ error: "commentId and message are required" });
  }

  try {
    const tokenDoc = await InstagramToken.findOne({ userId });
    console.log("tokenDoc: ", tokenDoc);

    if (!tokenDoc || !tokenDoc.pageLongAccessToken || !tokenDoc.facebookUserId) {
      return res.status(404).json({ error: "Access token or user ID not found" });
    }

    const url = `${FACEBOOK_API_URL}/${tokenDoc.facebookUserId}/messages`;

    const response = await axios.post(
      url,
      {
        recipient: { comment_id: commentId },
        message: { text: message },
      },
      {
        headers: {
          Authorization: `Bearer ${tokenDoc.pageLongAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      message: "Private reply sent successfully",
      recipientId: response.data.recipient_id,
      messageId: response.data.message_id,
    });
  } catch (err) {
    logger.error(`Error sending private reply: ${err.message}`);
    console.error(err);
    res.status(500).json({ error: "Failed to send private reply" });
  }
};

module.exports = { sendPrivateReply };
