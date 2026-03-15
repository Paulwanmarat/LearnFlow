"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import API from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain, Sparkles, Loader2, BookOpen, ChevronRight,
  Clock, Hash, Play, FileText, Lightbulb, Timer,
} from "lucide-react";

interface Lesson {
  title: string;
  sections: { heading: string; content: string }[];
  summary: string;
}

export default function LearningPage() {
  const [topic,         setTopic]         = useState("");
  const [lesson,        setLesson]        = useState<Lesson | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [questionCount, setQuestionCount] = useState(5);
  const [timerHours,    setTimerHours]    = useState(0);
  const [timerMinutes,  setTimerMinutes]  = useState(0);
  const [timerSeconds,  setTimerSeconds]  = useState(0);

  const router = useRouter();
  const totalTimerSeconds = timerHours * 3600 + timerMinutes * 60 + timerSeconds;

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
      count:   questionCount.toString(),
      timer:   totalTimerSeconds.toString(),
    });
    router.push(`/learning/quiz?${params.toString()}`);
  };

  const TimerSelect = ({
    label, value, max, onChange,
  }: { label: string; value: number; max: number; onChange: (v: number) => void }) => (
    <div className="flex flex-col items-center gap-1.5">
      <span className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}
        className="w-20 p-3 glass-input appearance-none bg-[#0a0f1c] hover:bg-[#111827] font-bold text-center cursor-pointer text-lg rounded-xl">
        {Array.from({ length: max }, (_, i) => (
          <option key={i} value={i}>{String(i).padStart(2, "0")}</option>
        ))}
      </select>
    </div>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 max-w-4xl mx-auto space-y-10 relative z-10">

        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 blur-[120px] rounded-full" />
          <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] bg-violet-600/6 blur-[120px] rounded-full" />
        </div>

        {/* HEADER */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-accent1/10 border border-brand-accent1/20 text-brand-accent1 shadow-[0_0_30px_rgba(99,102,241,0.2)] mb-2">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Cognivra Adaptive AI{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">
              Learning Lab
            </span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Enter any topic and let the AI generate a comprehensive, personalized lesson plan instantly.
          </p>
        </motion.div>

        {/* INPUT */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card p-6 sm:p-8">
          <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-brand-accent1" /> Topic
          </label>
          <div className="flex flex-col sm:flex-row gap-4">
            <input
              type="text"
              placeholder="e.g. Quantum Physics, React Hooks, World War II..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generateLesson()}
              className="flex-1 p-4 glass-input text-base tracking-wide placeholder:text-white/20 rounded-2xl"
            />
            <button onClick={generateLesson} disabled={loading || !topic.trim()}
              className="relative group overflow-hidden rounded-2xl p-[2px] sm:w-auto w-full disabled:opacity-40 flex-shrink-0">
              <span className="absolute inset-0 bg-gradient-to-r from-brand-accent1 via-brand-accent2 to-brand-accent1 bg-[length:200%_auto] animate-gradient-slow" />
              <div className="relative bg-brand-dark px-8 py-4 rounded-[14px] flex items-center justify-center gap-2.5 transition-all group-hover:bg-opacity-0">
                {loading
                  ? <><Loader2 className="w-4 h-4 animate-spin" /><span className="font-bold whitespace-nowrap">Generating...</span></>
                  : <><Sparkles className="w-4 h-4" /><span className="font-bold whitespace-nowrap">Generate Lesson</span></>
                }
              </div>
            </button>
          </div>
        </motion.div>

        {/* LESSON */}
        <AnimatePresence>
          {lesson && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
              className="space-y-6">

              {/* Lesson content card */}
              <div className="glass-card p-6 sm:p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent2/8 blur-[80px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-accent1/5 blur-[60px] rounded-full pointer-events-none" />

                {/* Title */}
                <div className="flex items-start gap-4 mb-10 relative">
                  <div className="w-10 h-10 rounded-xl bg-brand-accent1/15 border border-brand-accent1/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <FileText className="w-5 h-5 text-brand-accent1" />
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-snug">{lesson.title}</h2>
                </div>

                {/* Sections */}
                <div className="space-y-10 relative">
                  {lesson.sections.map((section, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 + 0.15 }}
                      className="relative pl-7 border-l-2 border-brand-accent1/25 group hover:border-brand-accent1/70 transition-colors duration-400">
                      <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-[#0a0f1c] border-2 border-brand-accent1/60 group-hover:bg-brand-accent1 group-hover:scale-125 group-hover:border-brand-accent1 transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.4)]" />
                      <h3 className="text-lg sm:text-xl font-bold mb-3 text-white group-hover:text-brand-accent1 transition-colors duration-300">
                        {section.heading}
                      </h3>
                      <p className="text-white/65 leading-relaxed text-sm sm:text-base whitespace-pre-line group-hover:text-white/85 transition-colors duration-300">
                        {section.content}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Summary */}
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: lesson.sections.length * 0.08 + 0.25 }}
                  className="mt-12 p-6 rounded-2xl bg-brand-accent2/5 border border-brand-accent2/15 relative">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-brand-accent2/15 border border-brand-accent2/20 flex items-center justify-center">
                      <Lightbulb className="w-4 h-4 text-brand-accent2" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-brand-accent2/70">Lesson Summary</span>
                  </div>
                  <p className="text-white/75 leading-relaxed text-sm sm:text-base italic">
                    &quot;{lesson.summary}&quot;
                  </p>
                </motion.div>
              </div>

              {/* QUIZ SETTINGS */}
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: lesson.sections.length * 0.08 + 0.35 }}
                className="glass-card p-6 sm:p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/4 via-transparent to-transparent pointer-events-none" />

                <div className="relative space-y-7">
                  {/* Heading */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Play className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Ready for the Quiz?</h3>
                      <p className="text-xs text-white/40 mt-0.5">Configure your parameters and test your knowledge.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                    {/* Question count */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40 mb-3">
                        <Hash className="w-3.5 h-3.5 text-brand-accent1" /> Number of Questions
                      </label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setQuestionCount((v) => Math.max(1, v - 1))}
                          className="w-11 h-11 rounded-xl glass-input flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all text-xl font-bold flex-shrink-0">
                          −
                        </button>
                        <div className="flex-1 glass-input rounded-xl px-4 py-3 text-center font-extrabold text-2xl text-white">
                          {questionCount}
                        </div>
                        <button onClick={() => setQuestionCount((v) => Math.min(20, v + 1))}
                          className="w-11 h-11 rounded-xl glass-input flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all text-xl font-bold flex-shrink-0">
                          +
                        </button>
                      </div>
                      <div className="flex justify-between px-1">
                        {[5, 10, 15, 20].map((n) => (
                          <button key={n} onClick={() => setQuestionCount(n)}
                            className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${questionCount === n
                              ? "bg-brand-accent1/20 text-brand-accent1 border border-brand-accent1/30"
                              : "text-white/30 hover:text-white/60"}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/40">
                        <Timer className="w-3.5 h-3.5 text-brand-accent1" /> Timer per Question
                        <span className="text-white/20 font-normal normal-case tracking-normal">(0 = no limit)</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <TimerSelect label="HH" value={timerHours}   max={24} onChange={setTimerHours}   />
                        <span className="text-white/30 font-bold text-2xl pb-1">:</span>
                        <TimerSelect label="MM" value={timerMinutes} max={60} onChange={setTimerMinutes} />
                        <span className="text-white/30 font-bold text-2xl pb-1">:</span>
                        <TimerSelect label="SS" value={timerSeconds} max={60} onChange={setTimerSeconds} />
                      </div>
                      {totalTimerSeconds > 0 && (
                        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold w-fit">
                          <Clock className="w-3.5 h-3.5" />
                          {[timerHours, timerMinutes, timerSeconds].map(v => String(v).padStart(2, "0")).join(":")} per question
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Start button */}
                  <button onClick={startQuiz}
                    className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-bold px-8 py-4 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transition-all duration-300 hover:-translate-y-0.5 flex items-center justify-center gap-2.5 text-base">
                    <Play className="w-5 h-5" />
                    Start Quiz
                    <ChevronRight className="w-4 h-4 opacity-60" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}