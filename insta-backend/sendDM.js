const axios = require("axios");

// Replace with your actual Facebook User ID and Access Token
const FACEBOOK_USER_ID = "727815197077880";
const ACCESS_TOKEN = "IGAAUhjGeO1FhBZAE9keFZANcTRhNDdhUG5oTUpiOG9UbnJoWDV3ZA2xqcWE2S214VW91NWRpUmxVTzBlMnZArYXY0alJ4akRHQkY0MnRZAVk1OZA3JiUVlKblp3U1psOS1zWll6SlBMa2Yta0ZAuYzF0cUFpMnNn";

async function sendInstagramDM(commentId, messageText) {
  const url = `https://graph.facebook.com/v18.0/${FACEBOOK_USER_ID}/messages`;

  const payload = {
    recipient: {
      comment_id: commentId,
    },
    message: {
      text: messageText,
    },
    messaging_type: "RESPONSE",
  };

  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ACCESS_TOKEN}`,
      },
    });

    console.log("✅ Message sent successfully:", response.data);
  } catch (error) {
    const errData = error.response?.data || error.message;
    console.error("❌ Failed to send message:", errData);
  }
}

// sendInstagramDM("COMMENT_ID_HERE", "🎉 Thanks for commenting! Let me know if you have any questions.");

module.exports = { sendInstagramDM };
