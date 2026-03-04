"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import API from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";

interface Lesson {
  title: string;
  sections: { heading: string; content: string }[];
  summary: string;
}

export default function LearningPage() {
  const [topic, setTopic] = useState("");
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [timerPerQuestion, setTimerPerQuestion] = useState(0);

  const router = useRouter();

  const generateLesson = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setLesson(null);

    try {
      const res = await API.post("/quiz/lesson", { topic });
      setLesson(res.data);
    } catch {
      alert("Failed to generate lesson");
    }

    setLoading(false);
  };

  const startQuiz = () => {
    if (!lesson) return;

    const params = new URLSearchParams({
      summary: lesson.summary,
      topic,
      count: questionCount.toString(),
      timer: timerPerQuestion.toString(),
    });

    router.push(`/learning/quiz?${params.toString()}`);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-24 pb-12 px-8 max-w-5xl mx-auto space-y-12 relative z-10">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-block p-4 bg-brand-accent1/10 rounded-3xl mb-6 border border-brand-accent1/20 text-brand-accent1 shadow-[0_0_20px_rgba(99,102,241,0.2)]">
            <span className="text-4xl">🧠</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            LearnFlow AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">Learning Lab</span>
          </h1>
          <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
            Input any topic and let our AI generate a comprehensive, personalized lesson plan instantly.
          </p>
        </motion.div>

        {/* Topic Input */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-8 rounded-3xl"
        >
          <div className="flex flex-col md:flex-row gap-5">
            <input
              type="text"
              placeholder="What do you want to learn today? (e.g., Quantum Physics, React Hooks)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="flex-1 p-5 glass-input text-lg tracking-wide placeholder:text-white/20"
              onKeyDown={(e) => e.key === 'Enter' && generateLesson()}
            />

            <button
              onClick={generateLesson}
              disabled={loading || !topic.trim()}
              className="btn-primary px-10 py-5 text-lg whitespace-nowrap flex items-center justify-center gap-3 md:w-auto w-full transition-all"
            >
              {loading ? (
                <>
                  <span className="animate-spin text-xl">⏳</span>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <span>Generate Lesson</span>
                  <span className="text-xl">✨</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Lesson Display */}
        <AnimatePresence>
          {lesson && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-8"
            >
              <div className="glass-card p-10 relative overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent2/10 blur-[80px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent1/5 blur-[80px] rounded-full pointer-events-none"></div>

                <h2 className="text-4xl font-bold mb-10 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                  {lesson.title}
                </h2>

                <div className="space-y-12">
                  {lesson.sections.map((section, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.2 }}
                      className="relative pl-8 border-l-2 border-brand-accent1/30 group hover:border-brand-accent1/80 transition-colors duration-500"
                    >
                      <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-[#0a0f1c] border-2 border-brand-accent1 group-hover:scale-125 group-hover:bg-brand-accent1 transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                      <h3 className="text-2xl font-semibold mb-4 text-white group-hover:text-brand-accent1 transition-colors duration-300">
                        {section.heading}
                      </h3>
                      <p className="text-white/70 leading-relaxed text-lg whitespace-pre-line group-hover:text-white/90 transition-colors duration-300">
                        {section.content}
                      </p>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: lesson.sections.length * 0.1 + 0.3 }}
                  className="mt-14 p-8 rounded-2xl bg-brand-accent2/5 border border-brand-accent2/20 backdrop-blur-sm shadow-inner"
                >
                  <h4 className="flex items-center gap-3 font-bold text-xl mb-4 text-brand-accent2">
                    <span className="text-2xl">📝</span> Lesson Summary
                  </h4>
                  <p className="text-white/80 leading-relaxed text-lg italic">
                    &quot;{lesson.summary}&quot;
                  </p>
                </motion.div>
              </div>

              {/* Quiz Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: lesson.sections.length * 0.1 + 0.4 }}
                className="glass-card p-10 flex flex-col md:flex-row items-center gap-8 justify-between relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none"></div>

                <div className="flex-1 w-full text-center md:text-left z-10">
                  <h3 className="text-2xl font-bold mb-2">Ready for the Quiz?</h3>
                  <p className="text-white/50 text-base">Configure your challenge parameters and test your knowledge.</p>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto z-10">
                  <div className="flex-1 md:w-32">
                    <label className="block text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider text-center md:text-left">Qs</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full p-4 glass-input font-bold text-center text-xl"
                    />
                  </div>

                  <div className="flex-1 md:w-44">
                    <label className="block text-xs font-semibold text-white/50 mb-3 uppercase tracking-wider text-center md:text-left">Timer / Q</label>
                    <select
                      value={timerPerQuestion}
                      onChange={(e) => setTimerPerQuestion(Number(e.target.value))}
                      className="w-full p-4 glass-input appearance-none bg-[#0a0f1c] hover:bg-[#111827] font-bold text-center cursor-pointer text-lg"
                    >
                      <option value={0}>No Timer</option>
                      <option value={20}>20s</option>
                      <option value={40}>40s</option>
                      <option value={60}>60s</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={startQuiz}
                  className="w-full md:w-auto mt-6 md:mt-0 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold px-10 py-5 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-300 hover:-translate-y-1 text-lg z-10"
                >
                  Start Quiz 🧠
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}