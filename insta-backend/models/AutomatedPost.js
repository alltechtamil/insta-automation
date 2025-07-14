const mongoose = require("mongoose");

const AutomatedPostSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },

    postCaption: {
      type: String,
      trim: true,
    },

    mediaId: {
      type: String,
      required: true,
      index: true,
    },

    keywords: {
      type: [String],
      required: true,
      validate: [(val) => val.length > 0, "At least one keyword is required."],
    },

    replyMessage: {
      type: String,
      required: true,
      trim: true,
    },

    replyComment: {
      type: String,
      default: null,
      trim: true,
    },

    isEnabled: {
      type: Boolean,
      default: true,
    },

    isReply: {
      type: Boolean,
      default: true,
    },

    isDM: {
      type: Boolean,
      default: true,
    },

    // ✅ Default: unlimited (null = no limit)
    maxReplies: {
      type: Number,
      default: null, // null = unlimited
      min: 0,
    },

    maxDMs: {
      type: Number,
      default: null, // null = unlimited
      min: 0,
    },

    sentReplies: {
      type: Number,
      default: 0,
    },

    sentDMs: {
      type: Number,
      default: 0,
    },

    startDate: {
      type: Date,
      default: null,
    },

    endDate: {
      type: Date,
      default: null,
    },
    lastDMErrorAt: {
      type: Date,
      default: null,
    },
    lastDMErrorNotificationSentAt: {
      type: Date,
      default: null,
    },
    lastReplyErrorAt: {
      type: Date,
      default: null,
    },
    lastReplyErrorNotificationSentAt: {
      type: Date,
      default: null,
    },
    isErrorResolved: {
      type: Boolean,
      default: false,
    },
    pausedUntil: {
      type: Date,
      default: null,
    },
    lastViolationMessage: {
      type: String,
      default: null,
    },
    pauseNotificationSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Normalize keywords before save
AutomatedPostSchema.pre("save", function (next) {
  if (this.isModified("keywords") && Array.isArray(this.keywords)) {
    this.keywords = this.keywords.map((kw) => kw.toLowerCase().trim());
  }
  next();
});

const AutomatedPost = mongoose.model("AutomatedPost", AutomatedPostSchema);

module.exports = AutomatedPost;
