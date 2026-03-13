"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Check, X, Upload, Link as LinkIcon, User, Globe, Lock, AlertTriangle } from "lucide-react";
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
      await API.put("/auth/profile", {
        username: username.trim(),
        country,
        avatar: avatarUrl,
      });
      showToast("success", "Profile updated!");
      // Refresh user data
      const res = await API.get("/dashboard");
      const u = res.data?.user || res.data;
      setUser(u);
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