const express = require("express");
const { getWebhook, postWebhook } = require("../services/webhook.services");

const router = express.Router();

router.get("/", getWebhook);
router.post("/", postWebhook);

module.exports = router;
