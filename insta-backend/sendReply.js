const axios = require("axios");

const commentId = "18105426286482122";
const accessToken =
  "EAAJZBumxZBLCcBPO6OrVcRZCW5AZCrSpFw7dlJemItvabwVQPMevZCPmxD6upSQadx9qwx0eNv6nUIDKiUd91SPKsLiZBwU0xrmfZBQ3UKyA0OrBKavsn628MFxZAu3y4TfIp7ChfFdGf7uI0toA2UByTmdPVhbe7z2rKvpWSOqvPAGzZBdrJ7AsSE72f59TNwbqqToiq5hCvxHmyyZAntaKWaPmfJ"; // Your actual token

const sendReply = async () => {
  axios
    .post(
      `https://graph.facebook.com/v23.0/${commentId}/replies`,
      {
        message: "Thanks for your comment! 🔥",
      },
      {
        params: {
          access_token: accessToken,
        },
        headers: {
          "Content-Type": "application/json",
        },
      }
    )
    .then((response) => {
      console.log("✅ Replied successfully:", response.data);
    })
    .catch((error) => {
      console.error("❌ Error replying:", error.response?.data || error.message);
    });
};

module.exports = sendReply;
