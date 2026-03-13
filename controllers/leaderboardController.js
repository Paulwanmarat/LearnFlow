const User = require("../models/user");

const buildLeaderboard = async ({
  sortField,
  secondarySort = "xp",
  minFilter = {},
  selectFields = "",
  formatType,
}) => {
  const users = await User.find(minFilter)
    .sort({ [sortField]: -1, [secondarySort]: -1 })
    .limit(10)
    .select(selectFields)
    .lean();

  const formatted = users.map((user, index) => {
    const newRank = index + 1;
    const previousRank = user.previousRank ?? null;

    let movement = "same";
    if (previousRank) {
      if (previousRank > newRank) movement = "up";
      if (previousRank < newRank) movement = "down";
    }

    return {
      rank: newRank,
      previousRank,
      movement,
      isChampion: newRank === 1,
      isTopThree: newRank <= 3,
      name: user.username,
      country: user.country || "Unknown",
      avatar: user.avatar || null,  // Google photo, uploaded, preset, or null
      level: user.level || 1,
      streak: user.streak || 0,
      xp: user.xp || 0,
      lessons: user.lessonsGenerated || 0,
      quizzes: user.quizzesTaken || 0,
      learningTime: user.learningTime || 0,
      averageScore: typeof user.averageScore === "number" ? Number(user.averageScore.toFixed(1)) : 0,
      accuracy: typeof user.accuracy === "number" ? Number(user.accuracy.toFixed(1)) : 0,
      metric: formatType === "weekly" ? user.weeklyXp || 0 : user[sortField] || 0,
    };
  });

  return { podium: formatted.slice(0, 3), leaderboard: formatted };
};

// avatar added to EVERY selectFields string
exports.getLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "xp", secondarySort: "streak",
      selectFields: "username avatar xp level streak lessonsGenerated quizzesTaken averageScore accuracy learningTime country previousRank",
    });
    res.json(data);
  } catch (err) {
    console.error("Global leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "weeklyXp", secondarySort: "xp", formatType: "weekly",
      selectFields: "username avatar weeklyXp xp level streak country previousRank",
    });
    res.json(data);
  } catch (err) {
    console.error("Weekly leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch weekly leaderboard" });
  }
};

exports.getStreakLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "streak", secondarySort: "xp",
      selectFields: "username avatar streak xp level country previousRank",
    });
    res.json(data);
  } catch (err) {
    console.error("Streak leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch streak leaderboard" });
  }
};

exports.getLearningLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "lessonsGenerated", secondarySort: "xp",
      selectFields: "username avatar lessonsGenerated xp level country previousRank",
    });
    res.json(data);
  } catch (err) {
    console.error("Learning leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch learning leaderboard" });
  }
};

exports.getLearningTimeLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "learningTime", secondarySort: "xp",
      selectFields: "username avatar learningTime xp level country previousRank",
    });
    res.json(data);
  } catch (err) {
    console.error("Learning time leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch learning time leaderboard" });
  }
};

exports.getQuizLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "quizzesTaken", secondarySort: "xp",
      selectFields: "username avatar quizzesTaken xp level country previousRank",
    });
    res.json(data);
  } catch (err) {
    console.error("Quiz leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch quiz leaderboard" });
  }
};

exports.getScoreLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "averageScore", secondarySort: "quizzesTaken",
      minFilter: { quizzesTaken: { $gt: 0 } },
      selectFields: "username avatar averageScore quizzesTaken level xp country previousRank",
    });
    res.json(data);
  } catch (err) {
    console.error("Score leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch score leaderboard" });
  }
};

exports.getAccuracyLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "accuracy", secondarySort: "quizzesTaken",
      minFilter: { quizzesTaken: { $gt: 0 } },
      selectFields: "username avatar accuracy quizzesTaken level xp country previousRank",
    });
    res.json(data);
  } catch (err) {
    console.error("Accuracy leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch accuracy leaderboard" });
  }
};