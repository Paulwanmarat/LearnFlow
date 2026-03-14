const User = require("../models/user");
const { callAI } = require("../services/aiService");
const axios = require("axios");

const activeSubmissions = new Set();

function safeParseJSON(data) {
  if (!data) return [];
  if (typeof data === "object") return data;
  try { return JSON.parse(data); } catch {}
  const cleaned = data.replace(/```json/gi, "").replace(/```/g, "").trim();
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) { try { return JSON.parse(arrayMatch[0]); } catch {} }
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch {} }
  console.error("JSON PARSE FAILED RAW OUTPUT:", cleaned);
  return [];
}

function detectSubject(text = "") {
  const keywords = [
    "javascript","python","java","c++","c#","react","node","coding",
    "programming","algorithm","html","css","software","backend","frontend",
  ];
  return keywords.some(k => text.toLowerCase().includes(k)) ? "programming" : "academic";
}

/* ===================================================== */
/* 📖 GENERATE LESSON                                    */
/* ===================================================== */

exports.generateLesson = async (req, res) => {
  try {
    const { topic, level = "Beginner" } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: "Topic is required" });

    const subject = detectSubject(topic);

    const prompt = `
Create a structured lesson.

Topic: ${topic}
Difficulty: ${level}

Rules:
- Clear explanation
- Simple language
- Real-world analogy
${subject === "programming" ? "- Include one working code example" : "- DO NOT include programming code"}
- End with summary
- Return PURE JSON only

Format:
{
  "title": "",
  "sections": [
    { "heading": "", "content": "" }
  ],
  "summary": ""
}
`;

    const result = await callAI(prompt);
    const lesson = safeParseJSON(result);

    // ── Increment lessonsGenerated ──────────────────────────
    // Fire-and-forget — don't block the lesson response on a DB write
    User.findByIdAndUpdate(req.user?._id ?? req.user?.id, { $inc: { lessonsGenerated: 1 } }).catch((err) =>
      console.error("Failed to increment lessonsGenerated:", err.message)
    );

    res.json(lesson);
  } catch (err) {
    console.error("LESSON ERROR:", err.message);
    res.status(500).json({ error: "Lesson generation failed" });
  }
};

/* ===================================================== */
/* ❓ GENERATE QUESTIONS                                 */
/* ===================================================== */

exports.generateQuestions = async (req, res) => {
  try {
    const { content, topic, count = 5 } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Content is required" });

    const questionAmount = Math.min(Math.max(Number(count) || 5, 1), 30);
    const subject = detectSubject(topic || content);

    const basePrompt = (num) => `
Generate EXACTLY ${num} questions based on:

${content}

Return ONLY valid JSON array.

[
 {
   "question": "string",
   "type": "mcq | tf | written | code",
   "options": [],
   "answer": "string",
   "explanation": {
      "correct": "why correct answer is correct",
      "incorrect": {
         "wrongOption": "why wrong"
      }
   }
 }
]

STRICT RULES:
- JSON only
- No markdown
- No extra text
- For MCQ:
  - Exactly 4 meaningful options
  - ONLY ONE correct
  - No A/B/C/D literal options
  - Explanation must explain why correct is correct
  - Must explain why EACH wrong option is wrong
- For TF (True/False):
  - "answer" MUST be exactly "True" or "False" in English.
`;

    let questions = [];
    let attempts  = 0;

    while (questions.length < questionAmount && attempts < 3) {
      attempts++;
      const needed = questionAmount - questions.length;
      let result;
      try { result = await callAI(basePrompt(needed), 1600); } catch { continue; }
      let parsed = safeParseJSON(result);
      if (!Array.isArray(parsed)) continue;

      for (const q of parsed) {
        if (!q?.question || !q.answer) continue;
        if (questions.some(e => e.question.trim().toLowerCase() === q.question.trim().toLowerCase())) continue;

        if (q.type === "mcq") {
          if (!Array.isArray(q.options)) continue;
          q.options = [...new Set(q.options)];
          if (q.options.every(o => ["a","b","c","d"].includes(o.trim().toLowerCase()))) continue;
          if (!q.options.includes(q.answer)) q.options.unshift(q.answer);
          q.options = q.options.slice(0, 4);
          if (q.options.length !== 4) continue;
          if (!q.explanation || typeof q.explanation !== "object") q.explanation = { correct: "", incorrect: {} };
          if (!q.explanation.correct) q.explanation.correct = "This answer correctly applies the concept.";
          if (!q.explanation.incorrect) q.explanation.incorrect = {};
          q.options.forEach(opt => {
            if (opt !== q.answer && !q.explanation.incorrect[opt])
              q.explanation.incorrect[opt] = "This option does not correctly apply the concept.";
          });
        }

        if (q.type === "tf") {
          q.options = ["True", "False"];
          if (q.answer === "ไม่ใช่" || q.answer?.toLowerCase() === "false") q.answer = "False";
          else if (q.answer === "ใช่"   || q.answer?.toLowerCase() === "true")  q.answer = "True";
        }

        questions.push(q);
        if (questions.length >= questionAmount) break;
      }
    }

    if (subject === "academic") questions = questions.filter(q => q.type !== "code");

    if (questions.length < questionAmount)
      return res.status(500).json({ error: "AI failed to generate valid questions" });

    res.json(questions.slice(0, questionAmount));
  } catch (err) {
    console.error("QUESTION ERROR:", err.message);
    res.status(500).json({ error: "Question generation failed" });
  }
};

/* ===================================================== */
/* 📤 SUBMIT QUIZ                                        */
/* ===================================================== */

exports.submitQuiz = async (req, res) => {
  const userId = req.user?._id ?? req.user?.id;
  if (!userId || activeSubmissions.has(userId)) return res.status(429).json({ error: "Already submitting" });
  activeSubmissions.add(userId);

  try {
    const { answers } = req.body;
    if (!Array.isArray(answers)) { activeSubmissions.delete(userId); return res.status(400).json({ error: "Invalid answers format" }); }

    const user = await User.findById(userId);
    if (!user) { activeSubmissions.delete(userId); return res.status(404).json({ error: "User not found" }); }

    const detailedResults = [];

    const grading = await Promise.all(
      answers.map(async (item) => {
        let isCorrect  = 0;
        let explanation = item.explanation || "";

        if (item.type === "mcq") {
          isCorrect = normalizeAnswer(item.userAnswer) === normalizeAnswer(item.correctAnswer) ? 1 : 0;
        } else if (item.type === "tf") {
          isCorrect = normalizeAnswer(item.userAnswer) === normalizeAnswer(item.correctAnswer) ? 1 : 0;
        } else if (item.type === "written") {
          const userNum    = normalizeNumeric(item.userAnswer);
          const correctNum = normalizeNumeric(item.correctAnswer);
          if (userNum !== null && correctNum !== null) isCorrect = userNum === correctNum ? 1 : 0;
          else isCorrect = await gradeWithAI(item.question, item.correctAnswer, item.userAnswer);
        } else if (item.type === "code") {
          try {
            const studentOut = await executeCode(item.language || "javascript", item.userAnswer);
            const modelOut   = await executeCode(item.language || "javascript", item.correctAnswer);
            isCorrect = studentOut === modelOut ? 1 : 0;
          } catch {
            isCorrect = await gradeWithAI(item.question, item.correctAnswer, item.userAnswer);
          }
        }

        if (!isCorrect) {
          explanation = await generateExplanation(item.question, item.correctAnswer, item.userAnswer, item.options || []);
        }

        detailedResults.push({
          question:      item.question,
          type:          item.type,
          userAnswer:    item.userAnswer,
          correctAnswer: item.correctAnswer,
          isCorrect:     Boolean(isCorrect),
          explanation,
        });

        return isCorrect;
      })
    );

    const score   = grading.reduce((a, b) => a + b, 0);
    const total   = answers.length;
    const percent = total ? Math.round((score / total) * 100) : 0;
    const earnedXP = percent >= 80 ? 20 : percent >= 50 ? 10 : 5;

    let newStreak = user.streak;
    const today   = new Date();
    if (!user.lastQuizDate) {
      newStreak = 1;
    } else {
      const diff = Math.floor((today - new Date(user.lastQuizDate)) / 86400000);
      if      (diff === 1) newStreak += 1;
      else if (diff  >  1) newStreak  = 1;
    }

    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      {
        $push:  { history: { $each: [{ score, total, percent, date: today }], $position: 0 } },
        $inc:   { xp: earnedXP, weeklyXp: earnedXP },
        $set:   { streak: newStreak, lastQuizDate: today },
      },
      { returnDocument: "after" }
    );

    const newLevel = Math.floor(updatedUser.xp / 100) + 1;
    if (newLevel !== updatedUser.level) updatedUser.level = newLevel;

    unlockAchievements(updatedUser);
    await updatedUser.save();

    activeSubmissions.delete(userId);

    res.json({ score, total, percent, xp: updatedUser.xp, level: updatedUser.level, streak: updatedUser.streak, earnedXP, achievements: updatedUser.achievements, detailedResults });
  } catch (err) {
    activeSubmissions.delete(userId);
    console.error("SUBMIT ERROR:", err.message);
    res.status(500).json({ error: "Quiz submission failed" });
  }
};

/* ===================================================== */
/* 🔁 GENERATE WEAK QUESTIONS                            */
/* ===================================================== */

exports.generateWeakQuestions = async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: "Topic required" });

    const QUESTION_COUNT = 5;
    const prompt = `
You are a strict JSON generator.

Generate EXACTLY ${QUESTION_COUNT} high-quality multiple choice questions for:

${topic}

Return ONLY valid JSON array.

[
  {
    "question": "string",
    "type": "mcq",
    "options": ["Full meaningful option text","Full meaningful option text","Full meaningful option text","Full meaningful option text"],
    "answer": "must exactly match one option",
    "explanation": {
      "correct": "Why correct is correct",
      "incorrect": { "wrongOptionText": "Why wrong" }
    }
  }
]

STRICT RULES:
- JSON only
- No markdown
- No A/B/C/D as literal options
- Exactly 4 meaningful options
- Only ONE correct answer
`;

    let questions = [];
    let attempts  = 0;

    while (questions.length < QUESTION_COUNT && attempts < 3) {
      attempts++;
      let result;
      try { result = await callAI(prompt, 1600); } catch { continue; }
      let parsed = safeParseJSON(result);
      if (!Array.isArray(parsed)) continue;

      for (const q of parsed) {
        if (!q?.question || !q.answer || !Array.isArray(q.options)) continue;
        q.options = [...new Set(q.options)];
        if (q.options.every(o => ["a","b","c","d"].includes(o.trim().toLowerCase()))) continue;
        if (!q.options.includes(q.answer)) q.options.unshift(q.answer);
        q.options = q.options.slice(0, 4);
        if (q.options.length !== 4) continue;
        if (!q.explanation || typeof q.explanation !== "object") q.explanation = { correct: "", incorrect: {} };
        if (!q.explanation.correct) q.explanation.correct = "This answer correctly applies the concept.";
        if (!q.explanation.incorrect) q.explanation.incorrect = {};
        q.options.forEach(opt => {
          if (opt !== q.answer && !q.explanation.incorrect[opt])
            q.explanation.incorrect[opt] = "This option does not correctly apply the concept.";
        });
        questions.push({ question: q.question, type: "mcq", options: q.options, answer: q.answer, explanation: q.explanation });
        if (questions.length >= QUESTION_COUNT) break;
      }
    }

    if (questions.length < QUESTION_COUNT)
      return res.status(500).json({ error: "AI failed to generate weak questions" });

    res.json(questions);
  } catch (err) {
    console.error("WEAK QUESTION ERROR:", err.message);
    res.status(500).json({ error: "Failed to generate weak questions" });
  }
};

/* ===================================================== */
/* 📜 HISTORY / LEADERBOARD                              */
/* ===================================================== */

exports.getHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user?._id ?? req.user?.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.history);
  } catch { res.status(500).json({ error: "Failed to fetch history" }); }
};

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find().sort({ xp: -1 }).limit(20).select("name xp level");
    res.json(users);
  } catch { res.status(500).json({ error: "Failed to fetch leaderboard" }); }
};

exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const users = await User.find().sort({ weeklyXp: -1 }).limit(20).select("name weeklyXp level");
    res.json(users);
  } catch { res.status(500).json({ error: "Failed to fetch weekly leaderboard" }); }
};

/* ===================================================== */
/* 🔧 HELPERS                                            */
/* ===================================================== */

async function generateExplanation(question, correctAnswer, userAnswer, options = []) {
  if (!userAnswer?.trim()) return "No answer provided.";
  const prompt = `
You are an educational grader. Explain clearly and concisely.

Question: ${question}
Correct Answer: ${correctAnswer}
Student Answer: ${userAnswer}
All Options: ${options.join(", ")}

Return explanation:

Why the correct answer is correct:
- ...

Why the student's answer is incorrect:
- ...

Why other options are incorrect:
- Option 1: ...

Rules: Be clear and educational. No markdown. No extra commentary. Keep it concise.
`;
  try { return (await callAI(prompt, 800)).trim(); }
  catch { return "Incorrect answer. Review the concept and compare with the correct answer."; }
}

async function gradeWithAI(question, modelAnswer, userAnswer) {
  if (!userAnswer?.trim()) return 0;
  try {
    const result = await callAI(`Strict grading. Return only 1 or 0.\nQuestion: ${question}\nCorrect: ${modelAnswer}\nStudent: ${userAnswer}`);
    return Number(result.trim()) === 1 ? 1 : 0;
  } catch { return 0; }
}

async function executeCode(language, code) {
  if (!code?.trim()) return "";
  const runtimes = {
    javascript: { language: "javascript", version: "18.15.0" },
    python:     { language: "python",     version: "3.10.0"  },
    java:       { language: "java",       version: "15.0.2"  },
    cpp:        { language: "c++",        version: "10.2.0"  },
  };
  const runtime = runtimes[language] || runtimes.javascript;
  const { data } = await axios.post("https://emkc.org/api/v2/piston/execute", {
    language: runtime.language, version: runtime.version, files: [{ content: code }],
  }, { timeout: 5000 });
  if (!data?.run) throw new Error("Execution failed");
  return (data.run.stdout || "").trim();
}

function unlockAchievements(user) {
  const has = (name) => user.achievements.some(a => a.name === name);
  if (user.xp      >= 100 && !has("Rookie"))            user.achievements.push({ name: "Rookie" });
  if (user.xp      >= 500 && !has("Pro Learner"))        user.achievements.push({ name: "Pro Learner" });
  if (user.streak  >=   7 && !has("7 Day Streak"))       user.achievements.push({ name: "7 Day Streak" });
  if (user.level   >=  10 && !has("Level 10 Master"))    user.achievements.push({ name: "Level 10 Master" });
}

function normalizeAnswer(value) {
  if (!value) return "";
  return value.toString().replace(/[$,%\s]/g, "").toLowerCase().trim();
}

function normalizeNumeric(value) {
  if (!value) return null;
  const num = Number(value.toString().replace(/[$,%\s]/g, "").trim());
  return isNaN(num) ? null : num;
}