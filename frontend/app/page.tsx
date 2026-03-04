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

      const endpoint =
        mode === "login" ? "/auth/login" : "/auth/register";

      const payload =
        mode === "login"
          ? { email, password }
          : { username, email, password, country };

      const res = await API.post(endpoint, payload);

      localStorage.setItem("token", res.data.token);

      setTimeout(() => {
        router.push("/dashboard");
      }, 500);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden">

      {/* BACKGROUND BLOBS */}
      <div className="absolute w-[600px] h-[600px] bg-brand-accent1/20 blur-[120px] rounded-full -top-40 -left-40 animate-blob mix-blend-screen pointer-events-none"></div>
      <div className="absolute w-[600px] h-[600px] bg-brand-accent2/20 blur-[120px] rounded-full -bottom-40 -right-40 animate-blob mix-blend-screen pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute w-[500px] h-[500px] bg-brand-accent3/20 blur-[120px] rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-blob mix-blend-screen pointer-events-none" style={{ animationDelay: '4s' }}></div>

      {/* LEFT SIDE */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center items-center px-10 text-white relative z-10">

        <div className="animate-fade-in-up w-full max-w-2xl flex justify-center text-center">
          <Image
            src="/LearnFlow.png"
            alt="LearnFlow Logo"
            width={850}
            height={850}
            className="drop-shadow-[0_0_120px_rgba(99,102,241,0.8)] transition-transform hover:scale-[1.03] duration-700 w-full h-auto object-contain"
            priority
          />
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="flex flex-1 items-center justify-center px-6 relative z-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="w-full max-w-md glass-card p-10 relative overflow-hidden">

          {/* Card inner glow */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-accent1 to-brand-accent2 opacity-80"></div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-white/50">
              {mode === "login" ? "Enter your credentials to continue" : "Start your learning journey today"}
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
                  className="w-full p-4 glass-input"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />

                {/* COUNTRY DROPDOWN */}
                <select
                  className="w-full p-4 glass-input appearance-none bg-[#0a0f1c] hover:bg-[#111827] cursor-pointer"
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
              className="w-full p-4 glass-input"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-4 glass-input pr-12"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-[18px] text-sm text-white/40 hover:text-white/80 transition-colors"
                title={showPassword ? "Hide" : "Show"}
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full mt-2 btn-primary p-4 text-lg"
            >
              {loading
                ? "Processing..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>

            <div className="text-center text-sm text-white/50 mt-6 pt-6 border-t border-white/10">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}

              <button
                onClick={() => {
                  setMode(mode === "login" ? "register" : "login");
                  setError(""); // clear errors on toggle
                }}
                className="ml-2 text-brand-accent1 font-semibold hover:text-brand-accent2 transition-colors"
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