"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import API from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  question: string;
  type: "mcq" | "tf" | "written" | "code";
  options?: string[];
  answer: string;
  difficulty?: number;
  explanation?: {
    correct?: string;
    incorrect?: Record<string, string>;
  };
}

export default function Adaptive() {
  const router = useRouter();

  const [topic, setTopic] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [revealed, setRevealed] = useState(false);

  /* ================= GENERATE ================= */
  const generateAdaptive = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setSubmitted(false);
    setResult(null);

    try {
      const res = await API.post("/quiz/regenerate-weak", {
        topic: topic.trim(),
      });

      setQuestions(res.data);
      setSelected(new Array(res.data.length).fill(""));
      setCurrentIndex(0);
      setRevealed(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /* ================= SUBMIT ================= */
  const submitQuiz = async () => {
    const formatted = questions.map((q, i) => ({
      question: q.question,
      type: q.type,
      correctAnswer: q.answer,
      userAnswer: selected[i],
      topic: "Learn Flow Adaptive Training",
      difficulty: q.difficulty || 2,
    }));

    const res = await API.post("/quiz/submit", {
      answers: formatted,
    });

    setResult(res.data);
    setSubmitted(true);
  };

  const currentQuestion = questions[currentIndex];

  const isCorrect =
    selected[currentIndex]?.trim().toLowerCase() ===
    currentQuestion?.answer.trim().toLowerCase();

  const progress =
    questions.length === 0
      ? 0
      : ((currentIndex + 1) / questions.length) * 100;

  return (
    <ProtectedRoute>
      <div className="relative min-h-screen text-white overflow-hidden">

        {/* Background */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0b1120] via-[#1e1b4b] to-[#0b1120]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%)]" />

        <div className="pt-28 pb-24 px-6 md:px-12 max-w-4xl mx-auto space-y-14 relative z-10">

          {/* HEADER */}
          <div className="text-center space-y-4">
            <h1 className="text-5xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Adaptive AI Training
            </h1>
            <p className="text-white/50 text-lg">
              Smart practice based on your weak areas
            </p>
          </div>

          {/* INPUT MODE */}
          {questions.length === 0 && !submitted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 space-y-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl shadow-xl"
            >
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Paste topics you struggled with..."
                className="w-full p-5 rounded-2xl bg-black/30 border border-white/10 min-h-[160px]"
              />

              <button
                onClick={generateAdaptive}
                disabled={loading || !topic.trim()}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold shadow-lg"
              >
                {loading ? "Generating..." : "Start Adaptive Practice 🚀"}
              </button>
            </motion.div>
          )}

          {/* QUIZ MODE */}
          {!submitted && currentQuestion && (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white/50">
                  <span>Question {currentIndex + 1}</span>
                  <span>{questions.length}</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <motion.div
                    animate={{ width: `${progress}%` }}
                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-500"
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6">
                <p className="text-xl font-medium">
                  {currentQuestion.question}
                </p>

                {/* OPTIONS */}
                {(currentQuestion.type === "mcq" ||
                  currentQuestion.type === "tf") ? (
                  <div className="space-y-4">
                    {currentQuestion.options?.map((opt, j) => {
                      const selectedOption =
                        selected[currentIndex] === opt;

                      let style = "border-white/10 hover:bg-white/5";

                      if (revealed) {
                        if (opt === currentQuestion.answer) {
                          style = "border-emerald-400 bg-emerald-500/10";
                        } else if (selectedOption && !isCorrect) {
                          style = "border-rose-400 bg-rose-500/10";
                        }
                      } else if (selectedOption) {
                        style = "border-indigo-400 bg-indigo-500/20";
                      }

                      return (
                        <button
                          key={j}
                          disabled={revealed}
                          onClick={() => {
                            const copy = [...selected];
                            copy[currentIndex] = opt;
                            setSelected(copy);
                          }}
                          className={`w-full text-left p-4 rounded-xl border transition ${style}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    disabled={revealed}
                    value={selected[currentIndex] || ""}
                    onChange={(e) => {
                      const copy = [...selected];
                      copy[currentIndex] = e.target.value;
                      setSelected(copy);
                    }}
                    className="w-full p-5 rounded-2xl bg-black/30 border border-white/10 min-h-[150px]"
                  />
                )}

                {/* Explanation */}
                <AnimatePresence>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3"
                    >
                      {isCorrect ? (
                        <>
                          <p className="text-emerald-400 font-semibold">
                            ✅ Correct!
                          </p>
                          <p className="text-white/70">
                            {currentQuestion.explanation?.correct ||
                              "Excellent understanding."}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-rose-400 font-semibold">
                            ❌ Incorrect
                          </p>
                          <p className="text-emerald-400">
                            Correct Answer: {currentQuestion.answer}
                          </p>
                          <p className="text-white/70">
                            {currentQuestion.explanation?.incorrect?.[
                              selected[currentIndex]
                            ] ||
                              currentQuestion.explanation?.correct ||
                              "Review this concept carefully."}
                          </p>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                {!revealed ? (
                  <button
                    onClick={() => setRevealed(true)}
                    disabled={!selected[currentIndex]?.trim()}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold"
                  >
                    Submit Answer
                  </button>
                ) : currentIndex === questions.length - 1 ? (
                  <button
                    onClick={submitQuiz}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold"
                  >
                    Finish Quiz
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setCurrentIndex(currentIndex + 1);
                      setRevealed(false);
                    }}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold"
                  >
                    Next →
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* RESULTS + FULL REVIEW */}
          {submitted && result && (
            <div className="space-y-10">

              <div className="text-center space-y-3">
                <h2 className="text-4xl font-bold">
                  🎉 Training Complete
                </h2>
                <p className="text-3xl font-bold text-indigo-400">
                  {result.score} / {result.total}
                </p>
                <p className="text-white/50">
                  {result.percent}% Accuracy
                </p>
              </div>

              {/* FULL QUESTION REVIEW */}
              <div className="space-y-6">
                {questions.map((q, index) => {
                  const userAnswer = selected[index];
                  const correct =
                    userAnswer?.trim().toLowerCase() ===
                    q.answer.trim().toLowerCase();

                  return (
                    <div
                      key={index}
                      className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                    >
                      <p className="font-semibold">
                        {index + 1}. {q.question}
                      </p>

                      <p className={correct ? "text-emerald-400" : "text-rose-400"}>
                        Your Answer: {userAnswer || "No answer"}
                      </p>

                      {!correct && (
                        <p className="text-emerald-400">
                          Correct Answer: {q.answer}
                        </p>
                      )}

                      {q.explanation?.correct && (
                        <p className="text-white/70">
                          {q.explanation.correct}
                        </p>
                      )}

                      {!correct &&
                        q.explanation?.incorrect?.[userAnswer] && (
                          <p className="text-rose-300">
                            {q.explanation.incorrect[userAnswer]}
                          </p>
                        )}
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-6 justify-center pt-6">
                <button
                  onClick={() => {
                    setQuestions([]);
                    setSubmitted(false);
                    setResult(null);
                  }}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500"
                >
                  Try Again
                </button>

                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-8 py-4 rounded-2xl border border-white/20"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}