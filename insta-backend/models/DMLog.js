const mongoose = require("mongoose");

const dmLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    mediaId: {
      type: String,
      required: true,
      index: true,
    },

    mediaPermalink: {
      type: String,
      default: null,
    },

    commentId: {
      type: String,
      required: true,
      index: true,
    },

    commenterId: {
      type: String,
      required: true,
    },

    matchedKeyword: {
      type: String,
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["dm", "reply"],
      required: true,
    },

    automationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AutomatedPost",
      default: null,
    },

    sent: {
      type: Boolean,
      default: false,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    error: {
      type: String,
      default: null,
    },

    statusCode: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("DMLog", dmLogSchema);
