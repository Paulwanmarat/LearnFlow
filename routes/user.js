const express = require("express");
const router  = express.Router();
const User    = require("../models/user");

/* ─────────────────────────────────────────────────────
 * PUBLIC FIELDS returned on every user look-up.
 * Never expose email, password, googleId, or anti-cheat.
 * ───────────────────────────────────────────────────── */
const PUBLIC_SELECT =
  "username avatar bio socialLinks country level xp streak league quizzesTaken lessonsGenerated averageScore accuracy achievements createdAt";

/* ===================================================== */
/* 🔍  SEARCH — GET /api/users/search?q=<query>          */
/* Returns up to 8 fuzzy-matched users                   */
/* ===================================================== */
router.get("/search", async (req, res) => {
  try {
    const q = (req.query.q || "").trim();

    if (!q || q.length < 2) {
      return res.status(400).json({ success: false, message: "Query must be at least 2 characters" });
    }
    if (q.length > 30) {
      return res.status(400).json({ success: false, message: "Query too long" });
    }

    // Case-insensitive prefix + contains search
    const users = await User.find({
      username: { $regex: q, $options: "i" },
    })
      .select("username avatar level league country")
      .limit(8)
      .lean();

    res.json({ success: true, users });
  } catch (err) {
    console.error("User search error:", err.message);
    res.status(500).json({ success: false, message: "Search failed" });
  }
});

/* ===================================================== */
/* 👤  PUBLIC PROFILE — GET /api/users/:username         */
/* ===================================================== */
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;

    if (!username || !/^[a-zA-Z0-9._]{1,20}$/.test(username)) {
      return res.status(400).json({ success: false, message: "Invalid username" });
    }

    const user = await User.findOne({
      username: { $regex: `^${username}$`, $options: "i" },
    })
      .select(PUBLIC_SELECT)
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (err) {
    console.error("Public profile error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load profile" });
  }
});

module.exports = router;