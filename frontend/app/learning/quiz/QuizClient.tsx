"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import API from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";


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

    /* ================= LOAD QUIZ ================= */
    useEffect(() => {
        const loadQuiz = async () => {
            const res = await API.post("/quiz/generate", {
                content: summary,
                count,
            });

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

    /* ================= TIMER ================= */
    useEffect(() => {
        if (timerPerQuestion <= 0 || submitted) return;

        setTimeLeft(timerPerQuestion);

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (!prev) return timerPerQuestion;
                if (prev <= 1) {
                    handleRevealOrNext();
                    return timerPerQuestion;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentIndex, revealed]);

    const currentQuestion = questions[currentIndex];

    const isCorrect =
        selected[currentIndex]?.trim().toLowerCase() ===
        currentQuestion?.answer?.trim().toLowerCase();

    const progress =
        questions.length === 0
            ? 0
            : ((currentIndex + 1) / questions.length) * 100;

    const handleRevealOrNext = () => {
        if (!revealed) {
            setRevealed(true);
        } else {
            if (currentIndex < questions.length - 1) {
                setCurrentIndex((prev) => prev + 1);
                setRevealed(false);
            } else {
                submitQuiz();
            }
        }
    };

    const submitQuiz = async () => {
        if (submitted) return;

        const formatted = questions.map((q, i) => ({
            question: q.question,
            type: q.type,
            correctAnswer: q.answer,
            userAnswer: selected[i],
            language: q.type === "code" ? selectedLanguage[i] : undefined,
            topic,
            difficulty: q.difficulty || 1,
        }));

        const res = await API.post("/quiz/submit", {
            answers: formatted,
        });

        setResult(res.data);
        setSubmitted(true);
    };

    return (
        <ProtectedRoute>
            <div className="relative min-h-screen text-white overflow-hidden">

                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0b1120] via-[#1e1b4b] to-[#0b1120]" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.15),transparent_40%)]" />

                <div className="pt-28 pb-24 px-6 md:px-12 max-w-4xl mx-auto space-y-10">

                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        Quiz Mode 🧠
                    </h1>

                    {/* Progress */}
                    {!submitted && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm text-white/50">
                                <span>Question {currentIndex + 1}</span>
                                <span>{questions.length}</span>
                            </div>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Question */}
                    <AnimatePresence mode="wait">
                        {currentQuestion && !submitted && (
                            <motion.div
                                key={currentIndex}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -40 }}
                                className="backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-3xl shadow-2xl space-y-6"
                            >
                                <p className="text-xl font-medium leading-relaxed">
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

                                {/* FIXED Explanation Section */}
                                <AnimatePresence>
                                    {revealed && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="p-5 rounded-2xl bg-black/30 border border-white/10 space-y-3"
                                        >
                                            {isCorrect ? (
                                                <>
                                                    <p className="text-emerald-400 font-semibold">
                                                        ✅ Correct!
                                                    </p>
                                                    {typeof currentQuestion.explanation === "object"
                                                        ? currentQuestion.explanation.correct
                                                        : currentQuestion.explanation ||
                                                        "Great understanding."}
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-rose-400 font-semibold">
                                                        ❌ Incorrect
                                                    </p>
                                                    <p className="text-emerald-400">
                                                        Correct Answer: {currentQuestion.answer}
                                                    </p>

                                                    {typeof currentQuestion.explanation === "object" && (
                                                        <>
                                                            <p className="text-white/70">
                                                                {currentQuestion.explanation.correct}
                                                            </p>
                                                            {currentQuestion.explanation.incorrect?.[
                                                                selected[currentIndex]
                                                            ] && (
                                                                    <p className="text-rose-300">
                                                                        {
                                                                            currentQuestion.explanation.incorrect[
                                                                            selected[currentIndex]
                                                                            ]
                                                                        }
                                                                    </p>
                                                                )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={handleRevealOrNext}
                                    disabled={!selected[currentIndex]?.trim()}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-500 font-semibold shadow-lg disabled:opacity-50"
                                >
                                    {!revealed
                                        ? "Submit Answer"
                                        : currentIndex === questions.length - 1
                                            ? "Finish Quiz"
                                            : "Next →"}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* RESULTS + FULL REVIEW */}
                    {submitted && result && (
                        <div className="space-y-10 pt-10">

                            {/* Header */}
                            <div className="text-center space-y-4">
                                <h2 className="text-4xl font-bold">🎉 Quiz Completed!</h2>

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
                                    const correct = userAnswer?.trim().toLowerCase() === q.answer.trim().toLowerCase();

                                    return (
                                        <div
                                            key={index}
                                            className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4"
                                        >
                                            {/* Question */}
                                            <p className="text-lg font-semibold">
                                                {index + 1}. {q.question}
                                            </p>

                                            {/* User Answer */}
                                            <div>
                                                <p className="text-sm text-white/50">Your Answer:</p>
                                                <p className={correct ? "text-emerald-400" : "text-rose-400"}>
                                                    {userAnswer || "No answer provided"}
                                                </p>
                                            </div>

                                            {/* Correct Answer */}
                                            {!correct && (
                                                <div>
                                                    <p className="text-sm text-white/50">Correct Answer:</p>
                                                    <p className="text-emerald-400">
                                                        {q.answer}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Explanation */}
                                            {q.explanation && (
                                                <div className="pt-2 border-t border-white/10">
                                                    <p className="text-sm text-white/50 mb-1">Explanation:</p>

                                                    {typeof q.explanation === "string" ? (
                                                        <p className="text-white/70">{q.explanation}</p>
                                                    ) : (
                                                        <>
                                                            <p className="text-white/70">
                                                                {q.explanation.correct}
                                                            </p>

                                                            {!correct &&
                                                                q.explanation.incorrect?.[userAnswer] && (
                                                                    <p className="text-rose-300 mt-1">
                                                                        {
                                                                            q.explanation.incorrect[userAnswer]
                                                                        }
                                                                    </p>
                                                                )}
                                                        </>
                                                    )}
                                                </div>
                                            )}

                                            {/* Status Badge */}
                                            <div className="pt-2">
                                                {correct ? (
                                                    <span className="text-emerald-400 font-semibold">
                                                        ✅ Correct
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-400 font-semibold">
                                                        ❌ Incorrect
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Back Button */}
                            <div className="text-center">
                                <button
                                    onClick={() => router.push("/dashboard")}
                                    className="px-8 py-4 rounded-2xl border border-white/20 hover:bg-white/10 transition"
                                >
                                    Return to Dashboard
                                </button>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}