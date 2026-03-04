const User = require("../models/user");

/* ===================================================== */
/* 🔧 GENERIC BUILDER */
/* ===================================================== */

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

      level: user.level || 1,
      streak: user.streak || 0,
      xp: user.xp || 0,

      lessons: user.lessonsGenerated || 0,
      quizzes: user.quizzesTaken || 0,
      learningTime: user.learningTime || 0,

      averageScore:
        typeof user.averageScore === "number"
          ? Number(user.averageScore.toFixed(1))
          : 0,

      accuracy:
        typeof user.accuracy === "number"
          ? Number(user.accuracy.toFixed(1))
          : 0,

      metric:
        formatType === "weekly"
          ? user.weeklyXp || 0
          : user[sortField] || 0,
    };
  });

  return {
    podium: formatted.slice(0, 3),
    leaderboard: formatted,
  };
};

/* ===================================================== */
/* 🏆 GLOBAL */
/* ===================================================== */

exports.getLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "xp",
      secondarySort: "streak",
      selectFields:
        "username xp level streak lessonsGenerated quizzesTaken averageScore accuracy learningTime country previousRank",
    });

    res.json(data);
  } catch (err) {
    console.error("Global leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
};

/* ===================================================== */
/* ⚡ WEEKLY */
/* ===================================================== */

exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "weeklyXp",
      secondarySort: "xp",
      selectFields:
        "username weeklyXp xp level streak country previousRank",
      formatType: "weekly",
    });

    res.json(data);
  } catch (err) {
    console.error("Weekly leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch weekly leaderboard" });
  }
};

/* ===================================================== */
/* 🔥 STREAK */
/* ===================================================== */

exports.getStreakLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "streak",
      secondarySort: "xp",
      selectFields: "username streak xp level country previousRank",
    });

    res.json(data);
  } catch (err) {
    console.error("Streak leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch streak leaderboard" });
  }
};

/* ===================================================== */
/* 🧠 MOST LEARNING */
/* ===================================================== */

exports.getLearningLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "lessonsGenerated",
      secondarySort: "xp",
      selectFields:
        "username lessonsGenerated xp level country previousRank",
    });

    res.json(data);
  } catch (err) {
    console.error("Learning leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch learning leaderboard" });
  }
};

/* ===================================================== */
/* ⏳ LEARNING TIME */
/* ===================================================== */

exports.getLearningTimeLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "learningTime",
      secondarySort: "xp",
      selectFields:
        "username learningTime xp level country previousRank",
    });

    res.json(data);
  } catch (err) {
    console.error("Learning time leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch learning time leaderboard" });
  }
};

/* ===================================================== */
/* 📝 QUIZZES */
/* ===================================================== */

exports.getQuizLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "quizzesTaken",
      secondarySort: "xp",
      selectFields:
        "username quizzesTaken xp level country previousRank",
    });

    res.json(data);
  } catch (err) {
    console.error("Quiz leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch quiz leaderboard" });
  }
};

/* ===================================================== */
/* 🎯 SCORE */
/* ===================================================== */

exports.getScoreLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "averageScore",
      secondarySort: "quizzesTaken",
      minFilter: { quizzesTaken: { $gt: 0 } },
      selectFields:
        "username averageScore quizzesTaken level xp country previousRank",
    });

    res.json(data);
  } catch (err) {
    console.error("Score leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch score leaderboard" });
  }
};

/* ===================================================== */
/* 🎯 ACCURACY */
/* ===================================================== */

exports.getAccuracyLeaderboard = async (req, res) => {
  try {
    const data = await buildLeaderboard({
      sortField: "accuracy",
      secondarySort: "quizzesTaken",
      minFilter: { quizzesTaken: { $gt: 0 } },
      selectFields:
        "username accuracy quizzesTaken level xp country previousRank",
    });

    res.json(data);
  } catch (err) {
    console.error("Accuracy leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch accuracy leaderboard" });
  }
};

/* ===================================================== */
/* 🌍 COUNTRY */
/* ===================================================== */

exports.getCountryLeaderboard = async (req, res) => {
  try {
    const { country } = req.query;

    if (!country) {
      return res.status(400).json({ error: "Country required" });
    }

    const data = await buildLeaderboard({
      sortField: "xp",
      secondarySort: "streak",
      minFilter: { country },
      selectFields:
        "username xp level streak country previousRank",
    });

    res.json(data);
  } catch (err) {
    console.error("Country leaderboard error:", err.message);
    res.status(500).json({ error: "Failed to fetch country leaderboard" });
  }
};