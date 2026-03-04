const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");

/* ================= GLOBAL ================= */

router.get("/", leaderboardController.getLeaderboard);
router.get("/weekly", leaderboardController.getWeeklyLeaderboard);
router.get("/streak", leaderboardController.getStreakLeaderboard);

/* ================= ACTIVITY ================= */

router.get("/learning", leaderboardController.getLearningLeaderboard);
router.get("/learning-time", leaderboardController.getLearningTimeLeaderboard);
router.get("/quizzes", leaderboardController.getQuizLeaderboard);

/* ================= PERFORMANCE ================= */

router.get("/score", leaderboardController.getScoreLeaderboard);
router.get("/accuracy", leaderboardController.getAccuracyLeaderboard);

/* ================= COUNTRY ================= */

router.get("/country", leaderboardController.getCountryLeaderboard);

module.exports = router;