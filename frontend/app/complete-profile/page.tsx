"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import API from "../../utils/api";
import { countries } from "../../utils/countries";

export default function CompleteProfile() {
  const router = useRouter();

  const [setupToken, setSetupToken] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  const [username, setUsername] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const setup = params.get("setup");

    if (!setup) {
      // No setup token — shouldn't be here
      router.replace("/");
      return;
    }

    setSetupToken(setup);

    // Decode the JWT payload (no verification needed client-side — just to pre-fill UI)
    try {
      const payload = JSON.parse(atob(setup.split(".")[1]));
      if (payload.email) setEmail(payload.email);
      if (payload.avatar) setAvatar(payload.avatar);
    } catch {
      // ignore decode errors — fields just stay empty
    }
  }, [router]);

  const passwordStrength = () => {
    if (!password) return null;
    if (password.length < 8) return { label: "Too short", color: "bg-red-500", width: "w-1/4" };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: "Fair", color: "bg-yellow-500", width: "w-2/4" };
    if (!/[^A-Za-z0-9]/.test(password)) return { label: "Good", color: "bg-blue-500", width: "w-3/4" };
    return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
  };

  const handleSubmit = async () => {
    setError("");

    if (!username || !country || !password || !confirmPassword) {
      setError("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/auth/google/complete", {
        setupToken,
        username,
        country,
        password,
        confirmPassword,
      });
      localStorage.setItem("token", res.data.token);
      router.replace("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-[#020617]">

      {/* BACKGROUND BLOBS */}
      <div className="absolute w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full -top-40 -left-40 animate-blob mix-blend-screen pointer-events-none" />
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full -bottom-40 -right-40 animate-blob mix-blend-screen pointer-events-none" style={{ animationDelay: "2s" }} />
      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob mix-blend-screen pointer-events-none" style={{ animationDelay: "4s" }} />

      {/* LEFT SIDE — Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center px-10 text-white relative z-10">
        <div className="w-full max-w-2xl flex flex-col items-center text-center">
          <Image
            src="/Cognivra.png"
            alt="Cognivra"
            width={1600}
            height={1600}
            className="drop-shadow-[0_0_100px_rgba(6,182,212,0.4)] w-full h-auto object-contain"
            priority
          />
          <p className="mt-6 text-indigo-200/60 tracking-[0.2em] uppercase text-sm font-light">
            Next Generation Adaptive Learning
          </p>
        </div>
      </div>

      {/* RIGHT SIDE — Form */}
      <div className="flex flex-1 items-center justify-center px-6 relative z-10">
        <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-10 relative overflow-hidden">

          {/* Top accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 opacity-80" />

          {/* Header */}
          <div className="text-center mb-8">
            {/* Google avatar */}
            {avatar ? (
              <img
                src={avatar}
                alt="Your Google avatar"
                className="w-16 h-16 rounded-full mx-auto mb-4 border-2 border-white/10 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-indigo-500/20 border-2 border-white/10 flex items-center justify-center text-2xl">
                👤
              </div>
            )}
            <h2 className="text-3xl font-bold text-white mb-1">Almost there!</h2>
            {email && (
              <p className="text-xs text-white/30 mb-1">
                Signed in as <span className="text-cyan-400">{email}</span>
              </p>
            )}
            <p className="text-sm text-indigo-100/40">
              Set up your Cognivra profile to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm text-center mb-6 animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-5">

            {/* Username */}
            <div>
              <input
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/30"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={20}
              />
              <p className="text-xs text-white/20 mt-1.5 pl-1">
                4–20 characters, letters / numbers / . _
              </p>
            </div>

            {/* Country */}
            <select
              className="w-full p-4 appearance-none bg-[#0a0f1c] cursor-pointer border border-white/10 rounded-xl outline-none focus:border-cyan-500/50 transition-all"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={{ color: country ? "white" : "rgba(255,255,255,0.3)" }}
            >
              <option value="" disabled>Select your country</option>
              {countries.map((c) => (
                <option key={c.code} value={c.name} className="text-white bg-[#0a0f1c]">
                  {c.name}
                </option>
              ))}
            </select>

            {/* Password */}
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all pr-14 placeholder:text-white/30"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white/80 transition-colors font-semibold"
                >
                  {showPassword ? "HIDE" : "SHOW"}
                </button>
              </div>

              {/* Strength bar */}
              {strength && (
                <div className="space-y-1">
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-300 ${strength.color} ${strength.width}`} />
                  </div>
                  <p className={`text-xs pl-1 ${
                    strength.label === "Strong" ? "text-emerald-400" :
                    strength.label === "Good" ? "text-blue-400" :
                    strength.label === "Fair" ? "text-yellow-400" : "text-red-400"
                  }`}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all pr-14 placeholder:text-white/30"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/40 hover:text-white/80 transition-colors font-semibold"
              >
                {showConfirm ? "HIDE" : "SHOW"}
              </button>
              {/* Match indicator */}
              {confirmPassword && (
                <span className={`absolute right-14 top-1/2 -translate-y-1/2 text-lg ${
                  password === confirmPassword ? "text-emerald-400" : "text-red-400"
                }`}>
                  {password === confirmPassword ? "✓" : "✗"}
                </span>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {loading ? "Creating your account…" : "Complete Sign Up"}
            </button>

            {/* Back link */}
            <div className="text-center pt-4 border-t border-white/10">
              <button
                onClick={() => router.replace("/")}
                className="text-sm text-white/30 hover:text-white/60 transition-colors"
              >
                ← Use a different account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}