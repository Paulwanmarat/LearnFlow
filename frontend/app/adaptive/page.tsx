"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "../../components/ProtectedRoute";
import API from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import * as Lucide from "lucide-react";

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

  const [topic,         setTopic]         = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [questions,     setQuestions]     = useState<Question[]>([]);
  const [selected,      setSelected]      = useState<string[]>([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [submitted,     setSubmitted]     = useState(false);
  const [result,        setResult]        = useState<any>(null);
  const [loading,       setLoading]       = useState(false);
  const [revealed,      setRevealed]      = useState(false);
  const [quizSessionId] = useState(() => crypto.randomUUID());

  const submittingRef  = useRef(false);
  // ── prevents double-click on Check Answer / Next ──
  const actionGuardRef = useRef(false);

  const [timerHours,   setTimerHours]   = useState(0);
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timeLeft,     setTimeLeft]     = useState<number | null>(null);
  const timerPerQuestion = timerHours * 3600 + timerMinutes * 60 + timerSeconds;

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  const timerColor =
    timeLeft !== null && timeLeft <= 10
      ? { badge: "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-rose-500/20 animate-pulse", bar: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" }
      : timeLeft !== null && timeLeft <= 30
        ? { badge: "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-amber-500/20",          bar: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" }
        : { badge: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20",  bar: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" };

  useEffect(() => {
    if (timerPerQuestion <= 0 || submitted || questions.length === 0) return;
    setTimeLeft(timerPerQuestion);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev) return timerPerQuestion;
        if (prev <= 1) { handleRevealOrNext(); return timerPerQuestion; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, revealed, questions.length]);

  const generateAdaptive = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSubmitted(false);
    setResult(null);
    try {
      const res = await API.post("/quiz/regenerate-weak", { topic: topic.trim(), count: questionCount });
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

  const submitQuiz = async () => {
    if (submitted || submittingRef.current) return;
    submittingRef.current = true;
    try {
      const formatted = questions.map((q, i) => ({
        question:      q.question,
        type:          q.type,
        correctAnswer: q.answer,
        userAnswer:    selected[i],
        topic:         "Cognivra Adaptive Training",
        difficulty:    q.difficulty || 2,
      }));
      const res = await API.post("/quiz/submit", { answers: formatted, quizSessionId });
      setResult(res.data);
      setSubmitted(true);
    } catch (err) {
      console.error("Quiz submission failed:", err);
    }
  };

  const handleRevealOrNext = () => {
    // ── single-press guard: ignore rapid double-clicks ──
    if (actionGuardRef.current) return;
    actionGuardRef.current = true;

    if (!revealed) {
      setRevealed(true);
      setTimeout(() => { actionGuardRef.current = false; }, 350);
    } else if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setRevealed(false);
      setTimeout(() => { actionGuardRef.current = false; }, 350);
    } else {
      submitQuiz(); // submittingRef guards further calls
    }
  };

  const currentQuestion = questions[currentIndex];
  const isCorrect = selected[currentIndex]?.trim().toLowerCase() === currentQuestion?.answer.trim().toLowerCase();
  const progress = questions.length === 0 ? 0 : ((currentIndex + 1) / questions.length) * 100;

  const scorePercent = result ? result.percent : 0;
  const scoreLabel  = scorePercent >= 90 ? "Outstanding!" : scorePercent >= 70 ? "Great Work!" : scorePercent >= 50 ? "Good Effort!" : "Keep Practicing!";
  const scoreColor  = scorePercent >= 90 ? "text-emerald-400" : scorePercent >= 70 ? "text-brand-accent1" : scorePercent >= 50 ? "text-amber-400" : "text-rose-400";

  const TimerDropdown = ({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) => (
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
      <div className="relative min-h-screen text-white overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0b1120] via-[#1e1b4b] to-[#0b1120]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.15),transparent_40%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_80%,rgba(168,85,247,0.1),transparent_40%)]" />

        <div className="pt-28 pb-24 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto space-y-10 relative z-10">

          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-brand-accent1 font-semibold uppercase tracking-widest mb-4">
              <Lucide.Brain className="w-4 h-4" /> AI-Powered
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent leading-tight">
              Adaptive Training
            </h1>
            <p className="text-white/40 text-base sm:text-lg max-w-lg mx-auto">
              Intelligent practice that targets your weak areas and adapts to your skill level
            </p>
          </motion.div>

          {/* INPUT MODE */}
          {questions.length === 0 && !submitted && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.5 }}
              className="glass-card p-6 sm:p-10 space-y-8 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-brand-accent1/10 blur-[100px] rounded-full pointer-events-none" />

              <div className="space-y-3">
                <label className="text-sm font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                  <Lucide.Target className="w-4 h-4 text-brand-accent1" /> Topic or Weak Areas
                </label>
                <textarea value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Describe what you want to practice - e.g. 'Binary trees, recursion, and dynamic programming'"
                  className="glass-input w-full p-5 rounded-2xl min-h-[140px] text-base leading-relaxed resize-none" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                    <Lucide.Hash className="w-4 h-4 text-brand-accent1" /> Number of Questions
                  </label>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setQuestionCount((v) => Math.max(1, v - 1))}
                      className="w-11 h-11 rounded-xl glass-input flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all text-xl font-bold flex-shrink-0">−</button>
                    <div className="flex-1 glass-input rounded-xl px-4 py-3 text-center font-extrabold text-2xl text-white tracking-wide">{questionCount}</div>
                    <button onClick={() => setQuestionCount((v) => Math.min(20, v + 1))}
                      className="w-11 h-11 rounded-xl glass-input flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all text-xl font-bold flex-shrink-0">+</button>
                  </div>
                  <div className="flex justify-between px-1">
                    {[5, 10, 15, 20].map((n) => (
                      <button key={n} onClick={() => setQuestionCount(n)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition-all ${questionCount === n ? "bg-brand-accent1/20 text-brand-accent1 border border-brand-accent1/30" : "text-white/30 hover:text-white/60"}`}>
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold uppercase tracking-widest text-white/50 flex items-center gap-2">
                    <Lucide.Timer className="w-4 h-4 text-brand-accent1" /> Timer per Question
                    <span className="text-white/20 font-normal normal-case tracking-normal text-xs ml-1">(0 = no limit)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <TimerDropdown label="HH" value={timerHours}   max={24} onChange={setTimerHours} />
                    <span className="text-white/30 font-bold text-2xl pb-1">:</span>
                    <TimerDropdown label="MM" value={timerMinutes} max={60} onChange={setTimerMinutes} />
                    <span className="text-white/30 font-bold text-2xl pb-1">:</span>
                    <TimerDropdown label="SS" value={timerSeconds} max={60} onChange={setTimerSeconds} />
                  </div>
                  {timerPerQuestion > 0 && (
                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm font-semibold w-fit">
                      <Lucide.Clock className="w-3.5 h-3.5" /> {formatTime(timerPerQuestion)} / question
                    </motion.div>
                  )}
                </div>
              </div>

              <button onClick={generateAdaptive} disabled={loading || !topic.trim()}
                className="w-full relative group overflow-hidden rounded-2xl p-[2px] disabled:opacity-40">
                <span className="absolute inset-0 bg-gradient-to-r from-brand-accent1 via-brand-accent2 to-brand-accent1 bg-[length:200%_auto] animate-gradient-slow" />
                <div className="relative bg-brand-dark px-8 py-5 rounded-[14px] flex items-center justify-center gap-3 transition-all group-hover:bg-opacity-0">
                  {loading ? (<><Lucide.Loader2 className="w-5 h-5 animate-spin" /><span className="text-lg font-bold">Generating Questions...</span></>)
                           : (<><Lucide.Sparkles className="w-5 h-5" /><span className="text-lg font-bold">Start Adaptive Practice</span></>)}
                </div>
              </button>
            </motion.div>
          )}

          {/* QUIZ MODE */}
          {!submitted && currentQuestion && (
            <>
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-panel px-6 py-4 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-brand-accent1/20 border border-brand-accent1/30 flex items-center justify-center">
                    <Lucide.Zap className="w-6 h-6 text-brand-accent1" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white">Question {currentIndex + 1} <span className="text-white/30">of {questions.length}</span></p>
                    <p className="text-white/40 text-sm">Difficulty: {currentQuestion.difficulty || "Auto"}</p>
                  </div>
                </div>
                <div className="flex-1 w-full max-w-xs ml-auto">
                  <div className="flex justify-between text-xs font-semibold mb-1.5 uppercase tracking-wide">
                    <span className="text-white/40">Progress</span>
                    <span className="text-brand-accent1">{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full bg-black/40 h-2.5 rounded-full overflow-hidden border border-white/5">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                      transition={{ ease: "easeInOut", duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-brand-accent1 to-brand-accent2 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  </div>
                </div>
              </motion.div>

              {timerPerQuestion > 0 && timeLeft !== null && (
                <div className="sticky top-[72px] z-40 backdrop-blur-md space-y-2">
                  <div className="flex justify-end pr-1">
                    <motion.div key={timeLeft} initial={{ scale: 1.15, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold font-mono tracking-widest shadow-lg ${timerColor.badge}`}>
                      <Lucide.Timer className="w-4 h-4" /> {formatTime(timeLeft)}
                    </motion.div>
                  </div>
                  <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <motion.div initial={{ width: "100%" }} animate={{ width: `${(timeLeft / timerPerQuestion) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                      className={`h-full transition-colors duration-500 ${timerColor.bar}`} />
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div key={currentIndex}
                  initial={{ opacity: 0, x: 30, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -30, scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="glass-card p-6 sm:p-10 relative overflow-hidden space-y-8">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent1/10 blur-[80px] rounded-full pointer-events-none" />

                  <div className="flex justify-between items-start gap-4">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold leading-relaxed text-white">{currentQuestion.question}</h2>
                    <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-brand-accent1 whitespace-nowrap hidden sm:block">
                      {currentQuestion.type === "mcq" ? "Multiple Choice" : currentQuestion.type === "tf" ? "True / False" : currentQuestion.type === "written" ? "Written" : "Code"}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {(currentQuestion.type === "mcq" || currentQuestion.type === "tf") ? (
                      <div className="grid grid-cols-1 gap-3">
                        {currentQuestion.options?.map((opt, j) => {
                          const isSelected = selected[currentIndex] === opt;
                          let style = "border-white/10 hover:border-white/30";
                          let indicatorStyle = "border-white/20 text-transparent";
                          if (revealed) {
                            if (opt === currentQuestion.answer) { style = "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]"; indicatorStyle = "text-emerald-400 border-emerald-400"; }
                            else if (isSelected && !isCorrect) { style = "border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)]"; indicatorStyle = "text-rose-400 border-rose-400"; }
                            else { style = "border-white/5 opacity-40"; }
                          } else if (isSelected) { style = "border-brand-accent1 bg-brand-accent1/10 shadow-[0_0_20px_rgba(99,102,241,0.1)]"; indicatorStyle = "text-brand-accent1 border-brand-accent1"; }
                          return (
                            <button key={j} disabled={revealed}
                              onClick={() => { const copy = [...selected]; copy[currentIndex] = opt; setSelected(copy); }}
                              className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${style}`}>
                              <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                              <div className="flex items-center gap-4 relative z-10">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${indicatorStyle}`}>
                                  {(isSelected || (revealed && opt === currentQuestion.answer)) && <div className="w-3 h-3 bg-current rounded-full" />}
                                </div>
                                <span className="text-lg font-medium tracking-wide">{opt}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <textarea disabled={revealed} value={selected[currentIndex] || ""}
                        onChange={(e) => { const copy = [...selected]; copy[currentIndex] = e.target.value; setSelected(copy); }}
                        placeholder="Type your answer here..."
                        className="glass-input w-full p-5 rounded-2xl min-h-[150px] text-base resize-none" />
                    )}
                  </div>

                  <AnimatePresence>
                    {revealed && (
                      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                        className="space-y-3">

                        {/* Result header */}
                        <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${isCorrect ? "bg-emerald-500/10 border-emerald-500/25" : "bg-rose-500/10 border-rose-500/25"}`}>
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                            {isCorrect ? <Lucide.Check className="w-5 h-5" /> : <Lucide.X className="w-5 h-5" />}
                          </div>
                          <h3 className={`text-lg font-extrabold ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                            {isCorrect ? "Correct! Well done." : "Not quite right"}
                          </h3>
                        </div>

                        {/* Correct answer box */}
                        {!isCorrect && (
                          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-emerald-500/8 border border-emerald-500/25 shadow-[0_0_16px_rgba(16,185,129,0.08)]">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Lucide.CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-emerald-500/70 uppercase tracking-widest font-bold mb-1">Correct Answer</p>
                              <p className="text-base font-semibold text-emerald-300 leading-relaxed">{currentQuestion.answer}</p>
                            </div>
                          </div>
                        )}

                        {/* Your answer box */}
                        {!isCorrect && selected[currentIndex] && (
                          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-rose-500/8 border border-rose-500/25">
                            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Lucide.XCircle className="w-4 h-4 text-rose-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-rose-500/70 uppercase tracking-widest font-bold mb-1">Your Answer</p>
                              <p className="text-base font-semibold text-rose-300 leading-relaxed">{selected[currentIndex]}</p>
                            </div>
                          </div>
                        )}

                        {/* Why incorrect (MCQ per-option) */}
                        {!isCorrect && currentQuestion.explanation?.incorrect?.[selected[currentIndex]] && (
                          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-amber-500/8 border border-amber-500/20">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Lucide.AlertCircle className="w-4 h-4 text-amber-400" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs text-amber-500/70 uppercase tracking-widest font-bold mb-1">Why your answer is incorrect</p>
                              <p className="text-sm text-white/80 leading-relaxed">
                                {currentQuestion.explanation.incorrect[selected[currentIndex]]}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Explanation */}
                        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/10">
                          <div className="w-7 h-7 rounded-lg bg-brand-accent1/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lucide.BookOpen className="w-4 h-4 text-brand-accent1" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-brand-accent1/60 uppercase tracking-widest font-bold mb-1">Explanation</p>
                            <p className="text-sm text-white/75 leading-relaxed">
                              {isCorrect ? (currentQuestion.explanation?.correct || "Excellent understanding.")
                                         : (currentQuestion.explanation?.correct || "Review this concept carefully.")}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ── Action button — single press via actionGuardRef ── */}
                  <button onClick={handleRevealOrNext} disabled={!selected[currentIndex]?.trim() && !revealed}
                    className="w-full relative group overflow-hidden rounded-2xl p-[2px] disabled:opacity-40">
                    <span className="absolute inset-0 bg-gradient-to-r from-brand-accent1 via-brand-accent2 to-brand-accent1 bg-[length:200%_auto] animate-gradient-slow" />
                    <div className="relative bg-brand-dark px-8 py-5 rounded-[14px] flex items-center justify-center gap-3 transition-all group-hover:bg-opacity-0">
                      <span className="text-lg font-bold text-white">
                        {!revealed ? "Check Answer" : currentIndex === questions.length - 1 ? "Finish Training" : "Next Question"}
                      </span>
                      {revealed && <Lucide.ArrowRight className="w-5 h-5 text-white" />}
                    </div>
                  </button>
                </motion.div>
              </AnimatePresence>
            </>
          )}

          {/* RESULTS */}
          {submitted && result && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }} className="space-y-10">
              <div className="glass-card p-8 sm:p-12 text-center relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-accent1/10 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-accent1 to-brand-accent2 flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.3)]">
                    <Lucide.Trophy className="w-10 h-10 text-white" />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Training Complete!</h2>
                    <p className={`text-xl font-bold ${scoreColor}`}>{scoreLabel}</p>
                  </div>
                  <div className="flex items-center justify-center gap-8">
                    <div className="relative w-32 h-32">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="42" strokeWidth="6" stroke="rgba(255,255,255,0.05)" fill="none" />
                        <circle cx="50" cy="50" r="42" strokeWidth="6" fill="none" stroke="url(#scoreGradient)" strokeLinecap="round" strokeDasharray={`${scorePercent * 2.64} 264`} />
                        <defs><linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-extrabold text-white">{result.score}</span>
                        <span className="text-sm text-white/40">/ {result.total}</span>
                      </div>
                    </div>
                    <div className="text-left space-y-3">
                      <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center"><Lucide.Check className="w-4 h-4 text-emerald-400" /></div><div><p className="text-sm text-white/40">Correct</p><p className="text-lg font-bold text-emerald-400">{result.score}</p></div></div>
                      <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center"><Lucide.X className="w-4 h-4 text-rose-400" /></div><div><p className="text-sm text-white/40">Incorrect</p><p className="text-lg font-bold text-rose-400">{result.total - result.score}</p></div></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white/80 flex items-center gap-2"><Lucide.ListChecks className="w-5 h-5 text-brand-accent1" /> Question Review</h3>
                <p className="text-sm text-white/40">Review each question and learn from your mistakes</p>
              </div>

              <div className="space-y-4">
                {questions.map((q, index) => {
                  const userAnswer = selected[index];
                  const correct = userAnswer?.trim().toLowerCase() === q.answer.trim().toLowerCase();
                  return (
                    <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
                      className={`p-6 rounded-2xl border space-y-4 ${correct ? "bg-emerald-500/5 border-emerald-500/15" : "bg-rose-500/5 border-rose-500/15"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${correct ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                          {correct ? <Lucide.Check className="w-4 h-4" /> : <Lucide.X className="w-4 h-4" />}
                        </div>
                        <p className="text-lg font-semibold text-white">{index + 1}. {q.question}</p>
                      </div>
                      <div className="pl-10 space-y-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <div className="flex-1 p-3 rounded-xl bg-black/20 border border-white/5">
                            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Your Answer</p>
                            <p className={`font-medium ${correct ? "text-emerald-400" : "text-rose-400"}`}>{userAnswer || "No answer provided"}</p>
                          </div>
                          {!correct && (<div className="flex-1 p-3 rounded-xl bg-black/20 border border-white/5"><p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Correct Answer</p><p className="font-medium text-emerald-400">{q.answer}</p></div>)}
                        </div>
                        {q.explanation?.correct && <p className="text-white/60 text-sm leading-relaxed">{q.explanation.correct}</p>}
                        {!correct && q.explanation?.incorrect?.[userAnswer] && <p className="text-rose-300/80 text-sm leading-relaxed italic">{q.explanation.incorrect[userAnswer]}</p>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button onClick={() => { setQuestions([]); setSubmitted(false); setResult(null); setTopic(""); setQuestionCount(5); setTimerHours(0); setTimerMinutes(0); setTimerSeconds(0); setTimeLeft(null); submittingRef.current = false; actionGuardRef.current = false; }}
                  className="relative group overflow-hidden rounded-2xl p-[2px]">
                  <span className="absolute inset-0 bg-gradient-to-r from-brand-accent1 via-brand-accent2 to-brand-accent1 bg-[length:200%_auto] animate-gradient-slow" />
                  <div className="relative bg-brand-dark px-8 py-4 rounded-[14px] flex items-center justify-center gap-2 transition-all group-hover:bg-opacity-0">
                    <Lucide.RotateCcw className="w-5 h-5" /><span className="font-bold">Train Again</span>
                  </div>
                </button>
                <button onClick={() => router.push("/dashboard")} className="btn-secondary px-8 py-4 rounded-2xl flex items-center justify-center gap-2">
                  <Lucide.LayoutDashboard className="w-5 h-5" /><span className="font-bold">Dashboard</span>
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}