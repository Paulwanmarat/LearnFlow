const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  question: { type: String, required: true },

  type: {
    type: String,
    enum: ["mcq", "truefalse", "written", "code"],
    required: true,
  },

  options: [String], // ใช้กับ mcq

  correctAnswer: String, // mcq + truefalse

  timer: {
    type: Number, // วินาที เช่น 30 / 60
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Quiz", quizSchema);