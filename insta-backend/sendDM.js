const axios = require("axios");

// Replace with actual values
const PAGE_ID = "669951746208684";
const ACCESS_TOKEN =
  "EAASSN7ZBikEkBPAT0dylWYeCcStaRipabijJCEdwgcNuIWEt0HVaz5c6dAcKO3sQm9qQ3bQWxxYLO9m73YI5wodMxmN3uiiTcbQ2dmilbkdOoWhXdPNywEpQU1EOi9fb7iU0AtW0eSbfSAip4CVfWTBNxmd2SNupNCFtYt5t9TYZAasyIE2xJZAV9115vzdgZACRZBMNEKnevCKKa8BghZAAihLQbs2Y1tbOXHj8Dyb9YZD";
const COMMENT_ID = "REPLACE_WITH_COMMENT_ID";

async function sendInstagramDM(commentId, messageText) {
  const url = `https://graph.facebook.com/v18.0/${PAGE_ID}/messages`;

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
    console.error("❌ Failed to send message:", error.response?.data || error.message);
  }
}
  // sendInstagramDM("18055218875594530", "🎉 Thanks for commenting! Let me know if you have any questions.");

module.exports = { sendInstagramDM };
