const express = require("express");
const { upsertFacebookFields, getFacebookFields, deleteFacebookFields } = require("../controller/fbToken.controller");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.put("/", authMiddleware, upsertFacebookFields);
router.get("/", authMiddleware, getFacebookFields);
router.delete("/", authMiddleware, deleteFacebookFields);

module.exports = router;
