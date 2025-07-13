const AutomatedPost = require("../models/AutomatedPost");
const DMLog = require("../models/DMLog");
const mongoose = require("mongoose");

const getDashboardStats = async (req, res) => {
  try {
    const userId = req.userId;

    // --- 1. Get Automation Totals ---
    const [automations, dmLogs] = await Promise.all([AutomatedPost.find({ userId }), DMLog.find({ userId })]);

    const totalAutomations = automations.length;
    const activeAutomations = automations.filter((a) => a.isEnabled).length;
    const inactiveAutomations = totalAutomations - activeAutomations;

    const totalDMsSent = automations.reduce((sum, a) => sum + (a.sentDMs || 0), 0);
    const totalRepliesSent = automations.reduce((sum, a) => sum + (a.sentReplies || 0), 0);

    // --- 2. DMLog Aggregations ---
    let successfulLogs = 0;
    let failedLogs = 0;
    let typeCount = { dm: 0, reply: 0 };

    for (const log of dmLogs) {
      if (log.sent) successfulLogs++;
      else failedLogs++;

      if (log.type === "dm") typeCount.dm++;
      else if (log.type === "reply") typeCount.reply++;
    }

    // --- 3. Group by Automation ---
    const automationMap = {};
    for (const log of dmLogs) {
      const id = log.automationId?.toString();
      if (!id) continue;

      if (!automationMap[id]) {
        automationMap[id] = {
          automationId: id,
          sentDMs: 0,
          sentReplies: 0,
          success: 0,
          fails: 0,
        };
      }

      if (log.sent) automationMap[id].success++;
      else automationMap[id].fails++;

      if (log.type === "dm") automationMap[id].sentDMs++;
      else if (log.type === "reply") automationMap[id].sentReplies++;
    }

    // Join captions to automationMap
    const automationStats = automations.map((a) => {
      const data = automationMap[a._id.toString()] || {
        sentDMs: 0,
        sentReplies: 0,
        success: 0,
        fails: 0,
      };
      return {
        automationId: a._id,
        caption: a.postCaption,
        ...data,
      };
    });

    // --- 4. Time Trend Stats (Last 7 days) ---
    const start = new Date();
    start.setDate(start.getDate() - 6); // last 7 days

    const dailyLogs = await DMLog.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            type: "$type",
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // format daily stats
    const dateMap = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dateMap[key] = { date: key, sentDMs: 0, sentReplies: 0 };
    }

    for (const entry of dailyLogs) {
      const dateKey = entry._id.day;
      if (!dateMap[dateKey]) continue;
      if (entry._id.type === "dm") dateMap[dateKey].sentDMs = entry.count;
      if (entry._id.type === "reply") dateMap[dateKey].sentReplies = entry.count;
    }

    const dailyStats = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

    // --- Final Response ---
    res.json({
      summary: {
        totalAutomations,
        activeAutomations,
        inactiveAutomations,
        totalDMsSent,
        totalRepliesSent,
      },
      dmLogs: {
        total: dmLogs.length,
        successful: successfulLogs,
        failed: failedLogs,
        byType: typeCount,
        byAutomation: automationStats,
      },
      dailyStats,
    });
  } catch (err) {
    console.error("Error in getDashboardStats:", err.message);
    res.status(500).json({ error: "Failed to fetch detailed dashboard stats." });
  }
};

module.exports = { getDashboardStats };
