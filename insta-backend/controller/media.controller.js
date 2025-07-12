const InstagramToken = require("../models/InstagramToken");
const { fetchInstagramMedia, getFullMedia, getAPost } = require("../services/media.services");
const logger = require("../utils/logger");

const getMedia = async (req, res) => {
  try {
    const userId = req.userId;
    const tokenDoc = await InstagramToken.findOne({ userId });

    if (!tokenDoc) {
      return res.status(404).json({ error: "Access token not found" });
    }

    const media = await fetchInstagramMedia(userId, tokenDoc.accessToken);
    res.json({ media });
  } catch (err) {
    logger.error("Failed to fetch Instagram media:", err.message);
    res.status(500).json({ error: "Failed to fetch media" });
  }
};

const getDetailedMedia = async (req, res) => {
  try {
    const userId = req.userId;
    console.log('userId: ', userId);
    const tokenDoc = await InstagramToken.findOne({ userId });
    console.log('tokenDoc: ', tokenDoc);

    if (!tokenDoc) {
      return res.status(404).json({ error: "Access token not found" });
    }

    const media = await getFullMedia(userId, tokenDoc.accessToken);
    console.log('media: ', media);
    res.json({ media });
  } catch (error) {
    console.log('error: ', error);
    logger.error("Failed to fetch Instagram media:", error.message);
    res.status(500).json({ error: "Failed to fetch media" });
  }
};

const getAPostDetails = async (req, res) => {
  const postId = req.params.postId;

  if (!postId) {
    return res.status(400).json({ error: "Post ID is required" });
  }

  try {
    const userId = req.userId;
    const tokenDoc = await InstagramToken.findOne({ userId });

    if (!tokenDoc) {
      return res.status(404).json({ error: "Access token not found" });
    }

    const access_token = tokenDoc.fbLongAccessToken;
    const media = await getAPost(postId, access_token);
    res.json({ media });
  } catch (error) {
    logger.error("Failed to fetch Instagram media:", error.message);
    res.status(500).json({ error: `Failed to fetch media`, error });
  }
};

module.exports = { getMedia, getDetailedMedia, getAPostDetails };
