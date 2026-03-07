"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import API from "../utils/api";
import { countries } from "../utils/countries";

export default function Home() {
  const router = useRouter();

  const [mode, setMode] = useState<"login" | "register">("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
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

      const endpoint = mode === "login" ? "/auth/login" : "/auth/register";

      const payload =
        mode === "login"
          ? { email, password }
          : { username, email, password, country };

      const res = await API.post(endpoint, payload);

      localStorage.setItem("token", res.data.token);

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden bg-[#020617]">
      
      {/* BACKGROUND BLOBS - Tuned to Cognivra Palette */}
      <div className="absolute w-[600px] h-[600px] bg-indigo-600/20 blur-[120px] rounded-full -top-40 -left-40 animate-blob mix-blend-screen pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] bg-cyan-500/10 blur-[120px] rounded-full -bottom-40 -right-40 animate-blob mix-blend-screen pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob mix-blend-screen pointer-events-none" style={{ animationDelay: '4s' }}></div>

      {/* LEFT SIDE - Branding Section */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center px-10 text-white relative z-10">
        <div className="animate-fade-in-up w-full max-w-2xl flex flex-col items-center text-center">
          <Image
            src="/cognivra-logo.png"
            alt="Cognivra Adaptive Logo"
            width={1600}
            height={1600}
            className="drop-shadow-[0_0_100px_rgba(6,182,212,0.4)] transition-transform hover:scale-[1.02] duration-700 w-full h-auto object-contain"
            priority
          />
          <p className="mt-6 text-indigo-200/60 tracking-[0.2em] uppercase text-sm font-light">
            Next-Generation Adaptive Learning
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Auth Section */}
      <div className="flex flex-1 items-center justify-center px-6 relative z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="w-full max-w-md glass-card p-10 relative overflow-hidden bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl">

          {/* Top accent line matching the logo gradient */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 opacity-80"></div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-indigo-100/40">
              {mode === "login" ? "Enter your credentials to continue" : "Start your adaptive journey today"}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm text-center mb-6 animate-fade-in">
              {error}
            </div>
          )}

          <div className="space-y-5">
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
                  style={{ color: country ? 'white' : 'rgba(255,255,255,0.4)' }}
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

            <input
              type="email"
              className="w-full p-4 glass-input bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-4 glass-input bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all pr-12"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-white/40 hover:text-white/80 transition-colors"
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98]"
            >
              {loading ? "Processing..." : mode === "login" ? "Sign In" : "Get Started"}
            </button>

            <div className="text-center text-sm text-white/40 mt-6 pt-6 border-t border-white/10">
              {mode === "login" ? "Don't have an account?" : "Already have an account?"}
              <button
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError("");
                }}
                className="ml-2 text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
              >
                {mode === "login" ? "Register now" : "Sign in instead"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}