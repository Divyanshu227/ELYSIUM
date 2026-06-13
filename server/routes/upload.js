const express = require("express");
const router = express.Router();
const { getTokenData, clearToken } = require("../utils/github");

// GET /upload/status
router.get("/status", (req, res) => {
    const tokenData = getTokenData();
    if (tokenData && tokenData.token) {
        return res.json({
            authenticated: true,
            username: tokenData.username,
            repo: "Elysium-Submissions"
        });
    }
    return res.json({
        authenticated: false
    });
});

// POST /upload/disconnect
router.post("/disconnect", (req, res) => {
    const success = clearToken();
    if (success) {
        return res.json({ success: true, message: "Disconnected from GitHub" });
    }
    return res.status(500).json({ success: false, message: "Failed to clear token" });
});

module.exports = router;
