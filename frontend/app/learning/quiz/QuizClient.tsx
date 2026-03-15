"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import API from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import Confetti from "react-confetti";
import * as Lucide from "lucide-react";

interface Explanation {
  correct: string;
  incorrect: Record<string, string>;
}

interface Question {
  question: string;
  type: "mcq" | "tf" | "written" | "code";
  options?: string[];
  answer: string;
  explanation?: string | Explanation;
  difficulty?: number;
}

// Returns all wrong-option entries, with a fallback for missing/generic text
function getWrongEntries(
  options: string[] | undefined,
  answer: string,
  incorrectMap: Record<string, string>
): { opt: string; text: string }[] {
  if (!options) return [];
  return options
    .filter(opt => opt !== answer)
    .map(opt => {
      const raw = incorrectMap[opt] ?? "";
      const isGeneric = !raw || raw.toLowerCase().includes("does not correctly apply the concept");
      return { opt, text: isGeneric ? "This option is not the correct answer for this question." : raw };
    });
}

export default function QuizClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const summary = searchParams.get("summary") || "";
  const topic = searchParams.get("topic") || "";
  const count = Number(searchParams.get("count") || 5);
  const timerPerQuestion = Number(searchParams.get("timer") || 0);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [quizSessionId] = useState(() => crypto.randomUUID());

  const submittingRef = useRef(false);
  const actionGuardRef = useRef(false);
  const [writtenCorrect, setWrittenCorrect] = useState<boolean | null>(null);
  const [writtenExplanation, setWrittenExplanation] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
  };

  useEffect(() => {
    const loadQuiz = async () => {
      const res = await API.post("/quiz/generate", { content: summary, count });
      const normalized = res.data.map((q: Question) =>
        q.type === "tf" && (!q.options || q.options.length === 0)
          ? { ...q, options: ["True", "False"] }
          : q
      );
      setQuestions(normalized);
      setSelected(new Array(normalized.length).fill(""));
      setSelectedLanguage(new Array(normalized.length).fill("javascript"));
    };
    if (summary) loadQuiz();
  }, []);

  useEffect(() => {
    if (timerPerQuestion <= 0 || submitted) return;
    setTimeLeft(timerPerQuestion);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (!prev) return timerPerQuestion;
        if (prev <= 1) { handleRevealOrNext(); return timerPerQuestion; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, revealed]);

  const currentQuestion = questions[currentIndex];
  const isCorrect = currentQuestion?.type === "written" || currentQuestion?.type === "code"
    ? (writtenCorrect ?? false)
    : selected[currentIndex]?.trim().toLowerCase() ===
    currentQuestion?.answer?.trim().toLowerCase();
  const progress =
    questions.length === 0 ? 0 : ((currentIndex + 1) / questions.length) * 100;

  const handleRevealOrNext = async () => {
    if (actionGuardRef.current) return;
    actionGuardRef.current = true;

    if (!revealed) {
      const q = questions[currentIndex];
      if (q?.type === "written" || q?.type === "code") {
        try {
          const { data } = await API.post("/quiz/grade-written", {
            question: q.question,
            correctAnswer: q.answer,
            userAnswer: selected[currentIndex],
          });
          setWrittenCorrect(data.correct);
          setWrittenExplanation(data.explanation ?? null);
        } catch {
          setWrittenCorrect(
            selected[currentIndex]?.trim().toLowerCase() === q.answer.trim().toLowerCase()
          );
        }
      } else {
        setWrittenCorrect(null);
        setWrittenExplanation(null);
      }
      setRevealed(true);
      setTimeout(() => { actionGuardRef.current = false; }, 300);
    } else {
      setWrittenCorrect(null);
      setWrittenExplanation(null);
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setRevealed(false);
        setTimeout(() => { actionGuardRef.current = false; }, 300);
      } else {
        submitQuiz();
      }
    }
  };

  const submitQuiz = async () => {
    if (submitted || submittingRef.current) return;
    submittingRef.current = true;

    const formatted = questions.map((q, i) => ({
      question: q.question,
      type: q.type,
      correctAnswer: q.answer,
      userAnswer: selected[i],
      language: q.type === "code" ? selectedLanguage[i] : undefined,
      topic,
      difficulty: q.difficulty || 1,
    }));

    const res = await API.post("/quiz/submit", { answers: formatted, quizSessionId });
    setResult(res.data);
    setSubmitted(true);
  };

  const timerColor =
    timeLeft !== null && timeLeft <= 10
      ? { badge: "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-rose-500/20 animate-pulse", bar: "bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]" }
      : timeLeft !== null && timeLeft <= 30
        ? { badge: "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-amber-500/20", bar: "bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]" }
        : { badge: "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20", bar: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" };

  return (
    <ProtectedRoute>
      {submitted && result && <Confetti recycle={false} numberOfPieces={500} gravity={0.15} />}

      <div className="relative min-h-screen pt-24 pb-12 px-4 sm:px-8 max-w-5xl mx-auto space-y-12">

        {/* Header */}
        {!submitted && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row justify-between items-center gap-6 glass-card p-6 md:p-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-accent1/10 rounded-xl border border-brand-accent1/20 text-brand-accent1 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Lucide.Brain className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  Knowledge <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">Check</span>
                </h1>
                <p className="text-white/50 text-sm mt-1">Topic: <span className="text-white font-medium">{topic}</span></p>
              </div>
            </div>
            <div className="flex-1 w-full max-w-sm ml-auto">
              <div className="flex justify-between text-sm font-semibold mb-2 uppercase tracking-wide">
                <span className="text-white/50">Progress</span>
                <span className="text-brand-accent1">{currentIndex + 1} / {questions.length}</span>
              </div>
              <div className="w-full bg-black/40 h-3 rounded-full overflow-hidden border border-white/5 relative">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeInOut", duration: 0.5 }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-accent1 to-brand-accent2 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Timer */}
        {!submitted && timerPerQuestion > 0 && timeLeft !== null && (
          <div className="sticky top-[72px] z-40 backdrop-blur-md space-y-2">
            <div className="flex justify-end pr-1">
              <motion.div key={timeLeft} initial={{ scale: 1.15, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-sm font-bold font-mono tracking-widest shadow-lg ${timerColor.badge}`}>
                <Lucide.Timer className="w-4 h-4" />
                {formatTime(timeLeft)}
              </motion.div>
            </div>
            <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden border border-white/5">
              <motion.div initial={{ width: "100%" }}
                animate={{ width: `${(timeLeft / timerPerQuestion) * 100}%` }}
                transition={{ duration: 1, ease: "linear" }}
                className={`h-full transition-colors duration-500 ${timerColor.bar}`} />
            </div>
          </div>
        )}

        {/* Question */}
        <AnimatePresence mode="wait">
          {currentQuestion && !submitted && (
            <motion.div key={currentIndex}
              initial={{ opacity: 0, x: 20, scale: 0.98 }} animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="glass-card p-6 md:p-10 relative overflow-hidden space-y-8 min-h-[500px] flex flex-col">

              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent1/10 blur-[80px] rounded-full pointer-events-none" />

              <div className="flex justify-between items-start gap-4">
                <h2 className="text-2xl md:text-3xl font-bold leading-relaxed text-white">
                  {currentQuestion.question}
                </h2>
                <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-brand-accent1 whitespace-nowrap hidden sm:block">
                  {currentQuestion.type === "mcq" ? "Multiple Choice"
                    : currentQuestion.type === "tf" ? "True / False"
                      : currentQuestion.type === "written" ? "Written" : "Code"}
                </div>
              </div>

              <div className="flex-1">
                {currentQuestion.type === "mcq" || currentQuestion.type === "tf" ? (
                  <div className="grid grid-cols-1 gap-4">
                    {currentQuestion.options?.map((opt, j) => {
                      const isSelected = selected[currentIndex] === opt;
                      let style = "border-white/10 hover:border-white/30";
                      let indicatorStyle = "border-white/20 text-transparent";

                      if (revealed) {
                        if (opt === currentQuestion.answer) {
                          style = "border-emerald-500 bg-emerald-500/10 shadow-[0_0_20px_rgba(16,185,129,0.1)]";
                          indicatorStyle = "text-emerald-400 border-emerald-400";
                        } else if (isSelected && !isCorrect) {
                          style = "border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.1)]";
                          indicatorStyle = "text-rose-400 border-rose-400";
                        } else {
                          style = "border-white/5 opacity-50";
                        }
                      } else if (isSelected) {
                        style = "border-brand-accent1 bg-brand-accent1/10 shadow-[0_0_20px_rgba(99,102,241,0.1)] translate-x-2";
                        indicatorStyle = "text-brand-accent1 border-brand-accent1";
                      }

                      return (
                        <button key={j} disabled={revealed}
                          onClick={() => {
                            const copy = [...selected];
                            copy[currentIndex] = opt;
                            setSelected(copy);
                          }}
                          className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${style}`}>
                          <span className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                          <div className="flex items-center gap-4 relative z-10">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${indicatorStyle}`}>
                              {(isSelected || (revealed && opt === currentQuestion.answer)) && (
                                <div className="w-3 h-3 bg-current rounded-full" />
                              )}
                            </div>
                            <span className="text-lg font-medium tracking-wide">{opt}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea disabled={revealed} value={selected[currentIndex] || ""}
                    onChange={(e) => {
                      const copy = [...selected];
                      copy[currentIndex] = e.target.value;
                      setSelected(copy);
                    }}
                    className="w-full p-5 rounded-2xl bg-black/30 border border-white/10 min-h-[150px]" />
                )}

                <AnimatePresence>
                  {revealed && (
                    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }} className="mt-6 space-y-3">

                      {/* Result header */}
                      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${isCorrect ? "bg-emerald-500/10 border-emerald-500/25" : "bg-rose-500/10 border-rose-500/25"
                        }`}>
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                          }`}>
                          {isCorrect ? <Lucide.Check className="w-5 h-5" /> : <Lucide.X className="w-5 h-5" />}
                        </div>
                        <h3 className={`text-lg font-extrabold ${isCorrect ? "text-emerald-400" : "text-rose-400"}`}>
                          {isCorrect ? "Correct! Well done." : "Not quite right"}
                        </h3>
                      </div>

                      {/* Correct answer */}
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

                      {/* Your answer */}
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

                      {/* Written/code AI explanation */}
                      {!isCorrect && (currentQuestion.type === "written" || currentQuestion.type === "code") && writtenExplanation && (
                        <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-amber-500/8 border border-amber-500/20">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lucide.AlertCircle className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs text-amber-500/70 uppercase tracking-widest font-bold mb-1">Why your answer is incorrect</p>
                            <p className="text-sm text-white/80 leading-relaxed">{writtenExplanation}</p>
                          </div>
                        </div>
                      )}

                      {/* MCQ/TF: Why ALL wrong options are wrong (always shown) */}
                      {(currentQuestion.type === "mcq" || currentQuestion.type === "tf") && (() => {
                        const incorrectMap = typeof currentQuestion.explanation === "object"
                          ? (currentQuestion.explanation as Explanation).incorrect ?? {}
                          : {};
                        const entries = getWrongEntries(currentQuestion.options, currentQuestion.answer, incorrectMap);
                        return entries.length > 0 ? (
                          <div className="rounded-2xl bg-amber-500/8 border border-amber-500/20 overflow-hidden">
                            <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/15">
                              <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                                <Lucide.AlertCircle className="w-4 h-4 text-amber-400" />
                              </div>
                              <p className="text-xs text-amber-500/70 uppercase tracking-widest font-bold">Why each option is wrong</p>
                            </div>
                            <div className="divide-y divide-white/5">
                              {entries.map(({ opt, text }) => {
                                const isUserChoice = opt === selected[currentIndex];
                                return (
                                  <div key={opt} className={`px-5 py-3.5 ${isUserChoice ? "bg-rose-500/8" : ""}`}>
                                    <p className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${isUserChoice ? "text-rose-400" : "text-white/40"}`}>
                                      {isUserChoice && <Lucide.ArrowRight className="w-3 h-3" />}
                                      {opt}
                                      {isUserChoice && <span className="text-rose-400/60 font-normal">(your choice)</span>}
                                    </p>
                                    <p className="text-sm text-white/70 leading-relaxed">{text}</p>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ) : null;
                      })()}

                      {/* Explanation — why correct is correct */}
                      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl bg-white/[0.04] border border-white/10">
                        <div className="w-7 h-7 rounded-lg bg-brand-accent1/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Lucide.BookOpen className="w-4 h-4 text-brand-accent1" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-brand-accent1/60 uppercase tracking-widest font-bold mb-1">Explanation</p>
                          <p className="text-sm text-white/75 leading-relaxed">
                            {typeof currentQuestion.explanation === "object"
                              ? (currentQuestion.explanation as Explanation).correct
                              : currentQuestion.explanation || "Great understanding of this concept."}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button onClick={handleRevealOrNext}
                  disabled={(!selected[currentIndex]?.trim() && !revealed)}
                  className="w-full relative group overflow-hidden rounded-2xl p-[2px] mt-8 disabled:opacity-40">
                  <span className="absolute inset-0 bg-gradient-to-r from-brand-accent1 via-brand-accent2 to-brand-accent1 bg-[length:200%_auto] animate-gradient-slow" />
                  <div className="relative bg-brand-dark px-8 py-5 rounded-[14px] flex items-center justify-center gap-3 transition-all group-hover:bg-opacity-0">
                    <span className="text-lg font-bold text-white">
                      {!revealed ? "Check Answer"
                        : currentIndex === questions.length - 1 ? "Finish Quiz"
                          : "Next Question"}
                    </span>
                    {revealed && <Lucide.ArrowRight className="w-5 h-5 text-white" />}
                  </div>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        {submitted && result && (
          <div className="space-y-10 pt-10">
            <div className="glass-card p-8 sm:p-10 text-center relative overflow-hidden space-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-accent1/10 blur-[100px] rounded-full pointer-events-none" />
              <div className="relative w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-brand-accent1 to-brand-accent2 flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)]">
                <Lucide.Trophy className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl font-extrabold text-white relative">Quiz Complete!</h2>
              <p className="text-4xl font-black text-indigo-400 relative">{result.score} / {result.total}</p>
              <p className="text-white/50 relative">{result.percent}% Accuracy</p>
            </div>

            <div className="space-y-5">
              {questions.map((q, index) => {
                const userAnswer = selected[index];
                const correct = userAnswer?.trim().toLowerCase() === q.answer.trim().toLowerCase();
                const incorrectMap = typeof q.explanation === "object"
                  ? (q.explanation as Explanation).incorrect ?? {}
                  : {};
                const wrongEntries = getWrongEntries(q.options, q.answer, incorrectMap);

                return (
                  <motion.div key={index} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`p-6 rounded-2xl border space-y-4 ${correct ? "bg-emerald-500/5 border-emerald-500/15" : "bg-rose-500/5 border-rose-500/15"}`}>

                    {/* Question */}
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${correct ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"}`}>
                        {correct ? <Lucide.Check className="w-4 h-4" /> : <Lucide.X className="w-4 h-4" />}
                      </div>
                      <p className="text-base font-semibold text-white leading-relaxed">{index + 1}. {q.question}</p>
                    </div>

                    <div className="pl-10 space-y-3">
                      {/* Answer boxes */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1 p-3 rounded-xl bg-black/20 border border-white/5">
                          <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Your Answer</p>
                          <p className={`font-medium text-sm ${correct ? "text-emerald-400" : "text-rose-400"}`}>
                            {userAnswer || "No answer provided"}
                          </p>
                        </div>
                        {!correct && (
                          <div className="flex-1 p-3 rounded-xl bg-black/20 border border-white/5">
                            <p className="text-xs text-white/40 uppercase tracking-widest font-semibold mb-1">Correct Answer</p>
                            <p className="font-medium text-sm text-emerald-400">{q.answer}</p>
                          </div>
                        )}
                      </div>

                      {/* Why correct is correct */}
                      {typeof q.explanation === "object" && (q.explanation as Explanation).correct && (
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8">
                          <Lucide.BookOpen className="w-3.5 h-3.5 text-brand-accent1 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-white/65 leading-relaxed">{(q.explanation as Explanation).correct}</p>
                        </div>
                      )}
                      {typeof q.explanation === "string" && q.explanation && (
                        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8">
                          <Lucide.BookOpen className="w-3.5 h-3.5 text-brand-accent1 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-white/65 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}

                      {/* Why ALL wrong options are wrong */}
                      {(q.type === "mcq" || q.type === "tf") && wrongEntries.length > 0 && (
                        <div className="rounded-xl overflow-hidden border border-amber-500/15">
                          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/8 border-b border-amber-500/10">
                            <Lucide.AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <p className="text-xs text-amber-500/70 uppercase tracking-widest font-bold">Why each option is wrong</p>
                          </div>
                          {wrongEntries.map(({ opt, text }) => {
                            const isUserChoice = opt === userAnswer;
                            return (
                              <div key={opt} className={`px-4 py-3 border-t border-white/5 ${isUserChoice ? "bg-rose-500/8" : ""}`}>
                                <p className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${isUserChoice ? "text-rose-400" : "text-white/40"}`}>
                                  {isUserChoice && <Lucide.ArrowRight className="w-3 h-3" />}
                                  {opt}
                                  {isUserChoice && <span className="text-rose-400/60 font-normal normal-case tracking-normal ml-1">(your choice)</span>}
                                </p>
                                <p className="text-xs text-white/60 leading-relaxed">{text}</p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="text-center">
              <button onClick={() => router.push("/dashboard")}
                className="flex items-center gap-2.5 px-8 py-4 mx-auto rounded-2xl border border-white/20 hover:bg-white/10 text-white font-semibold transition">
                <Lucide.LayoutDashboard className="w-4 h-4" /> Return to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}