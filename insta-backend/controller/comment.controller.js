const axios = require("axios");
const InstagramToken = require("../models/InstagramToken");
const logger = require("../utils/logger");
const { FACEBOOK_API_URL } = require("../config/envConfig");

// 1️⃣ Get comments on a media post
const getComments = async (req, res) => {
  const { mediaId } = req.params;
  const userId = req.userId;

  try {
    const tokenDoc = await InstagramToken.findOne({ userId });
    if (!tokenDoc || !tokenDoc.pageLongAccessToken) {
      return res.status(404).json({ error: "Access token not found" });
    }

    const url = `${FACEBOOK_API_URL}/${mediaId}/comments`;

    const response = await axios.get(url, {
      params: {
        access_token: tokenDoc.pageLongAccessToken,
      },
    });

    res.json(response.data);
  } catch (err) {
    console.log("%c Line:27 🍯 err", "color:#93c0a4", err);
    logger.error(`Error getting comments: ${err.message}`);
    res.status(500).json({ message: "Failed to get comments", error: err });
  }
};

// 2️⃣ Reply to a comment
const replyToComment = async (req, res) => {
  const { commentId } = req.params;
  const { message } = req.body;
  const userId = req.userId;

  if (!commentId) {
    return res.status(400).json({ error: "Comment ID is required" });
  }

  if (!message) {
    return res.status(400).json({ error: "Reply message is required" });
  }

  try {
    const tokenDoc = await InstagramToken.findOne({ userId });
    console.log("%c Line:44 🍐 tokenDoc", "color:#3f7cff", tokenDoc);
    if (!tokenDoc || !tokenDoc.pageLongAccessToken) {
      return res.status(404).json({ error: "Access token not found" });
    }

    const url = `${FACEBOOK_API_URL}/${commentId}/replies`;

    const response = await axios.post(
      url,
      { message },
      {
        params: {
          access_token: tokenDoc.pageLongAccessToken,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.json({ message: "Replied successfully", replyId: response.data.id });
  } catch (err) {
    logger.error(`Error replying to comment: ${err.message}`);
    res.status(500).json({ message: "Failed to reply to comment", error: err });
  }
};

module.exports = {
  getComments,
  replyToComment,
};
