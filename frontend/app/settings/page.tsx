"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, X, Upload, Link as LinkIcon, User, Lock, AlertTriangle } from "lucide-react";
import Image from "next/image";
import API from "../../utils/api";
import { countries } from "../../utils/countries";
import Navbar from "../../components/Navbar";

/* ─── Avatar preset options ─── */
const PRESET_AVATARS = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=b6e3f4",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka&backgroundColor=c0aede",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia&backgroundColor=ffd5dc",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Zara&backgroundColor=d1f0d1",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Kai&backgroundColor=ffdfbf",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Nova&backgroundColor=c9e8ff",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Leo&backgroundColor=fce4ec",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Orion&backgroundColor=e8f5e9",
];

type Tab = "profile" | "account" | "danger";

export default function SettingsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tab, setTab] = useState<Tab>("profile");
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /* ── Profile form ── */
  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarMode, setAvatarMode] = useState<"current" | "upload" | "url" | "preset">("current");
  const [urlInput, setUrlInput] = useState("");
  const [previewSrc, setPreviewSrc] = useState("");

  /* ── Bio + Social links ── */
  const [bio, setBio] = useState("");
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    github: "", instagram: "", facebook: "", twitter: "",
    youtube: "", twitch: "", discord: "", steam: "", roblox: "", epic: "",
  });

  /* ── Password form ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  /* ── Feedback ── */
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = (type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  /* ── Load user ── */
  useEffect(() => {
    API.get("/dashboard")
      .then((res) => {
        const u = res.data?.user || res.data;
        setUser(u);
        setUsername(u.username || "");
        setCountry(u.country || "");
        setAvatarUrl(u.avatar || "");
        setPreviewSrc(u.avatar || "");
        setBio(u.bio || "");
        if (u.socialLinks) setSocialLinks((prev) => ({ ...prev, ...u.socialLinks }));
      })
      .catch(() => router.replace("/"))
      .finally(() => setLoading(false));
  }, [router]);

  /* ── File upload → base64 ── */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast("error", "Image must be under 2 MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewSrc(result);
      setAvatarUrl(result);
      setAvatarMode("upload");
    };
    reader.readAsDataURL(file);
  };

  const handleUrlApply = () => {
    if (!urlInput.trim()) return;
    setPreviewSrc(urlInput.trim());
    setAvatarUrl(urlInput.trim());
    setAvatarMode("url");
  };

  const handlePresetSelect = (src: string) => {
    setPreviewSrc(src);
    setAvatarUrl(src);
    setAvatarMode("preset");
  };

  /* ── Save profile ── */
  const saveProfile = async () => {
    if (!username.trim()) return showToast("error", "Username cannot be empty");
    try {
      setSaving(true);
      const { data } = await API.put("/auth/profile", {
        username: username.trim(),
        country,
        avatar: avatarUrl,
        bio,
        socialLinks,
      });

      // Sync form fields from the returned user so UI matches DB immediately
      const u = data?.user ?? data;
      if (u) {
        setUser(u);
        setUsername(u.username ?? "");
        setCountry(u.country ?? "");
        setAvatarUrl(u.avatar ?? "");
        setPreviewSrc(u.avatar ?? "");
        setBio(u.bio ?? "");
        if (u.socialLinks) setSocialLinks((prev: Record<string, string>) => ({ ...prev, ...u.socialLinks }));
      }

      showToast("success", "Profile updated!");
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  /* ── Change password ── */
  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword)
      return showToast("error", "All password fields are required");
    if (newPassword !== confirmPassword)
      return showToast("error", "New passwords do not match");
    if (newPassword.length < 8)
      return showToast("error", "Password must be at least 8 characters");
    try {
      setSaving(true);
      await API.put("/auth/change-password", { currentPassword, newPassword });
      showToast("success", "Password changed!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete account ── */
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const deleteAccount = async () => {
    if (deleteConfirm !== user?.username) return;
    try {
      await API.delete("/auth/account");
      localStorage.removeItem("token");
      router.replace("/");
    } catch (err: any) {
      showToast("error", err.response?.data?.message || "Failed to delete account");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User className="w-4 h-4" /> },
    { id: "account", label: "Security", icon: <Lock className="w-4 h-4" /> },
    { id: "danger", label: "Danger Zone", icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#020617]">
      <Navbar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -20, x: "-50%" }}
            className={`fixed top-24 left-1/2 z-[100] px-5 py-3 rounded-xl text-sm font-semibold flex items-center gap-2.5 shadow-xl border ${
              toast.type === "success"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/15 border-red-500/30 text-red-400"
            }`}
          >
            {toast.type === "success" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">

        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-1">Settings</h1>
          <p className="text-white/40 text-sm">Manage your profile and account preferences</p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">

          {/* ── Sidebar tabs ── */}
          <div className="md:w-52 flex-shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 space-y-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    tab === t.id
                      ? t.id === "danger"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Main panel ── */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
              >

                {/* ══════════ PROFILE TAB ══════════ */}
                {tab === "profile" && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-8">

                    {/* ── Avatar section ── */}
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-1">Profile Picture</h2>
                      <p className="text-xs text-white/30 mb-5">Upload a photo, paste a URL, or pick a preset avatar</p>

                      {/* Current preview */}
                      <div className="flex items-start gap-6 mb-6">
                        <div className="relative flex-shrink-0">
                          {previewSrc ? (
                            <img
                              src={previewSrc}
                              alt="Avatar preview"
                              className="w-24 h-24 rounded-2xl object-cover border-2 border-white/10"
                              onError={() => setPreviewSrc("")}
                            />
                          ) : (
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 border-2 border-white/10 flex items-center justify-center text-3xl font-bold text-white">
                              {username?.[0]?.toUpperCase() || "?"}
                            </div>
                          )}
                          <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-cyan-500 border-2 border-[#020617] flex items-center justify-center">
                            <Camera className="w-3 h-3 text-white" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-sm font-medium transition-all"
                          >
                            <Upload className="w-4 h-4" />
                            Upload photo
                          </button>
                          <p className="text-xs text-white/20">JPG, PNG, GIF · Max 2 MB</p>
                          {previewSrc && previewSrc !== (user?.avatar || "") && (
                            <button
                              onClick={() => { setPreviewSrc(user?.avatar || ""); setAvatarUrl(user?.avatar || ""); setAvatarMode("current"); }}
                              className="text-xs text-white/30 hover:text-white/60 transition-colors text-left"
                            >
                              ↩ Reset to current
                            </button>
                          )}
                        </div>
                      </div>

                      {/* URL input */}
                      <div className="mb-5">
                        <label className="flex items-center gap-1.5 text-xs font-medium text-white/40 mb-2">
                          <LinkIcon className="w-3 h-3" /> Or paste an image URL
                        </label>
                        <div className="flex gap-2">
                          <input
                            className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 placeholder:text-white/20 transition-all"
                            placeholder="https://example.com/photo.jpg"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleUrlApply()}
                          />
                          <button
                            onClick={handleUrlApply}
                            className="px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 text-sm font-semibold rounded-xl transition-all"
                          >
                            Apply
                          </button>
                        </div>
                      </div>

                      {/* Preset avatars */}
                      <div>
                        <label className="block text-xs font-medium text-white/40 mb-3">Or choose a preset</label>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {PRESET_AVATARS.map((src, i) => (
                            <button
                              key={i}
                              onClick={() => handlePresetSelect(src)}
                              className={`relative w-full aspect-square rounded-xl overflow-hidden border-2 transition-all hover:scale-105 ${
                                previewSrc === src
                                  ? "border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
                                  : "border-white/10 hover:border-white/30"
                              }`}
                            >
                              <img src={src} alt={`Preset ${i + 1}`} className="w-full h-full object-cover bg-white/5" />
                              {previewSrc === src && (
                                <div className="absolute inset-0 bg-cyan-400/20 flex items-center justify-center">
                                  <Check className="w-4 h-4 text-cyan-400" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* ── Username + Country ── */}
                    <div className="space-y-5">
                      <h2 className="text-lg font-semibold text-white">Basic Info</h2>

                      <div>
                        <label className="block text-xs font-medium text-white/40 mb-2">Username</label>
                        <input
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 placeholder:text-white/20 transition-all"
                          placeholder="Your username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          maxLength={20}
                        />
                        <p className="text-xs text-white/20 mt-1.5">4–20 characters, letters/numbers/._</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/40 mb-2">Country</label>
                        <select
                          className="w-full px-4 py-3 bg-[#0a0f1c] border border-white/10 rounded-xl text-sm outline-none focus:border-cyan-500/50 transition-all appearance-none cursor-pointer"
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
                          style={{ color: country ? "white" : "rgba(255,255,255,0.3)" }}
                        >
                          <option value="" disabled>Select country</option>
                          {countries.map((c) => (
                            <option key={c.code} value={c.name} className="bg-[#0a0f1c] text-white">
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* ── Bio ── */}
                    <div className="space-y-5">
                      <h2 className="text-lg font-semibold text-white">Bio</h2>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-xs font-medium text-white/40">About you</label>
                          <span className={`text-xs ${bio.length > 180 ? "text-red-400" : "text-white/20"}`}>
                            {bio.length}/200
                          </span>
                        </div>
                        <textarea
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 placeholder:text-white/20 transition-all resize-none"
                          placeholder="Tell the world a bit about yourself…"
                          value={bio}
                          onChange={(e) => setBio(e.target.value.slice(0, 200))}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="h-px bg-white/5" />

                    {/* ── Social Links ── */}
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-lg font-semibold text-white mb-0.5">Social & Gaming Links</h2>
                        <p className="text-xs text-white/30">All optional — only filled ones appear on your profile.</p>
                      </div>

                      {/* Social platforms with brand icons */}
                      {([
                        {
                          key: "github", label: "GitHub", placeholder: "your-username", color: "text-white/70",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>,
                        },
                        {
                          key: "instagram", label: "Instagram", placeholder: "@handle", color: "text-pink-400",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>,
                        },
                        {
                          key: "facebook", label: "Facebook", placeholder: "your-username", color: "text-blue-400",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>,
                        },
                        {
                          key: "twitter", label: "X / Twitter", placeholder: "@handle", color: "text-sky-300",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>,
                        },
                        {
                          key: "youtube", label: "YouTube", placeholder: "@channel", color: "text-red-500",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
                        },
                        {
                          key: "twitch", label: "Twitch", placeholder: "your-channel", color: "text-purple-400",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>,
                        },
                        {
                          key: "discord", label: "Discord", placeholder: "username or ID", color: "text-indigo-400",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>,
                        },
                        {
                          key: "steam", label: "Steam", placeholder: "your-profile-id", color: "text-cyan-400",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/></svg>,
                        },
                        {
                          key: "roblox", label: "Roblox", placeholder: "YourUsername", color: "text-rose-400",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M4.597 0L0 19.183 19.403 24 24 4.817zM15.17 14.956l-5.59-1.498 1.498-5.59 5.59 1.498z"/></svg>,
                        },
                        {
                          key: "epic", label: "Epic Games", placeholder: "Your Epic ID", color: "text-yellow-400",
                          icon: <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor"><path d="M3 0v24h1.977V13.3H12v-2.2H4.977V2.2H15V0zm6.5 8.5V24H12v-7.7h7V24h2.477V8.5zm2.5 0V11h7V8.5z"/></svg>,
                        },
                      ] as const).map(({ key, label, placeholder, icon, color }) => (
                        <div key={key}>
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-white/50 mb-2">
                            <span className={color}>{icon}</span>
                            {label}
                          </label>
                          <div className="relative">
                            <span className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none ${color}`}>{icon}</span>
                            <input
                              className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 placeholder:text-white/20 transition-all"
                              placeholder={placeholder}
                              value={socialLinks[key] || ""}
                              onChange={(e) =>
                                setSocialLinks((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                            />
                          </div>
                        </div>
                      ))}

                    </div>{/* end social links */}

                    {/* Save button */}
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] disabled:opacity-60"
                      >
                        {saving ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ══════════ SECURITY TAB ══════════ */}
                {tab === "account" && (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-white mb-1">Change Password</h2>
                      <p className="text-xs text-white/30">
                        {user?.googleId
                          ? "Your account uses Google sign-in. You can set a password to also enable email login."
                          : "Update your account password below."}
                      </p>
                    </div>

                    {/* Current password — only for non-Google-only accounts */}
                    {!user?.googleId && (
                      <div>
                        <label className="block text-xs font-medium text-white/40 mb-2">Current Password</label>
                        <div className="relative">
                          <input
                            type={showCurrentPw ? "text" : "password"}
                            className="w-full px-4 py-3 pr-14 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 placeholder:text-white/20 transition-all"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                          />
                          <button type="button" onClick={() => setShowCurrentPw(p => !p)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white/80 font-semibold">
                            {showCurrentPw ? "HIDE" : "SHOW"}
                          </button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-white/40 mb-2">New Password</label>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          className="w-full px-4 py-3 pr-14 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 placeholder:text-white/20 transition-all"
                          placeholder="Min 8 characters"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button type="button" onClick={() => setShowNewPw(p => !p)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white/80 font-semibold">
                          {showNewPw ? "HIDE" : "SHOW"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-white/40 mb-2">Confirm New Password</label>
                      <div className="relative">
                        <input
                          type="password"
                          className="w-full px-4 py-3 pr-10 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-cyan-500/50 placeholder:text-white/20 transition-all"
                          placeholder="Re-enter new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {confirmPassword && (
                          <span className={`absolute right-4 top-1/2 -translate-y-1/2 text-base ${newPassword === confirmPassword ? "text-emerald-400" : "text-red-400"}`}>
                            {newPassword === confirmPassword ? "✓" : "✗"}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={changePassword}
                        disabled={saving}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-60"
                      >
                        {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                        {saving ? "Updating…" : "Update Password"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ══════════ DANGER ZONE TAB ══════════ */}
                {tab === "danger" && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 space-y-6">
                    <div>
                      <h2 className="text-lg font-semibold text-red-400 mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" /> Danger Zone
                      </h2>
                      <p className="text-xs text-white/30">These actions are irreversible. Please proceed with caution.</p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-4">
                      <div>
                        <p className="text-sm font-semibold text-white mb-1">Delete Account</p>
                        <p className="text-xs text-white/40">
                          Permanently deletes your account and all associated data — XP, streaks, quiz history, achievements. This cannot be undone.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-white/40 mb-2">
                          Type <span className="text-red-400 font-bold">{user?.username}</span> to confirm
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-white/5 border border-red-500/20 rounded-xl text-white text-sm outline-none focus:border-red-500/50 placeholder:text-white/20 transition-all"
                          placeholder="Enter your username"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                        />
                      </div>

                      <button
                        onClick={deleteAccount}
                        disabled={deleteConfirm !== user?.username}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 text-sm font-semibold rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Delete My Account
                      </button>
                    </div>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}