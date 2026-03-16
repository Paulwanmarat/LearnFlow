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
  XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, Area, AreaChart, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import {
  Zap, Flame, Target, TrendingUp, BookOpen, Trophy,
  Star, ChevronRight, Play, Users, Brain, Sparkles,
  ArrowUpRight, Award, Clock, BarChart2, LineChart,
  Cpu, Layers, GraduationCap, School, User,
} from "lucide-react";

/* ─── Types ──────────────────────────────────────────────── */

interface HistoryEntry {
  date:    string;
  percent: number;
  score:   number;
  total:   number;
  topic?:  string;
}

interface DashboardData {
  username:          string;
  avatar?:           string;
  xp:                number;
  level:             number;
  streak:            number;
  league?:           string;
  quizzesTaken?:     number;
  lessonsGenerated?: number;
  averageScore?:     number;
  accuracy?:         number;
  history:           HistoryEntry[];
}

/* ─── Constants ──────────────────────────────────────────── */

const XP_PER_LEVEL = 100;

const LEAGUE_CONFIG: Record<string, { label: string; color: string; glow: string; emoji: string }> = {
  Diamond: { label: "Diamond",  color: "text-cyan-300",   glow: "shadow-[0_0_20px_rgba(6,182,212,0.5)]",   emoji: "💎" },
  Platinum: { label: "Platinum", color: "text-violet-300", glow: "shadow-[0_0_20px_rgba(139,92,246,0.5)]",  emoji: "🔮" },
  Gold:    { label: "Gold",     color: "text-yellow-400", glow: "shadow-[0_0_20px_rgba(250,204,21,0.5)]",  emoji: "🏆" },
  Silver:  { label: "Silver",   color: "text-slate-300",  glow: "",                                         emoji: "🥈" },
  Bronze:  { label: "Bronze",   color: "text-amber-600",  glow: "",                                         emoji: "🥉" },
};

/* ─── Helpers ────────────────────────────────────────────── */

function useCountUp(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (target === 0) return;
    const steps   = 40;
    const step    = target / steps;
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

/** "Mar 16" */
function shortDate(raw: string | Date): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** "Mar 16 14:30" — used when the same calendar day appears more than once */
function shortDateTime(raw: string | Date): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  const date = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const time = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} ${time}`;
}

/** "Mar 16, 2026 14:30" — tooltip label */
function fullDateTime(raw: string | Date): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return String(raw);
  return d.toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

/**
 * Backend stores history newest-first ($position: 0).
 * Reverse so charts run oldest → newest left-to-right.
 */
function chronoHistory(history: HistoryEntry[], limit = 10): HistoryEntry[] {
  return [...history].reverse().slice(-limit);
}

/**
 * Build chart entries with smart X-axis labels:
 *  - If every date is unique → "Mar 16"
 *  - If any date repeats     → "Mar 16 14:30" for ALL entries
 *    (keeps the axis consistent and disambiguates same-day quizzes)
 */
function buildChartData(history: HistoryEntry[], limit = 10) {
  const entries    = chronoHistory(history, limit);
  const dateLabels = entries.map(h => shortDate(h.date));
  const hasDups    = dateLabels.length !== new Set(dateLabels).size;

  return entries.map((h) => ({
    ...h,
    label:     hasDups ? shortDateTime(h.date) : shortDate(h.date),
    labelFull: fullDateTime(h.date),
  }));
}

/* ─── Sub-components ─────────────────────────────────────── */

function XpRing({ progress, level }: { progress: number; level: number }) {
  const r    = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * (progress / 100);
  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <motion.circle cx="60" cy="60" r={r} fill="none" stroke="url(#xpGrad)" strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }} animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.4, ease: "easeOut" }} />
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

function StatPill({ icon, label, value, color, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string | number; color: string; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-white/40 font-medium">{label}</p>
        <p className="text-base font-extrabold text-white truncate">{value}</p>
      </div>
    </motion.div>
  );
}

function ActionCard({ icon, title, desc, cta, onClick, gradient, delay = 0 }: {
  icon: React.ReactNode; title: string; desc: string;
  cta: string; onClick: () => void; gradient: string; delay?: number;
}) {
  return (
    <motion.button initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay }} whileHover={{ y: -4, scale: 1.02 }} whileTap={{ scale: 0.98 }}
      onClick={onClick} className="w-full text-left glass-card p-6 relative overflow-hidden group">
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${gradient}`} />
      <div className="relative z-10">
        <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">{icon}</div>
        <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/50 mb-4 leading-relaxed">{desc}</p>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-400 group-hover:gap-3 transition-all">
          {cta} <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </motion.button>
  );
}

/** Rich tooltip: date+time, score, fraction */
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const h = payload[0].payload;
  return (
    <div className="bg-[#0d1227] border border-white/10 rounded-xl px-4 py-3 shadow-2xl min-w-[170px]">
      <p className="text-[11px] text-white/40 mb-1 font-medium leading-tight">{h.labelFull}</p>
      <p className="text-2xl font-extrabold text-white leading-none">{h.percent}%</p>
      <p className="text-xs text-white/30 mt-1">{h.score} / {h.total} correct</p>
    </div>
  );
};

function UserAvatar({ src, name, size = "lg" }: { src?: string; name: string; size?: "md" | "lg" | "xl" }) {
  const [err, setErr] = useState(false);
  const dims: Record<string, string> = { md: "w-14 h-14 text-xl", lg: "w-20 h-20 text-3xl", xl: "w-28 h-28 text-4xl" };
  if (src && !err)
    return <img src={src} alt={name} onError={() => setErr(true)}
      className={`${dims[size]} rounded-full object-cover border-4 border-white/10 flex-shrink-0 ring-4 ring-cyan-500/20`} />;
  return (
    <div className={`${dims[size]} rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-4 border-white/10 flex items-center justify-center font-black text-white flex-shrink-0 ring-4 ring-cyan-500/20`}>
      {name?.[0]?.toUpperCase() ?? "?"}
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────── */

export default function Dashboard() {
  const router = useRouter();
  const [data,    setData]    = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(false);

  useEffect(() => {
    API.get("/dashboard")
      .then((res) => {
        const d = res.data?.user ?? res.data;
        setData({
          username:         d.username         ?? "",
          avatar:           d.avatar,
          xp:               d.xp               ?? 0,
          level:            d.level            ?? 1,
          streak:           d.streak           ?? 0,
          league:           d.league           ?? "Bronze",
          quizzesTaken:     d.quizzesTaken     ?? 0,
          lessonsGenerated: d.lessonsGenerated ?? 0,
          averageScore:     d.averageScore     ?? 0,
          accuracy:         d.accuracy         ?? 0,
          history:          d.history          ?? [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const displayXp     = useCountUp(data?.xp ?? 0);
  const displayStreak = useCountUp(data?.streak ?? 0, 800);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  /* ── Derived values ── */
  const progress = ((data.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100;
  const xpToNext = XP_PER_LEVEL - (data.xp % XP_PER_LEVEL);
  const league   = data.league ?? "Bronze";
  const lCfg     = LEAGUE_CONFIG[league] ?? LEAGUE_CONFIG.Bronze;

  const avgScore  = data.history.length
    ? Math.round(data.history.reduce((a, h) => a + h.percent, 0) / data.history.length) : 0;
  const bestScore = data.history.length ? Math.max(...data.history.map(h => h.percent)) : 0;

  /* Chart data with smart labels */
  const chartHistory    = buildChartData(data.history, 10);
  const hasSameDayDups  = chartHistory.some(h => h.label.includes(":"));
  const xAxisAngle      = hasSameDayDups ? -45 : -30;
  const xAxisHeight     = hasSameDayDups ? 52   : 36;

  /* Score bands */
  const scoreBands = [
    { band: "0–40",   count: data.history.filter(h => h.percent <= 40).length },
    { band: "41–60",  count: data.history.filter(h => h.percent > 40  && h.percent <= 60).length },
    { band: "61–80",  count: data.history.filter(h => h.percent > 60  && h.percent <= 80).length },
    { band: "81–100", count: data.history.filter(h => h.percent > 80).length },
  ];

  /* Radar: normalised 0-100 per axis */
  const radarData = [
    { skill: "Accuracy",  value: Math.min(avgScore, 100) },
    { skill: "Streak",    value: Math.min(Math.round((data.streak / 30) * 100), 100) },
    { skill: "Avg Score", value: Math.min(avgScore, 100) },
    { skill: "Level",     value: Math.min(Math.round((data.level / 20) * 100), 100) },
    { skill: "Quizzes",   value: Math.min(Math.round(((data.quizzesTaken ?? 0) / 50) * 100), 100) },
  ];

  /* Progress bars: independent max per metric */
  const progressBars = [
    { label: "Lessons Generated", value: data.lessonsGenerated ?? 0, max: Math.max(data.lessonsGenerated ?? 0, 10), color: "from-violet-500 to-purple-400", accent: "text-violet-400", icon: <Sparkles className="w-3 h-3" /> },
    { label: "Quizzes Taken",     value: data.quizzesTaken     ?? 0, max: Math.max(data.quizzesTaken     ?? 0, 10), color: "from-emerald-500 to-teal-400",  accent: "text-emerald-400", icon: <BookOpen className="w-3 h-3" /> },
    { label: "Accuracy",          value: avgScore,                    max: 100,                                       color: "from-pink-500 to-rose-400",     accent: "text-pink-400",    icon: <Target   className="w-3 h-3" />, suffix: "%" },
  ];

  return (
    <ProtectedRoute>
      {levelUp && <Confetti recycle={false} numberOfPieces={300} />}
      <Navbar />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/8 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/3 right-0 w-[500px] h-[400px] bg-cyan-600/6 blur-[120px] rounded-full" />
      </div>

      <div className="min-h-screen pt-20 pb-16 px-4 sm:px-6 md:px-8 max-w-7xl mx-auto space-y-6 relative z-10">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <UserAvatar src={data.avatar} name={data.username} size="xl" />
              {data.streak > 0 && (
                <div className="absolute -bottom-2 -right-2 bg-orange-500 border-2 border-[#020617] rounded-full px-2 py-0.5 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-white" />
                  <span className="text-xs font-black text-white">{data.streak}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                  Welcome back,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">{data.username}</span>
                </h1>
              </div>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/5 border border-white/10 ${lCfg.color} ${lCfg.glow} mb-4`}>
                {lCfg.emoji} {league} League
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatPill icon={<Zap      className="w-4 h-4" />} label="Total XP"   value={displayXp.toLocaleString()} color="bg-indigo-500/20 text-indigo-400"   delay={0.1}  />
                <StatPill icon={<Flame    className="w-4 h-4" />} label="Day Streak" value={`${displayStreak} days`}     color="bg-orange-500/20 text-orange-400"   delay={0.15} />
                <StatPill icon={<Target   className="w-4 h-4" />} label="Avg Score"  value={`${avgScore}%`}             color="bg-pink-500/20 text-pink-400"       delay={0.2}  />
                <StatPill icon={<BookOpen className="w-4 h-4" />} label="Quizzes"    value={data.quizzesTaken ?? 0}      color="bg-emerald-500/20 text-emerald-400"  delay={0.25} />
              </div>
            </div>
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <XpRing progress={progress} level={data.level} />
              <p className="text-xs text-white/30 text-center">
                <span className="text-white/70 font-bold">{xpToNext} XP</span> to next level
              </p>
            </div>
          </div>
        </motion.div>

        {/* ── Streak banner ── */}
        {data.streak > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card p-5 flex items-center gap-4 border border-orange-500/15 bg-gradient-to-r from-orange-500/5 to-transparent">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/15 border border-orange-500/25 flex items-center justify-center flex-shrink-0">
              <Flame className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">🔥 {data.streak}-day streak — keep it going!</p>
              <p className="text-xs text-white/35 mt-0.5">
                Take at least one quiz per calendar day to maintain your streak. Missing any day resets it to 1.
              </p>
            </div>
            <div className="flex-shrink-0 text-right hidden sm:block">
              <p className="text-3xl font-black text-orange-400">{data.streak}</p>
              <p className="text-xs text-white/30 font-medium">days</p>
            </div>
          </motion.div>
        )}

        {/* ── Action cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ActionCard icon={<Brain  className="w-6 h-6 text-cyan-400"   />} title="Start Learning"  desc="Generate AI-powered lessons on any topic. Adaptive difficulty adjusts as you improve." cta="Go to Learning Lab"   onClick={() => router.push("/learning")}    gradient="bg-gradient-to-br from-cyan-600/10 to-indigo-600/10"   delay={0.1}  />
          <ActionCard icon={<Play   className="w-6 h-6 text-violet-400" />} title="Adaptive Mode"   desc="Let the AI challenge you with personalized questions based on your weak spots."        cta="Start Adaptive Quiz" onClick={() => router.push("/adaptive")}    gradient="bg-gradient-to-br from-violet-600/10 to-pink-600/10"   delay={0.15} />
          <ActionCard icon={<Trophy className="w-6 h-6 text-yellow-400" />} title="Leaderboard"     desc="See where you rank globally and compete against top learners this week."               cta="View Rankings"       onClick={() => router.push("/leaderboard")} gradient="bg-gradient-to-br from-yellow-600/10 to-amber-600/10"  delay={0.2}  />
        </div>

        {/* ── Stat cards ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: <BarChart2 className="w-5 h-5" />, label: "Accuracy",   value: `${avgScore}%`,  color: "from-cyan-500/20 to-cyan-500/5",     accent: "text-cyan-400",   border: "border-cyan-500/10"   },
            { icon: <Sparkles  className="w-5 h-5" />, label: "Lessons",    value: data.lessonsGenerated ?? 0, color: "from-violet-500/20 to-violet-500/5", accent: "text-violet-400", border: "border-violet-500/10" },
            { icon: <Award     className="w-5 h-5" />, label: "Best Score", value: data.history.length ? `${bestScore}%` : "—", color: "from-yellow-500/20 to-yellow-500/5", accent: "text-yellow-400", border: "border-yellow-500/10" },
            { icon: <Clock     className="w-5 h-5" />, label: "This Level", value: `${data.xp % XP_PER_LEVEL}/${XP_PER_LEVEL} XP`, color: "from-emerald-500/20 to-emerald-500/5", accent: "text-emerald-400", border: "border-emerald-500/10" },
          ].map(({ icon, label, value, color, accent, border }, i) => (
            <motion.div key={label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i + 0.3 }}
              className={`glass-card p-5 bg-gradient-to-b ${color} border ${border}`}>
              <div className={`${accent} mb-3`}>{icon}</div>
              <p className="text-2xl font-extrabold text-white mb-1">{value}</p>
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* ── Analytics ── */}
        <div className="space-y-4">

          {data.history.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="glass-card p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-base font-bold text-white">Performance Analytics</h2>
                </div>
                <span className="text-xs text-white/30">
                  Last {Math.min(data.history.length, 10)} quizzes
                  {hasSameDayDups && <span className="ml-1 text-white/20">· time shown (same-day)</span>}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Area: Score Trend */}
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-3">Score Trend</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartHistory} margin={{ top: 4, right: 4, left: -24, bottom: xAxisHeight - 8 }}>
                        <defs>
                          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0}   />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="label" stroke="transparent"
                          tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} tickLine={false}
                          interval="preserveStartEnd" angle={xAxisAngle} textAnchor="end" height={xAxisHeight} />
                        <YAxis stroke="transparent"
                          tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false}
                          domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="percent" stroke="#6366f1" strokeWidth={2.5}
                          fill="url(#areaGrad)"
                          dot={{ fill: "#0f172a", stroke: "#6366f1", strokeWidth: 2, r: 3 }}
                          activeDot={{ r: 6, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Bar: Per-Quiz */}
                <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-3">Per-Quiz Scores</p>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartHistory} margin={{ top: 4, right: 4, left: -24, bottom: xAxisHeight - 8 }}>
                        <defs>
                          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%"   stopColor="#a855f7" stopOpacity={1}   />
                            <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="label" stroke="transparent"
                          tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 9 }} tickLine={false}
                          interval="preserveStartEnd" angle={xAxisAngle} textAnchor="end" height={xAxisHeight} />
                        <YAxis stroke="transparent"
                          tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false}
                          domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                        <Bar dataKey="percent" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent quiz log table */}
              <div className="mt-4 bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/5 flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-white/30" />
                  <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">Quiz Log</p>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {[...chartHistory].reverse().slice(0, 5).map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-white/[0.03] transition-colors">
                      <span className="text-xs text-white/45 font-medium tabular-nums">{h.labelFull}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-white/25 tabular-nums">{h.score}/{h.total}</span>
                        <span className={`text-sm font-extrabold tabular-nums ${
                          h.percent >= 80 ? "text-emerald-400" : h.percent >= 60 ? "text-yellow-400" : "text-rose-400"
                        }`}>{h.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Learning Activity */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="glass-card p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart2 className="w-4 h-4 text-violet-400" />
              <h2 className="text-base font-bold text-white">Learning Activity</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

              {/* Progress bars */}
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 space-y-4">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-widest">Progress</p>
                {progressBars.map(({ label, value, max, color, accent, icon, suffix = "" }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-1.5">
                      <div className={`flex items-center gap-1.5 ${accent} text-xs font-medium`}>{icon} {label}</div>
                      <span className={`text-xs font-extrabold ${accent}`}>{value}{suffix}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }}
                        whileInView={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                        viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${color} rounded-full`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Score bands */}
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-3">Score Bands</p>
                {data.history.length === 0 ? (
                  <div className="h-36 flex items-center justify-center text-white/20 text-xs">No data yet</div>
                ) : (
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={scoreBands} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="band" stroke="transparent" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} tickLine={false} />
                        <YAxis stroke="transparent" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 10 }} tickLine={false} allowDecimals={false} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }}
                          contentStyle={{ backgroundColor: "#0d1227", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", fontSize: "12px" }}
                          itemStyle={{ color: "#fff" }} formatter={(v: any) => [`${v} quiz${v !== 1 ? "zes" : ""}`, ""]} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {["#ef4444","#f97316","#eab308","#22c55e"].map((c, i) => <Cell key={i} fill={c} fillOpacity={0.85} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Radar */}
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5">
                <p className="text-xs text-white/40 font-semibold uppercase tracking-widest mb-3">Skill Profile</p>
                <div className="h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis dataKey="skill" tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 9 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={1.5} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
                  {[{ label: "Streak", hint: "/ 30 days" }, { label: "Level", hint: "/ 20" }, { label: "Quizzes", hint: "/ 50" }].map(({ label, hint }) => (
                    <p key={label} className="text-[10px] text-white/20 leading-tight">
                      <span className="text-white/35 font-semibold">{label}</span> {hint}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── About ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }} className="glass-card overflow-hidden">
          <div className="relative w-full aspect-[21/6] sm:aspect-[21/5]">
            <Image src="/Logo2.png" alt="Cognivra" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-[#0a0f1c]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a0f1c]/60 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400/80 mb-2">AI-Powered Learning Platform</p>
              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                About <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Cognivra Adaptive</span>
              </h2>
            </div>
          </div>
          <div className="p-6 sm:p-10 space-y-8">
            <p className="text-white/55 leading-relaxed text-sm sm:text-base max-w-3xl">
              <span className="text-white font-semibold">Cognivra Adaptive</span> is an intelligent learning platform that
              analyzes your quiz performance in real time, tracks your progress across sessions, and dynamically
              adjusts question difficulty to reinforce weak areas while building on your strengths.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: <LineChart className="w-5 h-5" />, accent: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",       title: "Performance Tracking",  desc: "Real-time analytics surface score trends, XP growth, and concept mastery across every session." },
                { icon: <Cpu       className="w-5 h-5" />, accent: "text-violet-400 bg-violet-500/10 border-violet-500/20", title: "Adaptive Intelligence",  desc: "The AI detects knowledge gaps and generates targeted questions calibrated to your current skill level." },
                { icon: <Layers    className="w-5 h-5" />, accent: "text-amber-400 bg-amber-500/10 border-amber-500/20",    title: "Gamified Progression",   desc: "XP, levels, streaks, and leagues turn consistent practice into a rewarding long-term habit." },
              ].map(({ icon, accent, title, desc }) => (
                <div key={title} className="group bg-white/[0.03] border border-white/8 rounded-2xl p-6 hover:bg-white/[0.06] transition-all duration-300">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-4 ${accent}`}>{icon}</div>
                  <h4 className="text-white font-semibold text-sm mb-2">{title}</h4>
                  <p className="text-white/40 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 divide-x divide-white/8 border border-white/8 rounded-2xl overflow-hidden">
              {[{ value: "AI-Powered", label: "Question Generation" }, { value: "Adaptive", label: "Difficulty System" }, { value: "Real-Time", label: "Progress Analytics" }].map(({ value, label }) => (
                <div key={label} className="px-6 py-5 bg-white/[0.02] text-center">
                  <p className="text-base font-extrabold text-white mb-0.5">{value}</p>
                  <p className="text-xs text-white/35 font-medium">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Team ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.6 }} className="glass-card overflow-hidden">
          <div className="relative px-6 sm:px-10 pt-10 pb-8 border-b border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-cyan-600/5" />
            <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="relative w-20 h-20 flex-shrink-0">
                <Image src="/RTM.png" alt="Return To Monkey" fill className="object-contain" />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400/80 mb-1">Development Team</p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Return To Monkey</h2>
                <p className="text-white/40 text-sm mt-1">
                  Students from <span className="text-white/70 font-medium">Saipanyarangsit School</span> · Grade 11
                </p>
              </div>
            </div>
          </div>
          <div className="p-6 sm:p-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[
                { src: "/1.png", name: "Phanyawat Wanmarat",   role: "Full-Stack Developer", accent: "from-indigo-500/20 to-indigo-500/5",   ring: "ring-indigo-500/30",  tag: "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"   },
                { src: "/2.png", name: "Sher Youprayong",       role: "Researcher",           accent: "from-violet-500/20 to-violet-500/5",   ring: "ring-violet-500/30",  tag: "bg-violet-500/10 border-violet-500/20 text-violet-300"   },
                { src: "/3.png", name: "Panathorn Limthongkun", role: "Researcher",           accent: "from-emerald-500/20 to-emerald-500/5", ring: "ring-emerald-500/30", tag: "bg-emerald-500/10 border-emerald-500/20 text-emerald-300" },
              ].map(({ src, name, role, accent, ring, tag }) => (
                <motion.div key={name} whileHover={{ y: -6 }}
                  className={`relative bg-gradient-to-b ${accent} border border-white/8 rounded-2xl p-7 flex flex-col items-center text-center group overflow-hidden`}>
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-32 h-32 bg-white/5 blur-[60px] rounded-full pointer-events-none" />
                  <div className={`relative w-24 h-24 rounded-full overflow-hidden ring-4 ${ring} mb-5 group-hover:scale-105 transition-transform duration-300`}>
                    <Image src={src} alt={name} fill className="object-cover" />
                  </div>
                  <h4 className="text-white font-bold text-base mb-1">{name}</h4>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border mt-1 ${tag}`}>
                    <User className="w-3 h-3" />{role}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="px-6 sm:px-10 py-5 border-t border-white/5 bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-white/20 tracking-widest uppercase">Cognivra Adaptive</p>
            <p className="text-xs text-white/20">© 2026 Return To Monkey · All rights reserved</p>
          </div>
        </motion.div>

      </div>
    </ProtectedRoute>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} className="glass-card p-6 relative overflow-hidden group">
      <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-10 group-hover:opacity-25 transition-opacity bg-current ${color}`} />
      <h3 className="text-white/40 text-xs font-semibold uppercase tracking-widest mb-2">{title}</h3>
      <p className={`text-4xl font-black ${color}`}>{value}</p>
    </motion.div>
  );
}