const mongoose = require("mongoose");

const achievementSchema = new mongoose.Schema({
  name: String,
  unlockedAt: Date,
});

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    maxlength: 20,
  },
  email: String,
  password: String,

  xp: { type: Number, default: 0 },
  weeklyXp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  streak: { type: Number, default: 0 },

  avatar: {
    type: String,
    default: "https://i.imgur.com/6VBx3io.png",
  },

  achievements: [achievementSchema],

  history: [
    {
      score: Number,
      total: Number,
      percent: Number,
      date: { type: Date, default: Date.now },
    },
  ],
});

module.exports = mongoose.model("User", userSchema);