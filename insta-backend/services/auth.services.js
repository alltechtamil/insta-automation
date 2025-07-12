const axios = require("axios");
const InstagramToken = require("../models/InstagramToken");
const logger = require("../utils/logger");

async function saveInstagramToken({ userId, accessToken, tokenType, expiresIn }) {
  console.log("%c Line:6 🍓 expiresIn", "color:#465975", expiresIn);
  console.log("%c Line:6 🍞 tokenType", "color:#42b983", tokenType);
  console.log("%c Line:6 🥟 accessToken", "color:#ed9ec7", accessToken);
  console.log("%c Line:6 🍌 userId", "color:#4fff4B", userId);
  const tokenData = {
    userId,
    accessToken,
    tokenType,
    expiresIn,
  };

  try {
    const existing = await InstagramToken.findOne({ userId });
    logger.debug(`Saving Instagram Token: ${JSON.stringify(tokenData, null, 2)}`);

    if (existing) {
      existing.accessToken = accessToken;
      existing.tokenType = tokenType;
      existing.expiresIn = expiresIn;
      await existing.save();
      return existing;
    } else {
      const newToken = new InstagramToken(tokenData);
      await newToken.save();
      return newToken;
    }
  } catch (error) {
    console.error("Error saving Instagram Token:", error);
    logger.error(`Error saving Instagram Token: ${error.message}`);
    throw error;
  }
}

async function getInstagramProfile(accessToken) {
  try {
    const response = await axios.get("https://graph.instagram.com/me", {
      params: {
        fields: "id,username,name,user_id,account_type,profile_picture_url,followers_count,follows_count,media_count",
        access_token: accessToken,
      },
    });

    logger.debug(`Fetched Instagram Profile: ${JSON.stringify(response.data, null, 2)}`);

    return response.data;
  } catch (error) {
    console.error("Error fetching Instagram profile:", error.response?.data || error.message);
    logger.error(`Error fetching Instagram profile: ${error.response?.data || error.message}`);
    throw error;
  }
}

module.exports = { saveInstagramToken, getInstagramProfile };
