"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import API from "../utils/api";
import { countries } from "../utils/countries";

export default function Home() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register" | "forgot">("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Handle Google OAuth callback — token passed as query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const oauthError = params.get("error");

    if (token) {
      localStorage.setItem("token", token);
      router.replace("/dashboard");
    }

    if (oauthError) {
      setError(
        oauthError === "oauth_failed"
          ? "Google sign-in failed. Please try again."
          : "Authentication error. Please try again."
      );
      // Clean the URL
      window.history.replaceState({}, "", "/");
    }
  }, [router]);

  const validateForm = () => {
    if (mode === "forgot") {
      if (!email) return "Please enter your email address";
      return null;
    }
    if (!email || !password || (mode === "register" && (!username || !country))) {
      return "All fields are required";
    }
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setLoading(true);
      setError("");

      if (mode === "forgot") {
        await API.post("/auth/forgot-password", { email });
        setForgotSent(true);
        return;
      }

      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
      const payload =
        mode === "login"
          ? { email, password }
          : { username, email, password, country };

      const res = await API.post(endpoint, payload);
      localStorage.setItem("token", res.data.token);
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Redirect to backend Google OAuth entry point
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  const switchMode = (next: "login" | "register" | "forgot") => {
    setMode(next);
    setError("");
    setForgotSent(false);
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-[#020617]">

      {/* BACKGROUND BLOBS */}
      <div className="absolute w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full -top-40 -left-40 animate-blob mix-blend-screen pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full -bottom-40 -right-40 animate-blob mix-blend-screen pointer-events-none" style={{ animationDelay: "2s" }}></div>
      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob mix-blend-screen pointer-events-none" style={{ animationDelay: "4s" }}></div>

      {/* LEFT SIDE - Branding */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center px-10 text-white relative z-10">
        <div className="animate-fade-in-up w-full max-w-2xl flex flex-col items-center text-center">
          <Image
            src="/Cognivra.png"
            alt="Cognivra Adaptive Logo"
            width={1600}
            height={1600}
            className="drop-shadow-[0_0_100px_rgba(6,182,212,0.4)] transition-transform hover:scale-[1.02] duration-700 w-full h-auto object-contain"
            priority
          />
          <p className="mt-6 text-indigo-200/60 tracking-[0.2em] uppercase text-sm font-light">
            Next Generation Adaptive Learning
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Auth */}
      <div className="flex flex-1 items-center justify-center px-6 relative z-10 animate-slide-up" style={{ animationDelay: "0.2s" }}>
        <div className="w-full max-w-md glass-card p-10 relative overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl">

          {/* Top accent line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 opacity-80"></div>

          {/* ── FORGOT PASSWORD SUCCESS STATE ── */}
          {mode === "forgot" && forgotSent ? (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl">
                📬
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2">Check your inbox</h2>
                <p className="text-sm text-white/40 leading-relaxed">
                  We sent a password reset link to{" "}
                  <span className="text-cyan-400 font-semibold">{email}</span>.
                  Check your spam folder if you don&apos;t see it.
                </p>
              </div>
              <button
                onClick={() => switchMode("login")}
                className="w-full py-4 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-semibold"
              >
                ← Back to Sign In
              </button>
            </div>

          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {mode === "login" ? "Welcome Back" :
                    mode === "register" ? "Create Account" :
                      "Reset Password"}
                </h2>
                <p className="text-sm text-indigo-100/40">
                  {mode === "login" ? "Enter your credentials to continue" :
                    mode === "register" ? "Start your adaptive journey today" :
                      "We'll send you a link to reset your password"}
                </p>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm text-center mb-6 animate-fade-in">
                  {error}
                </div>
              )}

              <div className="space-y-5">

                {/* ── GOOGLE OAUTH BUTTON (login & register only) ── */}
                {mode !== "forgot" && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      disabled={googleLoading || loading}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60"
                    >
                      {googleLoading ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      {googleLoading
                        ? "Redirecting…"
                        : mode === "login"
                          ? "Continue with Google"
                          : "Sign up with Google"}
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-px bg-white/10"></div>
                      <span className="text-xs text-white/25 font-medium tracking-widest uppercase">or</span>
                      <div className="flex-1 h-px bg-white/10"></div>
                    </div>
                  </>
                )}

                {/* Register-only fields */}
                {mode === "register" && (
                  <div className="animate-fade-in space-y-5">
                    <input
                      className="w-full p-4 glass-input bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                    <select
                      className="w-full p-4 glass-input appearance-none bg-[#0a0f1c] cursor-pointer border border-white/10 rounded-xl outline-none focus:border-cyan-500/50 transition-all"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      style={{ color: country ? "white" : "rgba(255,255,255,0.4)" }}
                    >
                      <option value="" disabled>Select Country</option>
                      {countries.map((c) => (
                        <option key={c.code} value={c.name} className="text-white bg-[#0a0f1c]">
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Email — always shown */}
                <input
                  type="email"
                  className="w-full p-4 glass-input bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />

                {/* Password — login & register only */}
                {mode !== "forgot" && (
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full p-4 glass-input bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all pr-12"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 hover:text-white/80 transition-colors"
                    >
                      {showPassword ? "HIDE" : "SHOW"}
                    </button>
                  </div>
                )}

                {/* Forgot password link — login only */}
                {mode === "login" && (
                  <div className="flex justify-end -mt-2">
                    <button
                      type="button"
                      onClick={() => switchMode("forgot")}
                      className="text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] disabled:opacity-60"
                >
                  {loading
                    ? "Processing..."
                    : mode === "login"
                      ? "Sign In"
                      : mode === "register"
                        ? "Get Started"
                        : "Send Reset Link"}
                </button>

                {/* Footer link */}
                <div className="text-center text-sm text-white/40 mt-6 pt-6 border-t border-white/10">
                  {mode === "forgot" ? (
                    <>
                      Remember your password?{" "}
                      <button
                        onClick={() => switchMode("login")}
                        className="ml-1 text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                      >
                        Sign in instead
                      </button>
                    </>
                  ) : mode === "login" ? (
                    <>
                      Don&apos;t have an account?{" "}
                      <button
                        onClick={() => switchMode("register")}
                        className="ml-1 text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                      >
                        Register now
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button
                        onClick={() => switchMode("login")}
                        className="ml-1 text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                      >
                        Sign in instead
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}