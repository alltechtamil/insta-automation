const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getDashboardStats } = require("../controller/dashboard.controller");

const router = express.Router();

router.get("/stats", authMiddleware, getDashboardStats);

module.exports = router;
