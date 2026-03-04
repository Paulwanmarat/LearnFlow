const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/* ===================================================== */
/* 🏅 ACHIEVEMENT SCHEMA */
/* ===================================================== */

const achievementSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    unlockedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ===================================================== */
/* 📜 QUIZ HISTORY */
/* ===================================================== */

const historySchema = new mongoose.Schema(
  {
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    percent: { type: Number, required: true, min: 0, max: 100 },
    topic: { type: String, trim: true, default: "General" },
    duration: { type: Number, default: 0 },
    date: { type: Date, default: Date.now },
  },
  { _id: false }
);

/* ===================================================== */
/* 👤 USER SCHEMA */
/* ===================================================== */

const userSchema = new mongoose.Schema(
  {
    /* ================= AUTH ================= */

    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      maxlength: 20,
      match: /^[a-zA-Z0-9._]{4,20}$/,
      index: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^\S+@\S+\.\S+$/,
      index: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },

    /* ================= LOCATION ================= */

    country: {
      type: String,
      default: "US",
      uppercase: true,
      trim: true,
      index: true,
    },

    /* ================= PROGRESSION ================= */

    xp: { type: Number, default: 0, min: 0, index: true },
    weeklyXp: { type: Number, default: 0, min: 0, index: true },
    level: { type: Number, default: 1, min: 1 },

    streak: { type: Number, default: 0, min: 0 },
    lastQuizDate: { type: Date },

    league: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum", "Diamond"],
      default: "Bronze",
      index: true,
    },

    difficulty: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },

    /* ================= RANK TRACKING ================= */

    previousRank: { type: Number, default: 0 },
    currentRank: { type: Number, default: 0 },

    /* ================= ANTI-CHEAT ================= */

    lastQuizSubmittedAt: { type: Date },
    lastQuizDuration: { type: Number, default: 0 },
    suspiciousFlags: { type: Number, default: 0 },

    /* ================= PERFORMANCE ================= */

    lessonsGenerated: { type: Number, default: 0 },
    quizzesTaken: { type: Number, default: 0 },

    totalScore: { type: Number, default: 0 },
    totalCorrect: { type: Number, default: 0 },
    totalQuestions: { type: Number, default: 0 },

    averageScore: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 },

    learningTime: { type: Number, default: 0 },

    /* ================= PROFILE ================= */

    avatar: {
      type: String,
      default: "https://i.imgur.com/6VBx3io.png",
    },

    achievements: { type: [achievementSchema], default: [] },
    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

/* ===================================================== */
/* 🚀 INDEX OPTIMIZATION */
/* ===================================================== */

userSchema.index({ xp: -1 });
userSchema.index({ weeklyXp: -1 });
userSchema.index({ country: 1, xp: -1 });
userSchema.index({ league: 1, xp: -1 });

/* ===================================================== */
/* 🔐 PASSWORD HASH */
/* ===================================================== */

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

/* ===================================================== */
/* 🎯 LEVEL + LEAGUE */
/* ===================================================== */

userSchema.methods.recalculateLevel = function () {
  this.level = Math.floor(this.xp / 100) + 1;

  if (this.xp >= 10000) this.league = "Diamond";
  else if (this.xp >= 7000) this.league = "Platinum";
  else if (this.xp >= 4000) this.league = "Gold";
  else if (this.xp >= 2000) this.league = "Silver";
  else this.league = "Bronze";
};

/* ===================================================== */
/* 🛡 QUIZ UPDATE (ANTI-CHEAT HARDENED) */
/* ===================================================== */

userSchema.methods.updatePerformance = function (
  score,
  total,
  topic = "General",
  durationSeconds = 30
) {
  if (score < 0 || total <= 0 || score > total)
    throw new Error("Invalid quiz data");

  // Minimum 2 seconds per question
  if (durationSeconds < total * 2) {
    this.suspiciousFlags += 1;
    throw new Error("Quiz completed suspiciously fast");
  }

  const now = new Date();

  // Prevent rapid spam submissions
  if (
    this.lastQuizSubmittedAt &&
    now - this.lastQuizSubmittedAt < 5000
  ) {
    this.suspiciousFlags += 1;
    throw new Error("Quiz spam detected");
  }

  this.lastQuizSubmittedAt = now;
  this.lastQuizDuration = durationSeconds;

  const percent = Math.round((score / total) * 100);

  this.quizzesTaken += 1;
  this.totalScore += score;
  this.totalCorrect += score;
  this.totalQuestions += total;

  this.averageScore = Number(
    (this.totalScore / this.quizzesTaken).toFixed(2)
  );

  this.accuracy = Math.round(
    (this.totalCorrect / this.totalQuestions) * 100
  );

  this.history.push({
    score,
    total,
    percent,
    topic,
    duration: durationSeconds,
  });

  const earnedXp = score * 10;

  this.xp += earnedXp;
  this.weeklyXp += earnedXp;

  this.recalculateLevel();
  this.updateStreak();
  this.updateDifficulty(percent);
  this.checkAchievements();
};

/* ===================================================== */
/* 🔥 STREAK */
/* ===================================================== */

userSchema.methods.updateStreak = function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!this.lastQuizDate) {
    this.streak = 1;
  } else {
    const last = new Date(this.lastQuizDate);
    last.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today - last) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) this.streak += 1;
    else if (diffDays > 1) this.streak = 1;
  }

  this.lastQuizDate = new Date();
};

/* ===================================================== */
/* 🧠 DIFFICULTY */
/* ===================================================== */

userSchema.methods.updateDifficulty = function (percent) {
  if (percent >= 85 && this.difficulty === "Beginner")
    this.difficulty = "Intermediate";
  else if (percent >= 85 && this.difficulty === "Intermediate")
    this.difficulty = "Advanced";
  else if (percent <= 40 && this.difficulty === "Advanced")
    this.difficulty = "Intermediate";
  else if (percent <= 40 && this.difficulty === "Intermediate")
    this.difficulty = "Beginner";
};

/* ===================================================== */
/* 🏅 ACHIEVEMENTS */
/* ===================================================== */

userSchema.methods.unlockAchievement = function (name) {
  if (!this.achievements.find(a => a.name === name)) {
    this.achievements.push({ name });
  }
};

userSchema.methods.checkAchievements = function () {
  if (this.streak === 7)
    this.unlockAchievement("7 Day Streak 🔥");

  if (this.quizzesTaken === 50)
    this.unlockAchievement("Quiz Master 🧠");

  if (this.xp >= 5000)
    this.unlockAchievement("XP Warrior ⚡");
};

/* ===================================================== */
/* 🛡 SAFE JSON */
/* ===================================================== */

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);