const { default: axios } = require("axios");
const { INSTAGRAM_APP_ID, INSTAGRAM_REDIRECT_URI, INSTAGRAM_APP_SECRET, FRONTEND_URL } = require("../config/envConfig");
const qs = require("querystring");
const { getInstagramProfile, saveInstagramToken } = require("../services/auth.services");
const { generateToken } = require("../utils/jwt");
const InstagramToken = require("../models/InstagramToken");
const logger = require("../utils/logger");

const login = (req, res) => {
  const clientId = INSTAGRAM_APP_ID;
  console.log("%c Line:11 🍧 INSTAGRAM_APP_ID", "color:#ed9ec7", INSTAGRAM_APP_ID);
  const redirectUri = INSTAGRAM_REDIRECT_URI;
  console.log("%c Line:14 🥛 redirectUri", "color:#3f7cff", redirectUri);
  const scopes = ["instagram_business_basic", "instagram_business_manage_messages", "instagram_business_manage_comments", "instagram_business_content_publish"];
  const authUrl = `https://www.instagram.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join(",")}&response_type=code`;
  res.redirect(authUrl);
};

const getInstaToken = async (req, res) => {
  const { code } = req.query;
  console.log("%c Line:22 🍎 code", "color:#fca650", code);
  console.log("%c Line:33 🍿 INSTAGRAM_REDIRECT_URI", "color:#f5ce50", INSTAGRAM_REDIRECT_URI);

  try {
    // Step 1: Exchange code for short-lived token
    const tokenRes = await axios.post(
      "https://api.instagram.com/oauth/access_token",
      qs.stringify({
        client_id: INSTAGRAM_APP_ID,
        client_secret: INSTAGRAM_APP_SECRET,
        grant_type: "authorization_code",
        redirect_uri: INSTAGRAM_REDIRECT_URI,
        code,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const { access_token, user_id } = tokenRes.data;
    logger.info(`Access Token: ${access_token}`);
    logger.info(`User ID: ${user_id}`);

    // Step 2: Exchange for long-lived token
    const longTokenRes = await axios.get("https://graph.instagram.com/access_token", {
      params: {
        grant_type: "ig_exchange_token",
        client_secret: INSTAGRAM_APP_SECRET,
        access_token,
      },
    });

    const { access_token: longToken, expires_in } = longTokenRes.data;

    // Step 3: Get user profile
    const profile = await getInstagramProfile(longToken);

    // Step 4: Store in DB
    const savedToken = await saveInstagramToken({
      userId: profile.id,
      accessToken: longToken,
      tokenType: "bearer",
      expiresIn: expires_in,
    });

    logger.info(`Saved Token: ${savedToken}`);

    // Step 5: Generate session JWT
    const jwtToken = generateToken(profile.id);

    const frontendURL = FRONTEND_URL;
    res.redirect(`${frontendURL}?token=${jwtToken}`);
  } catch (err) {
    console.log(err);
    logger.error(`Error logging in: ${err.response?.data || err.message}`);
    res.status(500).json({ error: "OAuth login failed" });
  }
};

const getProfile = async (req, res) => {
  try {
    const tokenDoc = await InstagramToken.findOne({ userId: req.userId });
    if (!tokenDoc) return res.status(404).json({ error: "Token not found" });

    const profile = await getInstagramProfile(tokenDoc.accessToken);
    res.json(profile);
  } catch (err) {
    console.log(err);
    logger.error(`Error fetching profile: ${err.response?.data || err.message}`);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

module.exports = {
  login,
  getInstaToken,
  getProfile,
};
