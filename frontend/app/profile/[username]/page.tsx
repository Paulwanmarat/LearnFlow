"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft, Github, Instagram, Facebook, Twitter,
  Youtube, Twitch, MessageSquare, Gamepad2, ExternalLink
} from "lucide-react";
import API from "../../../utils/api";
import Navbar from "../../../components/Navbar";

/* ─── Social platform config ──────────────────────────── */
type SocialCfg = { label: string; icon: React.ReactNode; buildUrl: (v: string) => string; color: string };
const SOCIAL_CONFIG: Record<string, SocialCfg> = {
  github:    { label: "GitHub",      icon: <Github    className="w-4 h-4" />, buildUrl: (v) => `https://github.com/${v}`,                           color: "hover:text-white hover:border-white/30" },
  instagram: { label: "Instagram",   icon: <Instagram className="w-4 h-4" />, buildUrl: (v) => `https://instagram.com/${v.replace("@","")}`,        color: "hover:text-pink-400 hover:border-pink-400/30" },
  facebook:  { label: "Facebook",    icon: <Facebook  className="w-4 h-4" />, buildUrl: (v) => `https://facebook.com/${v}`,                         color: "hover:text-blue-400 hover:border-blue-400/30" },
  twitter:   { label: "X / Twitter", icon: <Twitter   className="w-4 h-4" />, buildUrl: (v) => `https://x.com/${v.replace("@","")}`,               color: "hover:text-sky-400 hover:border-sky-400/30" },
  youtube:   { label: "YouTube",     icon: <Youtube   className="w-4 h-4" />, buildUrl: (v) => `https://youtube.com/${v}`,                          color: "hover:text-red-400 hover:border-red-400/30" },
  twitch:    { label: "Twitch",      icon: <Twitch    className="w-4 h-4" />, buildUrl: (v) => `https://twitch.tv/${v}`,                            color: "hover:text-purple-400 hover:border-purple-400/30" },
  discord:   { label: "Discord",     icon: <MessageSquare className="w-4 h-4" />, buildUrl: (v) => `https://discord.com/users/${v}`,               color: "hover:text-indigo-400 hover:border-indigo-400/30" },
  steam:     { label: "Steam",       icon: <Gamepad2  className="w-4 h-4" />, buildUrl: (v) => `https://steamcommunity.com/id/${v}`,               color: "hover:text-cyan-400 hover:border-cyan-400/30" },
  roblox:    { label: "Roblox",      icon: <Gamepad2  className="w-4 h-4" />, buildUrl: (v) => `https://roblox.com/users/profile?username=${v}`,   color: "hover:text-red-400 hover:border-red-400/30" },
  epic:      { label: "Epic Games",  icon: <Gamepad2  className="w-4 h-4" />, buildUrl: (_) => `#`,                                                 color: "hover:text-yellow-400 hover:border-yellow-400/30" },
};

const LEAGUE_CONFIG: Record<string, { color: string; bg: string; border: string; glow: string }> = {
  Diamond: { color: "text-cyan-300",   bg: "bg-cyan-500/10",   border: "border-cyan-400/30",   glow: "shadow-[0_0_20px_rgba(6,182,212,0.2)]" },
  Platinum: { color: "text-violet-300", bg: "bg-violet-500/10", border: "border-violet-400/30", glow: "shadow-[0_0_20px_rgba(139,92,246,0.2)]" },
  Gold:    { color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-400/30", glow: "shadow-[0_0_20px_rgba(250,204,21,0.2)]" },
  Silver:  { color: "text-slate-300",  bg: "bg-slate-400/10",  border: "border-slate-300/30",  glow: "" },
  Bronze:  { color: "text-amber-600",  bg: "bg-amber-600/10",  border: "border-amber-600/30",  glow: "" },
};

const LEAGUE_EMOJI: Record<string, string> = { Diamond: "💎", Platinum: "🔮", Gold: "🏆", Silver: "🥈", Bronze: "🥉" };

const getFlag = (country?: string) => {
  if (!country || country === "Unknown") return "🌎";
  return country.slice(0, 2).toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 flex flex-col items-center text-center gap-1">
      <span className="text-2xl font-extrabold text-white">{value}</span>
      <span className="text-xs text-white/40 font-medium">{label}</span>
      {sub && <span className="text-xs text-white/20">{sub}</span>}
    </div>
  );
}

function Avatar({ src, name, size }: { src?: string | null; name: string; size: string }) {
  const [err, setErr] = useState(false);
  if (src && !err) {
    return <img src={src} alt={name} onError={() => setErr(true)} className={`${size} rounded-full object-cover border-4 border-white/10 flex-shrink-0`} />;
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-4 border-white/10 flex items-center justify-center font-black text-white flex-shrink-0`}>
      <span className="text-4xl">{name?.[0]?.toUpperCase() || "?"}</span>
    </div>
  );
}

export default function PublicProfilePage() {
  const params   = useParams();
  const router   = useRouter();
  const username = params?.username as string;

  const [user,     setUser]     = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    API.get(`/users/${username}`)
      .then((res) => setUser(res.data.user))
      .catch((err) => { if (err.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !user) {
    return (
      <div className="min-h-screen bg-[#020617]">
        <Navbar />
        <div className="pt-32 flex flex-col items-center text-center px-4">
          <p className="text-6xl mb-4">👤</p>
          <h1 className="text-2xl font-bold text-white mb-2">Player not found</h1>
          <p className="text-white/40 text-sm mb-8">No one goes by <span className="text-white/70 font-semibold">@{username}</span></p>
          <button onClick={() => router.back()} className="flex items-center gap-2 px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium rounded-xl transition-all">
            <ArrowLeft className="w-4 h-4" /> Go back
          </button>
        </div>
      </div>
    );
  }

  const league   = user.league || "Bronze";
  const lCfg     = LEAGUE_CONFIG[league] || LEAGUE_CONFIG.Bronze;
  const hasSocial = user.socialLinks && Object.values(user.socialLinks).some((v: any) => v?.trim());

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="pt-24 pb-20 px-4 sm:px-6 max-w-3xl mx-auto">

        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back
        </button>

        {/* ── Hero card ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            <div className="relative flex-shrink-0">
              <Avatar src={user.avatar} name={user.username} size="w-24 h-24" />
              <div className="absolute -bottom-2 -right-2 bg-[#0d1227] border-2 border-white/10 text-xs font-black text-cyan-400 rounded-full px-2.5 py-1">
                Lvl {user.level}
              </div>
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-wrap justify-center sm:justify-start">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white truncate">{user.username}</h1>
                <span className="text-2xl" title={user.country}>{getFlag(user.country)}</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start mt-2 mb-3">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${lCfg.color} ${lCfg.bg} ${lCfg.border} ${lCfg.glow}`}>
                  {LEAGUE_EMOJI[league]} {league} League
                </span>
              </div>

              {user.bio ? (
                <p className="text-sm text-white/60 leading-relaxed max-w-md">{user.bio}</p>
              ) : (
                <p className="text-sm text-white/20 italic">No bio yet.</p>
              )}

              {/* Social links */}
              {hasSocial && (
                <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                  {Object.entries(user.socialLinks || {}).map(([key, value]) => {
                    if (!value || !(value as string).trim()) return null;
                    const cfg = SOCIAL_CONFIG[key];
                    if (!cfg) return null;
                    return (
                      <a key={key} href={cfg.buildUrl((value as string).trim())}
                        target="_blank" rel="noopener noreferrer" title={cfg.label}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/40 text-xs font-medium transition-all ${cfg.color}`}>
                        {cfg.icon}
                        <span>{cfg.label}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-50" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ── Stats grid ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard label="Total XP"      value={user.xp?.toLocaleString() ?? 0} />
          <StatCard label="Day Streak"    value={user.streak ?? 0} sub="🔥" />
          <StatCard label="Quizzes Taken" value={user.quizzesTaken ?? 0} />
          <StatCard label="Avg Score"     value={user.averageScore ? `${user.averageScore}%` : "—"} />
        </motion.div>

        {/* ── Accuracy + Lessons ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-white/40 font-medium mb-3">Accuracy</p>
            <p className="text-2xl font-extrabold text-white mb-3">{user.accuracy ? `${user.accuracy}%` : "—"}</p>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${user.accuracy ?? 0}%` }} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-white/40 font-medium mb-3">Lessons Generated</p>
            <p className="text-2xl font-extrabold text-white">{user.lessonsGenerated ?? 0}</p>
            <p className="text-xs text-white/20 mt-1">AI lessons created</p>
          </div>
        </motion.div>

        {/* ── Achievements ── */}
        {user.achievements?.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
            className="bg-white/5 border border-white/10 rounded-3xl p-6 mb-6">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              🏅 Achievements
              <span className="text-xs text-white/30 font-normal">({user.achievements.length})</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {user.achievements.map((a: any, i: number) => (
                <span key={i} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-full">
                  🏆 {a.name}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        <p className="text-center text-xs text-white/20 mt-8">
          Member since {new Date(user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
      </div>
    </div>
  );
}