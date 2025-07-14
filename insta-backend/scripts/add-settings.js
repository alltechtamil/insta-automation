const mongoose = require("mongoose");
const { MONGODB_URI } = require("../config/envConfig");
const SystemSetting = require("../models/SystemSetting");

mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    const settings = [
      { key: "violationCooldownMinutes", value: 30 },
      { key: "adminNotificationEmail", value: "mathanmithun8838@gmail.com" },
    ];
    try {
      await SystemSetting.insertMany(settings, { ordered: false });
      console.log("Settings inserted successfully.");
    } catch (err) {
      console.error("Error inserting settings:", err);
    } finally {
      mongoose.disconnect();
    }
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
