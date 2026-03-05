const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboardController");


router.get("/", leaderboardController.getLeaderboard);
router.get("/weekly", leaderboardController.getWeeklyLeaderboard);
router.get("/streak", leaderboardController.getStreakLeaderboard);


router.get("/learning", leaderboardController.getLearningLeaderboard);
router.get("/learning-time", leaderboardController.getLearningTimeLeaderboard);
router.get("/quizzes", leaderboardController.getQuizLeaderboard);

router.get("/score", leaderboardController.getScoreLeaderboard);
router.get("/accuracy", leaderboardController.getAccuracyLeaderboard);

module.exports = router;