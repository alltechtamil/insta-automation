const express = require("express");
const { sendPrivateReply } = require("../controller/privateReply.controller");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/send", authMiddleware, sendPrivateReply);

module.exports = router;
