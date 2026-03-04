"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import API from "@/utils/api";
import ProgressBar from "@/components/ProgressBar";
import Confetti from "react-confetti";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

export default function Dashboard() {
  const [xp, setXp] = useState(0);
  const [displayXp, setDisplayXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [name, setName] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [history, setHistory] = useState<any[]>([]);
  const [levelUp] = useState(false);

  const router = useRouter();

  /* ================= FETCH DASHBOARD DATA ================= */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get("/dashboard");

        setName(res.data.username);
        setXp(res.data.xp);
        setLevel(res.data.level);
        setStreak(res.data.streak);
        setHistory(res.data.history || []);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      }
    };

    fetchData();
  }, []);

  /* ================= XP ANIMATION ================= */
  useEffect(() => {
    let start = 0;

    const interval = setInterval(() => {
      start += Math.ceil(xp / 30);

      if (start >= xp) {
        start = xp;
        clearInterval(interval);
      }

      setDisplayXp(start);
    }, 20);

    return () => clearInterval(interval);
  }, [xp]);

  const xpForNextLevel = 100;
  const progress = ((xp % xpForNextLevel) / xpForNextLevel) * 100;

  const averageScore =
    history.length === 0
      ? 0
      : Math.round(
        history.reduce((acc, h) => acc + h.percent, 0) /
        history.length
      );

  return (
    <ProtectedRoute>
      {levelUp && <Confetti />}

      <div className="min-h-screen pt-24 pb-12 px-8 max-w-7xl mx-auto space-y-10 relative z-10">

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-end"
        >
          <div>
            <h1 className="text-5xl font-extrabold mb-3">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">{name || "Learner"}</span> 👑
            </h1>
            <p className="text-white/60 text-lg">Here&apos;s your learning progress overview.</p>
          </div>
        </motion.div>

        {/* MAIN STATS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
        >
          <StatCard title="Total XP" value={displayXp} color="text-indigo-400" />
          <StatCard title="Current Level" value={level} color="text-emerald-400" />
          <StatCard title="Day Streak 🔥" value={streak} color="text-orange-400" />
          <StatCard title="Average Score" value={`${averageScore}%`} color="text-pink-400" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* PROGRESS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-1 glass-card p-8 flex flex-col justify-center"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Level Progress</h3>
              <span className="text-brand-accent1 font-bold bg-brand-accent1/10 px-4 py-1.5 rounded-full text-sm border border-brand-accent1/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">Lvl {level + 1}</span>
            </div>

            <ProgressBar progress={progress} />

            <div className="flex justify-between items-center mt-5">
              <p className="text-sm font-medium text-white/50">{xp % xpForNextLevel} XP</p>
              <p className="text-sm font-medium text-white/50">{xpForNextLevel} XP</p>
            </div>
          </motion.div>

          {/* ACTION BUTTONS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-2 glass-card p-8 flex flex-col sm:flex-row gap-6 items-center justify-center relative overflow-hidden"
          >
            {/* Background decorative glow */}
            <div className="absolute w-[300px] h-[300px] bg-brand-accent1/20 blur-[80px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>

            <button
              onClick={() => router.push("/learning")}
              className="w-full sm:w-auto btn-primary px-8 py-5 text-lg items-center justify-center flex gap-3 relative z-10"
            >
              <span>Start Learning</span>
              <span className="text-2xl">🚀</span>
            </button>

            <button
              onClick={() => router.push("/leaderboard")}
              className="w-full sm:w-auto btn-secondary px-8 py-5 text-lg items-center justify-center flex gap-3 relative z-10 border-brand-accent2/40 hover:border-brand-accent2/80 hover:bg-brand-accent2/10 shadow-[0_0_20px_rgba(168,85,247,0.1)]"
            >
              <span>View Leaderboard</span>
              <span className="text-2xl">🏆</span>
            </button>
          </motion.div>
        </div>

        {/* ANALYTICS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-8 space-y-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Performance Analytics
            </h2>
            <span className="text-2xl">📊</span>
          </div>

          {history.length === 0 ? (
            <div className="py-16 text-center bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
              <div className="w-16 h-16 mx-auto bg-brand-accent1/10 text-brand-accent1 flex items-center justify-center rounded-full mb-4 border border-brand-accent1/20">
                <span className="text-2xl">📈</span>
              </div>
              <p className="text-white/40 text-lg">
                No quiz data yet. Start learning to see your analytics!
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-12">

              {/* LINE CHART */}
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                <h3 className="text-white/60 mb-6 font-medium tracking-wider text-xs uppercase">
                  Score Trend
                </h3>
                <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="percent"
                        stroke="#6366f1"
                        strokeWidth={4}
                        dot={{ fill: '#0f172a', stroke: '#6366f1', strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 8, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                        animationDuration={1500}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* BAR CHART */}
              <div className="bg-black/20 p-6 rounded-2xl border border-white/5 shadow-inner">
                <h3 className="text-white/60 mb-6 font-medium tracking-wider text-xs uppercase">
                  Score Distribution
                </h3>
                <div className="h-[250px] w-full mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={history} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis stroke="rgba(255,255,255,0.3)" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar
                        dataKey="percent"
                        fill="url(#colorPercent)"
                        radius={[6, 6, 0, 0]}
                        animationDuration={1500}
                      />
                      <defs>
                        <linearGradient id="colorPercent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#a855f7" stopOpacity={1} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}
        </motion.div>
        {/* PROJECT DESCRIPTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-10 space-y-6"
        >
          {/* BIG HERO LOGO */}
          <div className="flex flex-col items-center text-center space-y-8">

            <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.25)] border border-white/10">
              <Image
                src="/learnflow1.jpg"
                alt="LearnFlow Logo"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">LearnFlow</span>
              </h2>
              <p className="text-white/50 mt-3 text-lg">
                Intelligent AI-Powered Adaptive Learning Platform
              </p>
            </div>

          </div>

          <p className="text-white/70 leading-relaxed text-lg">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2 font-semibold">
              LearnFlow
            </span>{" "}
            is an AI-powered adaptive learning platform designed to personalize education.
            It analyzes your quiz performance, tracks your progress, and dynamically adjusts
            question difficulty to strengthen weak areas while reinforcing mastered concepts.
          </p>

          <div className="grid md:grid-cols-3 gap-6 pt-4">

            <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
              <h4 className="text-white font-semibold mb-2">📊 Performance Tracking</h4>
              <p className="text-white/50 text-sm">
                Real-time analytics visualize your score trends, XP growth,
                and concept mastery over time.
              </p>
            </div>

            <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
              <h4 className="text-white font-semibold mb-2">🚀 Adaptive Intelligence</h4>
              <p className="text-white/50 text-sm">
                The system detects weak topics and generates targeted practice
                questions to optimize learning efficiency.
              </p>
            </div>

            <div className="bg-black/20 p-6 rounded-2xl border border-white/5">
              <h4 className="text-white font-semibold mb-2">🏆 Gamified Motivation</h4>
              <p className="text-white/50 text-sm">
                XP, levels, streaks, and leaderboards keep you engaged
                while building consistent study habits.
              </p>
            </div>

          </div>
        </motion.div>

        {/* ================= TEAM SECTION ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-10 space-y-10"
        >
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Member of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent1 to-brand-accent2">
                Saipanyarangsit School
              </span>
            </h2>
            <p className="text-white/50">
              Team <span className="font-semibold text-white">Return To Monkey</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {/* MEMBER 1 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-black/20 p-8 rounded-2xl border border-white/5 text-center group"
            >
              <div className="relative w-36 h-36 mx-auto mb-6 rounded-full overflow-hidden border-4 border-brand-accent1/40 shadow-[0_0_40px_rgba(99,102,241,0.3)] group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/1.png"
                  alt="Phanyawat Wanmarat"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="text-white font-semibold text-xl mb-2">
                Phanyawat Wanmarat
              </h4>
              <p className="text-white/50 text-sm">Grade 11</p>
            </motion.div>

            {/* MEMBER 2 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-black/20 p-8 rounded-2xl border border-white/5 text-center group"
            >
              <div className="relative w-36 h-36 mx-auto mb-6 rounded-full overflow-hidden border-4 border-brand-accent2/40 shadow-[0_0_40px_rgba(168,85,247,0.3)] group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/2.png"
                  alt="Sher Youprayong"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="text-white font-semibold text-xl mb-2">
                Sher Youprayong
              </h4>
              <p className="text-white/50 text-sm">Grade 11</p>
            </motion.div>

            {/* MEMBER 3 */}
            <motion.div
              whileHover={{ y: -8 }}
              className="bg-black/20 p-8 rounded-2xl border border-white/5 text-center group"
            >
              <div className="relative w-36 h-36 mx-auto mb-6 rounded-full overflow-hidden border-4 border-emerald-400/40 shadow-[0_0_40px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform duration-300">
                <Image
                  src="/3.png"
                  alt="Panathorn Limthongkun"
                  fill
                  className="object-cover"
                />
              </div>
              <h4 className="text-white font-semibold text-xl mb-2">
                Panathorn Limthongkun
              </h4>
              <p className="text-white/50 text-sm">Grade 11</p>
            </motion.div>

          </div>

          <div className="pt-8 border-t border-white/10 text-center">
            <p className="text-white/40 text-sm tracking-wide">
              © 2026 Return To Monkey. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </ProtectedRoute>
  );
}

/* ================= STAT CARD COMPONENT ================= */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatCard({ title, value, color }: any) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className="glass-card p-6 relative overflow-hidden group shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
    >
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-10 group-hover:opacity-30 transition-opacity bg-current ${color}`}></div>
      <h3 className="text-white/50 text-sm font-medium tracking-wide uppercase mb-2">{title}</h3>
      <p className={`text-4xl font-bold ${color}`}>
        {value}
      </p>
    </motion.div>
  );
}