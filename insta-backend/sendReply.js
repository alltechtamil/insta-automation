// sendReply.js — for Instagram
const axios = require("axios");

/**
 * Posts a new comment on a media item (Instagram only supports top-level comments)
 *
 * @param {string} mediaId - The ID of the media item (reel/photo/etc)
 * @param {string} message - The reply message
 * @param {string} igAccessToken - The Instagram account's long-lived access token
 */
async function sendReply(mediaId, message, igAccessToken) {
  const url = `https://graph.facebook.com/v18.0/${mediaId}/comments`;

  try {
    const response = await axios.post(
      url,
      { message },
      {
        headers: {
          Authorization: `Bearer ${igAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("✅ Comment sent:", response.data);
    return response.data;
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error("❌ Failed to send comment:", errData);
    throw errData;
  }
}

module.exports = sendReply;
