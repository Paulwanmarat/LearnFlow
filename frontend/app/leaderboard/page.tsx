"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "../../components/ProtectedRoute";
import API from "../../utils/api";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import io from "socket.io-client";

/* ─── Types ─────────────────────────────────────────── */

interface User {
  rank: number;
  previousRank?: number;
  name: string;
  avatar?: string | null;   // ← Google photo, upload, preset, or null
  xp: number;
  level: number;
  streak: number;
  country?: string;
  league?: "bronze" | "silver" | "gold";
  quizzes?: number;
}

type Mode = "global" | "weekly" | "streak" | "quizzes";

const socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000");

/* ─── Reusable Avatar ────────────────────────────────── */

function Avatar({
  src,
  name,
  size = "md",
}: {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const [err, setErr] = useState(false);

  const dims: Record<string, string> = {
    sm: "w-8  h-8  text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-xl",
    xl: "w-20 h-20 text-2xl",
  };

  if (src && !err) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setErr(true)}
        className={`${dims[size]} rounded-full object-cover border-2 border-white/10 flex-shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${dims[size]} rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-2 border-white/10 flex items-center justify-center font-bold text-white flex-shrink-0`}
    >
      {name?.[0]?.toUpperCase() || "?"}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────── */

export default function Leaderboard() {
  const [podium, setPodium] = useState<User[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [mode, setMode] = useState<Mode>("global");
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 20000);

    socket.on("leaderboardUpdate", (data) => {
      if (data.mode === mode) {
        setPodium(data.podium);
        setUsers(data.leaderboard);
      }
    });

    return () => {
      clearInterval(interval);
      socket.off("leaderboardUpdate");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      let endpoint = "/leaderboard";
      if (mode === "weekly") endpoint = "/leaderboard/weekly";
      if (mode === "streak") endpoint = "/leaderboard/streak";
      if (mode === "quizzes") endpoint = "/leaderboard/quizzes";

      const res = await API.get(endpoint);
      setPodium(res.data.podium || []);
      setUsers(res.data.leaderboard || []);
    } catch (err) {
      console.error("Leaderboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRankArrow = (user: User) => {
    if (!user.previousRank) return null;
    if (user.previousRank > user.rank) return <span className="text-emerald-400 font-bold">↑</span>;
    if (user.previousRank < user.rank) return <span className="text-pink-500 font-bold">↓</span>;
    return <span className="text-white/30">•</span>;
  };

  const getLeagueBadge = (league?: string) => {
    if (league === "gold") return "🥇 Gold League";
    if (league === "silver") return "🥈 Silver League";
    if (league === "bronze") return "🥉 Bronze League";
    return "";
  };

  const getFlag = (country?: string) => {
    if (!country || country === "Unknown") return "🌎";
    return country
      .slice(0, 2)
      .toUpperCase()
      .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
  };

  const getMetricDisplay = (user: User) => {
    if (mode === "streak") return <><span className="text-orange-400">{user.streak}</span> Days 🔥</>;
    if (mode === "quizzes") return <><span className="text-emerald-400">{user.quizzes}</span> Quizzes 📝</>;
    return <><span className="text-brand-accent1">{user.xp}</span> XP</>;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen pt-24 pb-12 px-8 relative z-10 w-full overflow-hidden">

        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-500/10 blur-[150px] rounded-full pointer-events-none -z-10" />

        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-block p-4 bg-yellow-500/10 rounded-3xl mb-4 border border-yellow-500/20 text-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.15)]">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
            Hall of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
              Fame
            </span>
          </h1>
          <p className="text-lg text-white/60">Compete with learners worldwide and climb the ranks.</p>
        </motion.div>

        {/* MODE TOGGLES */}
        <div className="flex justify-center mb-20 relative z-20">
          <div className="glass-panel p-1.5 rounded-2xl flex flex-wrap justify-center gap-1 w-full max-w-4xl mx-auto shadow-xl">
            {(["global", "weekly", "streak", "quizzes"] as Mode[]).map((type) => (
              <button
                key={type}
                onClick={() => setMode(type)}
                className={`px-6 py-3 rounded-xl font-medium capitalize transition-all duration-300 md:flex-1 ${
                  mode === type
                    ? "bg-gradient-to-r from-brand-accent1 to-brand-accent2 text-white shadow-[0_4px_15px_rgba(99,102,241,0.4)]"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* PODIUM */}
        {!loading && podium.length > 0 && (
          <div className="flex justify-center items-end gap-3 md:gap-8 mb-24 mt-10">
            {podium[1] && <PodiumCard user={podium[1]} place="second" mode={mode} />}
            {podium[0] && <PodiumCard user={podium[0]} place="first"  mode={mode} />}
            {podium[2] && <PodiumCard user={podium[2]} place="third"  mode={mode} />}
          </div>
        )}

        {/* FULL LIST (ranks 4-10) */}
        <div className="max-w-4xl mx-auto z-20 relative">
          {loading ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-brand-accent1 border-t-white rounded-full animate-spin shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
              <p className="mt-6 text-white/50 text-xl font-medium tracking-wide animate-pulse">
                Syncing Leaderboard...
              </p>
            </div>
          ) : (
            <div className="glass-card p-4 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-accent1/5 blur-[100px] rounded-full pointer-events-none z-0" />

              <div className="space-y-4 relative z-10 w-full">
                <AnimatePresence>
                  {users.slice(3).map((user, i) => (
                    <motion.div
                      key={user.rank}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" }}
                      className="flex justify-between items-center px-4 md:px-6 py-4 md:py-5 rounded-2xl glass-input border-white/5 font-sans group hover:border-brand-accent1/30 w-full"
                    >
                      <div className="flex items-center gap-3 md:gap-4 min-w-0">

                        {/* Rank badge */}
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-bold text-lg text-white/70 shadow-inner group-hover:bg-brand-accent1/10 group-hover:text-brand-accent1 transition-colors flex-shrink-0">
                          {user.rank}
                        </div>

                        {/* ── Avatar ── */}
                        <Avatar src={user.avatar} name={user.name} size="md" />

                        {/* Name + sub-badges */}
                        <div className="flex flex-col min-w-0">
                          <div className="font-bold text-lg flex items-center gap-2 flex-wrap">
                            <span className="text-xl flex-shrink-0" title={user.country || "Earth"}>
                              {getFlag(user.country)}
                            </span>
                            <span className="tracking-wide text-white/95 truncate">{user.name}</span>
                            <span className="text-sm flex-shrink-0">{getRankArrow(user)}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-xs text-white/50 flex-wrap">
                            <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                              Lvl {user.level}
                            </span>
                            <span className="flex items-center gap-1 font-medium text-orange-300">
                              🔥 {user.streak}
                            </span>
                            {user.league && (
                              <span className="text-yellow-400/80 font-medium hidden sm:inline-block border-l border-white/10 pl-2">
                                {getLeagueBadge(user.league)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Metric */}
                      <div className="font-bold text-lg md:text-2xl tracking-tight text-white/90 flex-shrink-0 ml-2">
                        {getMetricDisplay(user)}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* BACK */}
        <div className="text-center mt-16 pb-12">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-secondary px-8 py-4 flex items-center gap-3 mx-auto hover:bg-white/10"
          >
            <span>←</span>
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    </ProtectedRoute>
  );
}

/* ─── Podium Card ────────────────────────────────────── */

function PodiumCard({
  user,
  place,
  mode,
}: {
  user: User;
  place: "first" | "second" | "third";
  mode: Mode;
}) {
  const isFirst  = place === "first";
  const isSecond = place === "second";

  const heightClass = isFirst ? "h-[340px]" : isSecond ? "h-[300px]" : "h-[270px]";
  const rankNumber  = isFirst ? "1" : isSecond ? "2" : "3";
  const medal       = isFirst ? "🥇" : isSecond ? "🥈" : "🥉";

  const glowBorder  = isFirst ? "border-yellow-400/50" : isSecond ? "border-slate-300/50" : "border-amber-600/50";
  const glowShadow  = isFirst
    ? "shadow-[0_0_50px_rgba(250,204,21,0.25)]"
    : isSecond
    ? "shadow-[0_0_40px_rgba(203,213,225,0.15)]"
    : "shadow-[0_0_40px_rgba(217,119,6,0.15)]";

  const rankColor   = isFirst ? "text-yellow-400" : isSecond ? "text-slate-300" : "text-amber-600";
  const ringColor   = isFirst ? "ring-yellow-400/50" : isSecond ? "ring-slate-300/40" : "ring-amber-600/40";
  const barColor    = isFirst ? "bg-yellow-400" : isSecond ? "bg-slate-300" : "bg-amber-600";

  const getMetric = () => {
    if (mode === "streak")  return `${user.streak  ?? 0} 🔥`;
    if (mode === "quizzes") return `${user.quizzes ?? 0} 📝`;
    return `${user.xp ?? 0} XP`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 100,
        delay: isFirst ? 0.2 : isSecond ? 0.4 : 0.6,
      }}
      className={`relative rounded-t-3xl border-t border-x w-[130px] sm:w-[150px] md:w-[200px] flex flex-col items-center justify-start pt-10 px-4 ${heightClass} ${glowBorder} ${glowShadow} backdrop-blur-xl bg-gradient-to-b from-white/10 to-transparent overflow-visible`}
    >
      {/* Crown for #1 */}
      {isFirst && (
        <motion.div
          animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="absolute -top-14 text-6xl md:text-7xl filter drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] z-20"
        >
          👑
        </motion.div>
      )}

      {/* ── Avatar circle with rank badge ── */}
      <div className={`absolute -top-10 w-20 h-20 rounded-full ring-4 ${ringColor} shadow-xl z-10 overflow-hidden`}>
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              // fallback to initial letter on broken img
              const el = e.currentTarget;
              el.style.display = "none";
              el.parentElement!.classList.add("bg-gradient-to-br", "from-cyan-500", "to-indigo-600", "flex", "items-center", "justify-center");
              el.parentElement!.innerHTML = `<span class="text-2xl font-black text-white">${user.name?.[0]?.toUpperCase() ?? "?"}</span>`;
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center text-2xl font-black text-white">
            {user.name?.[0]?.toUpperCase() || "?"}
          </div>
        )}

        {/* Small rank number badge */}
        <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0d1227] border-2 border-white/10 flex items-center justify-center text-xs font-black ${rankColor}`}>
          {rankNumber}
        </div>
      </div>

      <div className="text-3xl mb-4 mt-4 filter drop-shadow-md">{medal}</div>

      <div className="font-extrabold text-base md:text-xl text-center truncate w-full text-white/95 px-2">
        {user.name}
      </div>

      <div className="text-xs text-white/50 font-bold tracking-widest uppercase mt-2 bg-white/5 px-3 py-1 rounded-full border border-white/5 shadow-inner">
        Lvl {user.level}
      </div>

      <div className="mt-auto mb-8 text-brand-accent1 font-black text-xl md:text-2xl drop-shadow-[0_0_15px_rgba(99,102,241,0.6)]">
        {getMetric()}
      </div>

      <div className={`absolute bottom-0 w-full h-1 ${barColor} box-glow`} />
    </motion.div>
  );
}