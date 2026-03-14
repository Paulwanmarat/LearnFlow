"use client";

import { useEffect, useState, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import API from "@/utils/api";
import Confetti from "react-confetti";
import { motion, useInView, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, BarChart, Bar, Area, AreaChart,
} from "recharts";
import {
  Zap, Flame, Target, TrendingUp, BookOpen, Trophy,
  Star, ChevronRight, Play, Users, Brain, Sparkles,
  ArrowUpRight, Award, Clock, BarChart2,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

interface HistoryEntry {
  date:    string;
  percent: number;
  score:   number;
  total:   number;
  topic?:  string;
}

interface DashboardData {
  username:         string;
  avatar?:          string;
  xp:               number;
  level:            number;
  streak:           number;
  league?:          string;
  quizzesTaken?:    number;
  lessonsGenerated?: number;
  averageScore?:    number;
  accuracy?:        number;
  history:          HistoryEntry[];
}

/* ─── Helpers ───────────────────────────────────────────── */

const XP_PER_LEVEL = 100;

const LEAGUE_CONFIG: Record<string, { label: string; color: string; glow: string; emoji: string }> = {
  Diamond: { label: "Diamond",  color: "text-cyan-300",   glow: "shadow-[0_0_20px_rgba(6,182,212,0.5)]",   emoji: "💎" },
  Platinum: { label: "Platinum", color: "text-violet-300", glow: "shadow-[0_0_20px_rgba(139,92,246,0.5)]",  emoji: "🔮" },
  Gold:    { label: "Gold",     color: "text-yellow-400", glow: "shadow-[0_0_20px_rgba(250,204,21,0.5)]",  emoji: "🏆" },
  Silver:  { label: "Silver",   color: "text-slate-300",  glow: "",                                         emoji: "🥈" },
  Bronze:  { label: "Bronze",   color: "text-amber-600",  glow: "",                                         emoji: "🥉" },
};

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps  = 40;
    const step   = target / steps;
    let   current = 0;
    const id = setInterval(() => {
      current += step;
      if (current >= target) { setVal(target); clearInterval(id); }
      else setVal(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(id);
  }, [target, duration]);
  return val;
}

/* ─── Sub-components ────────────────────────────────────── */

function formatHistoryDate(raw: string | Date): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function XpRing({ progress, level }: { progress: number; level: number }) {
  const r   = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * (progress / 100);

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke="url(#xpGrad)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="xpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black text-white">{level}</span>
        <span className="text-xs text-white/40 font-semibold uppercase tracking-widest">Level</span>
      </div>
    </div>
  );
}

function StatPill({
  icon, label, value, color, delay = 0,
}: {
  icon: React.ReactNode; label: string; value: string | number; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-white/40 font-medium">{label}</p>
        <p className="text-base font-extrabold text-white truncate">{value}</p>
      </div>
    </motion.div>
  );
}

function ActionCard({
  icon, title, desc, cta, onClick, gradient, delay = 0,
}: {
  icon: React.ReactNode; title: string; desc: string;
  cta: string; onClick: () => void; gradient: string; delay?: number;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left glass-card p-6 relative overflow-hidden group"
    >
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/50 mb-4 leading-relaxed">{desc}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 group-hover:gap-3 transition-all">
          {cta} <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </motion.button>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1227] border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-lg font-extrabold text-white">{payload[0].value}%</p>
    </div>
  );
};

/* ─── Avatar ────────────────────────────────────────────── */
function UserAvatar({ src, name, size = "lg" }: { src?: string; name: string; size?: "md" | "lg" | "xl" }) {
  const [err, setErr] = useState(false);
  const dims: Record<string, string> = {
    md: "w-14 h-14 text-xl",
    lg: "w-20 h-20 text-3xl",
    xl: "w-28 h-28 text-4xl",
  };
  const dim = dims[size];
  if (src && !err) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        className={`${dim} rounded-full object-cover border-4 border-white/10 flex-shrink-0 ring-4 ring-cyan-500/20`} />
    );
  }
  return (
    <div className={`${dim} rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-4 border-white/10 flex items-center justify-center font-black text-white flex-shrink-0 ring-4 ring-cyan-500/20`}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   DASHBOARD PAGE
═══════════════════════════════════════════════════════════ */

export default function Dashboard() {
  const router = useRouter();

  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(false);

  const analyticsRef = useRef<HTMLDivElement>(null);
  const analyticsInView = useInView(analyticsRef, { once: true, margin: "-100px" });

  useEffect(() => {
    API.get("/dashboard")
      .then((res) => {
        const d = res.data?.user ?? res.data;
        setData({
          username:         d.username       ?? "",
          avatar:           d.avatar,
          xp:               d.xp             ?? 0,
          level:            d.level          ?? 1,
          streak:           d.streak         ?? 0,
          league:           d.league         ?? "Bronze",
          quizzesTaken:     d.quizzesTaken   ?? 0,
          lessonsGenerated: d.lessonsGenerated ?? 0,
          averageScore:     d.averageScore   ?? 0,
          accuracy:         d.accuracy       ?? 0,
          history:          d.history        ?? [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayXp    = useCountUp(data?.xp ?? 0);
  const displayStreak = useCountUp(data?.streak ?? 0, 800);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"
        />
      </div>
    );
  }

  if (!data) return null;

  const progress     = ((data.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
  const xpToNext     = XP_PER_LEVEL - (data.xp % XP_PER_LEVEL);
  const league       = data.league ?? "Bronze";
  const lCfg         = LEAGUE_CONFIG[league] ?? LEAGUE_CONFIG.Bronze;
  const recentHistory = data.history.slice(-10).map((h) => ({
    ...h,
    date: formatHistoryDate(h.date),
  }));

  const avgScore = data.history.length
    ? Math.round(data.history.reduce((a, h) => a + h.percent, 0) / data.history.length)
    : 0;

  return (
    <ProtectedRoute>
      {levelUp && <Confetti recycle={false} numberOfPieces={300} />}
      <Navbar />

      {/* Ambient background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[400px] bg-cyan-600/6 blur-[120px] rounded-full" />
      </div>

      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-6 relative z-10">

        {/* ══════════════════════════════════════
            HERO — avatar + greeting + quick stats
        ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar */}
            <div className="relative">
              <UserAvatar src={data.avatar} name={data.username} size="xl" />
              {data.streak > 0 && (
                <div className="absolute -bottom-2 -right-2 bg-orange-500 border-2 border-[#020617] rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-white" />
                  <span className="text-xs font-black text-white">{data.streak}</span>
                </div>
              )}
            </div>

            {/* Name + league + XP ring */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  Welcome back,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                    {data.username}
                  </span>
                </h1>
              </div>

              {/* League badge */}
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${lCfg.color} ${lCfg.glow} mb-4`}>
                {lCfg.emoji} {league} League
              </span>

              {/* Quick stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatPill icon={<Zap className="w-4 h-4" />}    label="Total XP"   value={displayXp.toLocaleString()} color="bg-indigo-500/20 text-indigo-400"  delay={0.1} />
                <StatPill icon={<Flame className="w-4 h-4" />}   label="Day Streak" value={`${displayStreak} days`}     color="bg-orange-500/20 text-orange-400"  delay={0.15} />
                <StatPill icon={<Target className="w-4 h-4" />}  label="Avg Score"  value={`${avgScore}%`}             color="bg-pink-500/20 text-pink-400"      delay={0.2} />
                <StatPill icon={<BookOpen className="w-4 h-4" />} label="Quizzes"  value={data.quizzesTaken ?? 0}      color="bg-emerald-500/20 text-emerald-400" delay={0.25} />
              </div>
            </div>

            {/* XP Ring */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <XpRing progress={progress} level={data.level} />
              <p className="text-xs text-white/30 text-center">
                <span className="text-white/70 font-bold">{xpToNext} XP</span> to next level
              </p>
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════
            ACTION CARDS
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionCard
            icon={<Brain className="w-6 h-6 text-cyan-400" />}
            title="Start Learning"
            desc="Generate AI-powered lessons on any topic. Adaptive difficulty adjusts as you improve."
            cta="Go to Learning Lab"
            onClick={() => router.push("/learning")}
            gradient="bg-gradient-to-br from-cyan-600/10 to-indigo-600/10"
            delay={0.1}
          />
          <ActionCard
            icon={<Play className="w-6 h-6 text-violet-400" />}
            title="Adaptive Mode"
            desc="Let the AI challenge you with personalized questions based on your weak spots."
            cta="Start Adaptive Quiz"
            onClick={() => router.push("/adaptive")}
            gradient="bg-gradient-to-br from-violet-600/10 to-pink-600/10"
            delay={0.15}
          />
          <ActionCard
            icon={<Trophy className="w-6 h-6 text-yellow-400" />}
            title="Leaderboard"
            desc="See where you rank globally and compete against top learners this week."
            cta="View Rankings"
            onClick={() => router.push("/leaderboard")}
            gradient="bg-gradient-to-br from-yellow-600/10 to-amber-600/10"
            delay={0.2}
          />
        </div>

        {/* ══════════════════════════════════════
            PERFORMANCE STATS ROW
        ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { icon: <BarChart2 className="w-5 h-5" />, label: "Accuracy",  value: `${data.accuracy ?? 0}%`,          color: "from-cyan-500/20 to-cyan-500/5",    accent: "text-cyan-400",   border: "border-cyan-500/10" },
            { icon: <Sparkles  className="w-5 h-5" />, label: "Lessons",   value: data.lessonsGenerated ?? 0,         color: "from-violet-500/20 to-violet-500/5", accent: "text-violet-400", border: "border-violet-500/10" },
            { icon: <Award     className="w-5 h-5" />, label: "Best Score", value: data.history.length ? `${Math.max(...data.history.map(h => h.percent))}%` : "—", color: "from-yellow-500/20 to-yellow-500/5", accent: "text-yellow-400", border: "border-yellow-500/10" },
            { icon: <Clock     className="w-5 h-5" />, label: "This Level", value: `${data.xp % XP_PER_LEVEL}/${XP_PER_LEVEL} XP`, color: "from-emerald-500/20 to-emerald-500/5", accent: "text-emerald-400", border: "border-emerald-500/10" },
          ].map(({ icon, label, value, color, accent, border }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              className={`glass-card p-5 bg-gradient-to-b ${color} border ${border}`}
            >
              <div className={`${accent} mb-3`}>{icon}</div>
              <p className="text-2xl font-extrabold text-white mb-1">{value}</p>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ══════════════════════════════════════
            ANALYTICS
        ══════════════════════════════════════ */}
        <motion.div
          ref={analyticsRef}
          initial={{ opacity: 0, y: 24 }}
          animate={analyticsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-bold text-white">Performance Analytics</h2>
            </div>
            {data.history.length > 0 && (
              <span className="text-xs text-white/30 font-medium">
                Last {Math.min(data.history.length, 10)} quizzes
              </span>
            )}
          </div>

          {data.history.length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
              <Brain className="w-12 h-12 text-white/20 mx-auto mb-3" />
              <p className="text-white/40 font-medium">No quiz data yet.</p>
              <p className="text-white/20 text-sm mt-1">Complete your first quiz to see analytics here.</p>
              <button
                onClick={() => router.push("/learning")}
                className="mt-5 px-5 py-2.5 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 text-sm font-semibold rounded-xl transition-all"
              >
                Start Learning →
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">

              {/* Area chart — score trend */}
              <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-4">Score Trend</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={recentHistory} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="transparent" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickLine={false} dy={8} />
                      <YAxis stroke="transparent" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickLine={false} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="percent" stroke="#6366f1" strokeWidth={2.5}
                        fill="url(#areaGrad)" dot={{ fill: "#0f172a", stroke: "#6366f1", strokeWidth: 2, r: 3 }}
                        activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar chart — distribution */}
              <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-4">Score Distribution</p>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={recentHistory} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#a855f7" stopOpacity={1} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="date" stroke="transparent" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickLine={false} dy={8} />
                      <YAxis stroke="transparent" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickLine={false} domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      <Bar dataKey="percent" fill="url(#barGrad)" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* ══════════════════════════════════════
            ACTIVITY SUMMARY
        ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="glass-card p-6 sm:p-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <BarChart2 className="w-5 h-5 text-violet-400" />
              <h2 className="text-xl font-bold text-white">Learning Activity</h2>
            </div>
            <span className="text-xs text-white/30 font-medium">Lessons vs Quizzes</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

            {/* Lessons vs Quizzes comparison bars */}
            <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5 space-y-5">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">Total Activity</p>

              {/* Lessons bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-white/60">Lessons Generated</span>
                  </div>
                  <span className="text-sm font-extrabold text-violet-400">{data.lessonsGenerated ?? 0}</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(((data.lessonsGenerated ?? 0) / Math.max((data.lessonsGenerated ?? 0) + (data.quizzesTaken ?? 0), 1)) * 100, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full"
                  />
                </div>
              </div>

              {/* Quizzes bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-xs font-semibold text-white/60">Quizzes Taken</span>
                  </div>
                  <span className="text-sm font-extrabold text-emerald-400">{data.quizzesTaken ?? 0}</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${Math.min(((data.quizzesTaken ?? 0) / Math.max((data.lessonsGenerated ?? 0) + (data.quizzesTaken ?? 0), 1)) * 100, 100)}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.15 }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  />
                </div>
              </div>

              {/* Accuracy bar */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-3.5 h-3.5 text-pink-400" />
                    <span className="text-xs font-semibold text-white/60">Overall Accuracy</span>
                  </div>
                  <span className="text-sm font-extrabold text-pink-400">{data.accuracy ?? 0}%</span>
                </div>
                <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: `${data.accuracy ?? 0}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
                    className="h-full bg-gradient-to-r from-pink-500 to-rose-400 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Score histogram — how many quizzes landed in each score band */}
            <div className="bg-white/[0.03] rounded-2xl p-5 border border-white/5">
              <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-4">Score Bands</p>
              {data.history.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-white/20 text-sm">
                  No quiz data yet
                </div>
              ) : (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { band: "0–40",  count: data.history.filter(h => h.percent <= 40).length },
                        { band: "41–60", count: data.history.filter(h => h.percent > 40 && h.percent <= 60).length },
                        { band: "61–80", count: data.history.filter(h => h.percent > 60 && h.percent <= 80).length },
                        { band: "81–100",count: data.history.filter(h => h.percent > 80).length },
                      ]}
                      margin={{ top: 4, right: 4, left: -28, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#8b5cf6" stopOpacity={1} />
                          <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis dataKey="band" stroke="transparent" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} />
                      <YAxis stroke="transparent" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.04)" }}
                        contentStyle={{ backgroundColor: "#0d1227", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px" }}
                        itemStyle={{ color: "#fff" }}
                        formatter={(v: any) => [`${v} quiz${v !== 1 ? "zes" : ""}`, "Count"]}
                      />
                      <Bar dataKey="count" fill="url(#bandGrad)" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════
            ABOUT COGNIVRA
        ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="glass-card overflow-hidden"
        >
          {/* Banner */}
          <div className="relative w-full aspect-[21/6] sm:aspect-[21/5]">
            <Image src="/Logo2.png" alt="Cognivra" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/30 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                About{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                  Cognivra Adaptive
                </span>
              </h2>
              <p className="text-white/50 text-sm mt-1">Intelligent AI-Powered Adaptive Learning</p>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <p className="text-white/60 leading-relaxed">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-semibold">
                Cognivra Adaptive
              </span>{" "}
              is an AI-powered platform that personalizes education by analyzing your quiz performance,
              tracking progress, and dynamically adjusting difficulty to strengthen weak areas while
              reinforcing mastered concepts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: "📊", title: "Performance Tracking",  desc: "Real-time analytics visualize your score trends, XP growth, and concept mastery over time." },
                { icon: "🚀", title: "Adaptive Intelligence", desc: "The system detects weak topics and generates targeted questions to optimize learning efficiency." },
                { icon: "🏆", title: "Gamified Motivation",   desc: "XP, levels, streaks, and leaderboards keep you engaged while building consistent habits." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
                  <span className="text-2xl mb-3 block">{icon}</span>
                  <h4 className="text-white font-semibold text-sm mb-2">{title}</h4>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ══════════════════════════════════════
            TEAM SECTION
        ══════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="glass-card p-6 sm:p-10"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="relative w-24 h-24 mb-5">
              <Image src="/RTM.png" alt="Return To Monkey" fill className="object-contain" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Member of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
                Saipanyarangsit School
              </span>
            </h2>
            <p className="text-white/40 mt-2 text-sm">
              Team <span className="text-white font-semibold">Return To Monkey</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { src: "/1.png", name: "Phanyawat Wanmarat",   grade: "Grade 11", accent: "border-brand-accent1/40 shadow-[0_0_40px_rgba(99,102,241,0.25)]" },
              { src: "/2.png", name: "Sher Youprayong",      grade: "Grade 11", accent: "border-brand-accent2/40 shadow-[0_0_40px_rgba(168,85,247,0.25)]" },
              { src: "/3.png", name: "Panathorn Limthongkun", grade: "Grade 11", accent: "border-emerald-400/40 shadow-[0_0_40px_rgba(16,185,129,0.25)]" },
            ].map(({ src, name, grade, accent }) => (
              <motion.div
                key={name}
                whileHover={{ y: -6 }}
                className="bg-white/[0.03] border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center group"
              >
                <div className={`relative w-28 h-28 rounded-full overflow-hidden border-4 mb-4 group-hover:scale-105 transition-transform duration-300 ${accent}`}>
                  <Image src={src} alt={name} fill className="object-cover" />
                </div>
                <h4 className="text-white font-semibold text-lg">{name}</h4>
                <p className="text-white/40 text-sm mt-1">{grade}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-white/25 text-xs tracking-widest">
              © 2026 Return To Monkey · All rights reserved
            </p>
          </div>
        </motion.div>

      </div>
    </ProtectedRoute>
  );
}

/* ─── StatCard kept for compatibility ───────────────────── */
function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }}
      className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-10 group-hover:opacity-25 transition-opacity bg-current ${color}`} />
      <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">{title}</h3>
      <p className={`text-4xl font-black ${color}`}>{value}</p>
    </motion.div>
  );
}