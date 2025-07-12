const express = require("express");
const { getMedia, getDetailedMedia, getAPostDetails } = require("../controller/media.controller");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

router.get("/", authMiddleware, getMedia);
router.get("/details", authMiddleware, getDetailedMedia);
router.get("/:postId", authMiddleware, getAPostDetails);

module.exports = router;
