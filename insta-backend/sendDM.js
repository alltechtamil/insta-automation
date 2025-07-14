const axios = require("axios");
// PAGE_TOKEN
const FACEBOOK_USER_ID = "727815197077880";
const ACCESS_TOKEN = "EAAJZBumxZBLCcBPMGgUdNBEZCECddPwbnDSoM5a0szB1WRDmPbRurCNnDHpv2uAj1DgK9vy88hjWa6xaVMO5DpFV7BZB59HupHknqfvDYnU6dq3ZBi0IGLcwCcyNqtNX1MuaZBZA8y9pFhPk4j0MSDFT6DfHxXyzVYpYL4ZAL4K4xMWbj1HdcxfpZCf19WhZCOFg8B3R5yr7JuRDXOkCY2TnhK";

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
    console.log("%c Line:30 🍿 error", "color:#e41a6a", error);
    const errData = error.response?.data || error.message;
    console.error("❌ Failed to send message:", errData);
  }
}

// sendInstagramDM("COMMENT_ID_HERE", "🎉 Thanks for commenting! Let me know if you have any questions.");

module.exports = { sendInstagramDM };
