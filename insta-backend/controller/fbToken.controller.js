const InstagramToken = require("../models/InstagramToken");
const logger = require("../utils/logger");

const upsertFacebookFields = async (req, res) => {
  const { facebookUserId, fbLongAccessToken, pageLongAccessToken, instagramAccountId } = req.body;
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Missing userId" });
  }

  try {
    const updated = await InstagramToken.findOneAndUpdate(
      { userId },
      {
        $set: {
          facebookUserId,
          fbLongAccessToken,
          pageLongAccessToken,
          instagramAccountId,
        },
      },
      { new: true, upsert: false }
    );

    if (!updated) {
      return res.status(404).json({ error: "InstagramToken not found for this user" });
    }

    logger.info(`Updated Facebook fields for userId: ${userId}`);
    res.json(updated);
  } catch (err) {
    logger.error(`Error updating Facebook fields: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getFacebookFields = async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Missing userId" });
  }
  try {
    const tokenDoc = await InstagramToken.findOne({ userId });

    if (!tokenDoc) {
      return res.status(404).json({ error: "No token found for this userId" });
    }

    const { facebookUserId, fbLongAccessToken, pageLongAccessToken, instagramAccountId } = tokenDoc;
    res.json({ tokenDoc, facebookUserId, fbLongAccessToken, pageLongAccessToken, instagramAccountId });
  } catch (err) {
    logger.error(`Error fetching Facebook fields: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

const deleteFacebookFields = async (req, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Missing userId" });
  }

  try {
    const updated = await InstagramToken.findOneAndUpdate(
      { userId },
      {
        $unset: {
          facebookUserId: "",
          fbLongAccessToken: "",
          pageLongAccessToken: "",
        },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: "No token found for this userId" });
    }

    res.json({ message: "Facebook fields removed", data: updated });
  } catch (err) {
    logger.error(`Error deleting Facebook fields: ${err.message}`);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  upsertFacebookFields,
  getFacebookFields,
  deleteFacebookFields,
};
