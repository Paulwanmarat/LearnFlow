"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import API from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import io from "socket.io-client";
import {
  Trophy, Flame, TrendingUp, BookOpen, Globe,
  ArrowLeft, ArrowUp, ArrowDown, Minus, Crown, Medal,
} from "lucide-react";

/* ─── Types ─────────────────────────────────────────── */

interface User {
  rank: number;
  previousRank?: number;
  name: string;
  avatar?: string | null;
  xp: number;
  level: number;
  streak: number;
  country?: string;
  league?: "bronze" | "silver" | "gold";
  quizzes?: number;
}

type Mode = "global" | "weekly" | "streak" | "quizzes";

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

/* ─── Helpers ────────────────────────────────────────── */

const MODE_CONFIG: Record<Mode, { label: string; icon: React.ReactNode; color: string; accent: string }> = {
  global:  { label: "Global XP",      icon: <Globe      className="w-4 h-4" />, color: "from-indigo-500 to-violet-500",  accent: "text-indigo-400"  },
  weekly:  { label: "Weekly XP",      icon: <TrendingUp className="w-4 h-4" />, color: "from-cyan-500 to-blue-500",      accent: "text-cyan-400"    },
  streak:  { label: "Longest Streak", icon: <Flame      className="w-4 h-4" />, color: "from-orange-500 to-amber-500",   accent: "text-orange-400"  },
  quizzes: { label: "Most Quizzes",   icon: <BookOpen   className="w-4 h-4" />, color: "from-emerald-500 to-teal-500",   accent: "text-emerald-400" },
};

const getFlag = (country?: string) => {
  if (!country || country === "Unknown") return null;
  return country.slice(0, 2).toUpperCase().replace(/./g, (c) =>
    String.fromCodePoint(127397 + c.charCodeAt(0))
  );
};

/* ─── Avatar ─────────────────────────────────────────── */

function Avatar({ src, name, size = "md" }: { src?: string | null; name: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const [err, setErr] = useState(false);
  const dims: Record<string, string> = {
    sm: "w-8  h-8  text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };
  if (src && !err) {
    return (
      <img src={src} alt={name} onError={() => setErr(true)}
        className={`${dims[size]} rounded-full object-cover border-2 border-white/10 flex-shrink-0`} />
    );
  }
  return (
    <div className={`${dims[size]} rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-2 border-white/10 flex items-center justify-center font-bold text-white flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────── */

export default function Leaderboard() {
  const [podium,  setPodium]  = useState<User[]>([]);
  const [users,   setUsers]   = useState<User[]>([]);
  const [mode,    setMode]    = useState<Mode>("global");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 20000);
    socket.on("leaderboardUpdate", (data) => {
      if (data.mode === mode) { setPodium(data.podium); setUsers(data.leaderboard); }
    });
    return () => { clearInterval(interval); socket.off("leaderboardUpdate"); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const endpoints: Record<Mode, string> = {
        global: "/leaderboard", weekly: "/leaderboard/weekly",
        streak: "/leaderboard/streak", quizzes: "/leaderboard/quizzes",
      };
      const res = await API.get(endpoints[mode]);
      setPodium(res.data.podium || []);
      setUsers(res.data.leaderboard || []);
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankChange = (user: User) => {
    if (!user.previousRank) return <Minus className="w-3.5 h-3.5 text-white/20" />;
    if (user.previousRank > user.rank)  return <ArrowUp   className="w-3.5 h-3.5 text-emerald-400" />;
    if (user.previousRank < user.rank)  return <ArrowDown className="w-3.5 h-3.5 text-rose-400"    />;
    return <Minus className="w-3.5 h-3.5 text-white/20" />;
  };

  const getLeagueLabel = (league?: string) => {
    if (league === "gold")   return { label: "Gold League",   color: "text-yellow-400" };
    if (league === "silver") return { label: "Silver League", color: "text-slate-300"  };
    if (league === "bronze") return { label: "Bronze League", color: "text-amber-600"  };
    return null;
  };

  const getMetricValue = (user: User) => {
    if (mode === "streak")  return { value: user.streak  ?? 0, suffix: "days"    };
    if (mode === "quizzes") return { value: user.quizzes ?? 0, suffix: "quizzes" };
    return { value: user.xp ?? 0, suffix: "XP" };
  };

  const cfg = MODE_CONFIG[mode];

  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-24 pb-16 px-4 sm:px-8 relative z-10 overflow-hidden">

        {/* Background glows */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[500px] bg-yellow-500/6 blur-[160px] rounded-full" />
          <div className="absolute bottom-1/3 left-0 w-[400px] h-[400px] bg-indigo-600/8 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto space-y-10">

          {/* HEADER */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.15)] mb-2">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
              Hall of{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                Fame
              </span>
            </h1>
            <p className="text-white/50 text-base max-w-md mx-auto">
              Compete with learners worldwide and climb the global rankings.
            </p>
          </motion.div>

          {/* MODE TOGGLES */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white/5 border border-white/10 p-1.5 rounded-2xl flex flex-wrap justify-center gap-1 shadow-xl">
            {(Object.entries(MODE_CONFIG) as [Mode, typeof MODE_CONFIG[Mode]][]).map(([type, c]) => (
              <button key={type} onClick={() => setMode(type)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 flex-1 min-w-[120px] justify-center ${
                  mode === type
                    ? `bg-gradient-to-r ${c.color} text-white shadow-[0_4px_15px_rgba(99,102,241,0.3)]`
                    : "text-white/50 hover:text-white hover:bg-white/5"
                }`}>
                {c.icon}
                <span>{c.label}</span>
              </button>
            ))}
          </motion.div>

          {/* PODIUM */}
          {!loading && podium.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="flex justify-center items-end gap-3 sm:gap-6 pt-16 pb-4">
              {podium[1] && <PodiumCard user={podium[1]} place="second" mode={mode} />}
              {podium[0] && <PodiumCard user={podium[0]} place="first"  mode={mode} />}
              {podium[2] && <PodiumCard user={podium[2]} place="third"  mode={mode} />}
            </motion.div>
          )}

          {/* FULL LIST */}
          <div>
            {loading ? (
              <div className="text-center py-24 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-indigo-500/30 border-t-indigo-400 rounded-full animate-spin" />
                <p className="text-white/40 text-sm font-medium tracking-widest uppercase animate-pulse">
                  Syncing leaderboard
                </p>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/8 rounded-3xl overflow-hidden">

                {/* List header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-5 rounded-full bg-gradient-to-b ${cfg.color}`} />
                    <span className="text-sm font-bold text-white">{cfg.label} Rankings</span>
                  </div>
                  <span className="text-xs text-white/30 font-medium">
                    Ranks 4 – {Math.min(users.length, 20)}
                  </span>
                </div>

                <div className="divide-y divide-white/[0.04]">
                  <AnimatePresence>
                    {users.slice(3).map((user, i) => {
                      const metric   = getMetricValue(user);
                      const flag     = getFlag(user.country);
                      const leagueInfo = getLeagueLabel(user.league);
                      return (
                        <motion.div key={user.rank} layout
                          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-4 px-5 sm:px-7 py-4 hover:bg-white/[0.04] transition-colors group">

                          {/* Rank + change */}
                          <div className="w-10 flex-shrink-0 flex flex-col items-center gap-1">
                            <span className="text-base font-extrabold text-white/60 group-hover:text-white transition-colors">
                              {user.rank}
                            </span>
                            <span className="flex">{getRankChange(user)}</span>
                          </div>

                          {/* Avatar */}
                          <Avatar src={user.avatar} name={user.name} size="md" />

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {flag && <span className="text-base leading-none flex-shrink-0">{flag}</span>}
                              <span className="font-bold text-white truncate">{user.name}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                Lvl {user.level}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-orange-400 font-semibold">
                                <Flame className="w-3 h-3" />{user.streak}
                              </span>
                              {leagueInfo && (
                                <span className={`text-xs font-semibold hidden sm:inline ${leagueInfo.color}`}>
                                  {leagueInfo.label}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Metric */}
                          <div className="flex-shrink-0 text-right">
                            <span className={`text-lg font-extrabold ${cfg.accent}`}>
                              {metric.value.toLocaleString()}
                            </span>
                            <span className="text-xs text-white/30 ml-1 font-medium">{metric.suffix}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          {/* BACK */}
          <div className="flex justify-center pt-4">
            <button onClick={() => router.push("/dashboard")}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white text-sm font-semibold rounded-2xl transition-all">
              <ArrowLeft className="w-4 h-4" /> Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

/* ─── Podium Card ────────────────────────────────────── */

function PodiumCard({ user, place, mode }: { user: User; place: "first" | "second" | "third"; mode: Mode }) {
  const isFirst  = place === "first";
  const isSecond = place === "second";

  const cfg = {
    first:  {
      height: "h-[320px]", rank: 1,
      border: "border-yellow-400/40",  shadow: "shadow-[0_0_50px_rgba(250,204,21,0.18)]",
      ring:   "ring-yellow-400/50",    bar:    "from-yellow-400 to-amber-400",
      metric: "text-yellow-300",       rankColor: "text-yellow-400",
      label:  "bg-yellow-400/10 border-yellow-400/20 text-yellow-300",
    },
    second: {
      height: "h-[280px]", rank: 2,
      border: "border-slate-400/35",   shadow: "shadow-[0_0_40px_rgba(148,163,184,0.12)]",
      ring:   "ring-slate-400/40",     bar:    "from-slate-300 to-slate-400",
      metric: "text-slate-300",        rankColor: "text-slate-300",
      label:  "bg-slate-400/10 border-slate-400/20 text-slate-300",
    },
    third:  {
      height: "h-[255px]", rank: 3,
      border: "border-amber-700/35",   shadow: "shadow-[0_0_40px_rgba(180,83,9,0.12)]",
      ring:   "ring-amber-700/40",     bar:    "from-amber-700 to-amber-600",
      metric: "text-amber-500",        rankColor: "text-amber-600",
      label:  "bg-amber-700/10 border-amber-700/20 text-amber-400",
    },
  }[place];

  const getMetric = () => {
    if (mode === "streak")  return `${user.streak  ?? 0} days`;
    if (mode === "quizzes") return `${user.quizzes ?? 0} quizzes`;
    return `${(user.xp ?? 0).toLocaleString()} XP`;
  };

  const MedalIcon = isFirst ? Crown : Medal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 120, delay: isFirst ? 0.1 : isSecond ? 0.25 : 0.4 }}
      className={`relative rounded-t-3xl border-t border-x w-[115px] sm:w-[145px] md:w-[185px] flex flex-col items-center justify-start pt-12 px-3 ${cfg.height} ${cfg.border} ${cfg.shadow} backdrop-blur-xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] overflow-visible`}
    >
      {/* Floating crown for #1 */}
      {isFirst && (
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute -top-12 flex items-center justify-center">
          <Crown className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_16px_rgba(250,204,21,0.8)]" />
        </motion.div>
      )}

      {/* Avatar */}
      <div className={`absolute -top-10 w-20 h-20 rounded-full ring-4 ${cfg.ring} shadow-xl z-10 overflow-hidden`}>
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover"
            onError={(e) => {
              const el = e.currentTarget;
              el.style.display = "none";
              el.parentElement!.classList.add("bg-gradient-to-br", "from-cyan-500", "to-indigo-600", "flex", "items-center", "justify-center");
              el.parentElement!.innerHTML = `<span class="text-2xl font-black text-white">${user.name?.[0]?.toUpperCase() ?? "?"}</span>`;
            }} />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0d1227] border-2 border-white/10 flex items-center justify-center text-xs font-black ${cfg.rankColor}`}>
          {cfg.rank}
        </div>
      </div>

      {/* Medal icon */}
      <div className={`mt-3 mb-3 p-2 rounded-xl border ${cfg.label}`}>
        <MedalIcon className="w-5 h-5" />
      </div>

      {/* Name */}
      <p className="font-extrabold text-sm sm:text-base text-center w-full text-white/95 px-2 truncate leading-tight">
        {user.name}
      </p>

      {/* Level */}
      <span className="mt-2 text-xs font-bold tracking-widest uppercase text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/5">
        Lvl {user.level}
      </span>

      {/* Metric */}
      <p className={`mt-auto mb-7 font-black text-base sm:text-lg text-center ${cfg.metric}`}>
        {getMetric()}
      </p>

      {/* Bottom bar */}
      <div className={`absolute bottom-0 w-full h-1 bg-gradient-to-r ${cfg.bar} rounded-t`} />
    </motion.div>
  );
}