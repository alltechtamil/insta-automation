const mongoose = require("mongoose");

const instagramTokenSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    accessToken: { type: String, required: true },
    tokenType: { type: String, default: "bearer" },
    expiresIn: { type: Number, required: true },
    expiresAt: { type: Date },

    facebookUserId: { type: String },
    fbLongAccessToken: { type: String },
    pageLongAccessToken: { type: String },
    instagramAccountId: { type: String },
  },
  { timestamps: true }
);

instagramTokenSchema.pre("save", function (next) {
  if (this.isModified("expiresIn")) {
    this.expiresAt = new Date(Date.now() + this.expiresIn * 1000);
  }
  next();
});

const InstagramToken = mongoose.model("InstagramToken", instagramTokenSchema);

module.exports = InstagramToken;
