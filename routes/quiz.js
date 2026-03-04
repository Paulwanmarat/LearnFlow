const express = require("express");
const router = express.Router();

const {
  generateLesson,
  generateQuestions,
  submitQuiz,
  getHistory,
  getLeaderboard,
  getWeeklyLeaderboard,
  generateWeakQuestions,
} = require("../controllers/quizController");

const authMiddleware = require("../middleware/auth");

router.post("/lesson", authMiddleware, generateLesson);

router.post("/generate", authMiddleware, generateQuestions);
router.post("/regenerate-weak", authMiddleware, generateWeakQuestions);
router.post("/submit", authMiddleware, submitQuiz);

router.get("/history", authMiddleware, getHistory);

router.get("/leaderboard", getLeaderboard);
router.get("/weekly-leaderboard", getWeeklyLeaderboard);

module.exports = router;