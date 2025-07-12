const express = require("express");
const { getComments, replyToComment } = require("../controller/comment.controller");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.get("/media/:mediaId/comments", authMiddleware, getComments);
router.post("/comment/:commentId/reply", authMiddleware, replyToComment);

module.exports = router;
