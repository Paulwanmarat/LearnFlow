const User = require("../models/user");

/* ===================================================== */
/* 📊  GET DASHBOARD                                     */
/* GET /api/dashboard                                    */
/* ===================================================== */

exports.getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select(
        // ── identity ──
        "username email avatar bio socialLinks country " +
        // ── progression ──
        "level xp weeklyXp streak league difficulty " +
        // ── stats ──
        "quizzesTaken lessonsGenerated averageScore accuracy " +
        "learningTime totalScore totalCorrect totalQuestions " +
        // ── rank ──
        "previousRank currentRank " +
        // ── social ──
        "achievements history createdAt"
      )
      .lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Return flat so existing dashboard page (res.data.username etc.) keeps working.
    // Settings page uses `res.data?.user || res.data` which also handles flat responses.
    res.json({
      ...user,
      // Convenience alias — some components use res.data.name
      name: user.username,
    });
  } catch (err) {
    console.error("Dashboard error:", err.message);
    res.status(500).json({ success: false, message: "Failed to load dashboard" });
  }
};