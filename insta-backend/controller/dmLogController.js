const DMLog = require("../models/DMLog");

const logDMAction = async ({
  userId,
  mediaId,
  mediaPermalink = null,
  commentId,
  commenterId,
  matchedKeyword,
  message,
  type, // "dm" or "reply"
  automationId = null,
  sent = false,
  sentAt = null,
  error = null,
  statusCode = null,
}) => {
  try {
    const log = await DMLog.create({
      userId,
      mediaId,
      mediaPermalink,
      commentId,
      commenterId,
      matchedKeyword,
      message,
      type,
      automationId,
      sent,
      sentAt,
      error,
      statusCode,
    });

    return log;
  } catch (err) {
    console.error("❌ Failed to log DM action:", err.message);
    return null;
  }
};

const getDMLogs = async (req, res) => {
  try {
    const query = {};

    if (req.query.userId) query.userId = req.query.userId;
    if (req.query.mediaId) query.mediaId = req.query.mediaId;
    if (req.query.type) query.type = req.query.type; // "dm" or "reply"

    const logs = await DMLog.find(query).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
};

const getDMLogById = async (req, res) => {
  try {
    const log = await DMLog.findById(req.params.id);
    if (!log) return res.status(404).json({ error: "Log not found." });
    res.json(log);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch log." });
  }
};

const deleteDMLog = async (req, res) => {
  try {
    const deleted = await DMLog.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Log not found." });
    res.json({ message: "Log deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete log." });
  }
};

module.exports = {
  logDMAction,
  getDMLogs,
  getDMLogById,
  deleteDMLog,
};
