const axios = require("axios");

const commentId = "17954030561987233";
// FB_TOKEN
const accessToken =
  "EAAJZBumxZBLCcBPAklvV321VdwmMWwNP4UXRlbWuEd3EjOehOcYm497D0Px8eNLvMwoZCvEWnUGVOojCPhWvEm93DG5m3pyxeJ1WCYzyymWwRA5ZBBCtDH3RwcS7DTjlKzknfqjxwOg7oXO00xMtQwnZCphlRHp6rEVe8gONKzQjcl2hE4HznZCxgDLW2qTeuszM6aqquSpxOy"; // Your actual token

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
