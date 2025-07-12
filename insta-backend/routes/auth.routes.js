const express = require("express");
const { getInstaToken, login, getProfile } = require("../controller/auth.controller");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/login", login);
router.get("/callback", getInstaToken);
router.get("/profile", authMiddleware, getProfile);

module.exports = router;
