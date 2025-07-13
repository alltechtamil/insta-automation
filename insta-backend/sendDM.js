const axios = require("axios");

// Replace with actual values
const PAGE_ID = "727815197077880";
const ACCESS_TOKEN =
  "EAAJZBumxZBLCcBPF42w3lZC5bq4sgnG0ItQaVKl0SZCZCfKPeYEV08ouAwuucjWiMtwYYVvpUTUvJUhbFYs3ICeKYLboMF6iCaj8pfxc9KKeCx4wsJ2UBObBZBD1AVZCMwinquGRW8T2YqgxMz7ySEU844vv9hGIEeAruYcOnvJxX4uZCg91Op9nMtb0Pz5Qztl6kZCKjAPyeq3AuE9L03r5ZCP41X";
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
