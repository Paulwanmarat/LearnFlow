"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import API from "../../utils/api";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleReset = async () => {
        setError("");

        if (!password || !confirm) return setError("All fields are required");
        if (password.length < 8) return setError("Password must be at least 8 characters");
        if (password !== confirm) return setError("Passwords do not match");
        if (!token) return setError("Invalid or missing reset token");

        try {
            setLoading(true);
            const res = await API.post("/auth/reset-password", { token, password });
            localStorage.setItem("token", res.data.token);
            setSuccess(true);
            setTimeout(() => router.push("/dashboard"), 2500);
        } catch (err: any) {
            setError(err.response?.data?.message || "Reset failed. Link may have expired.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center bg-[#020617] px-6">

            {/* Background blobs */}
            <div className="absolute w-[500px] h-[500px] bg-indigo-600/20 blur-[120px] rounded-full -top-40 -left-40 pointer-events-none"></div>
            <div className="absolute w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full -bottom-40 -right-40 pointer-events-none"></div>

            <div className="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-xl rounded-2xl p-10 relative overflow-hidden">

                {/* Top accent */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-600 opacity-80"></div>

                {success ? (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-3xl">
                            ✅
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">Password Reset!</h2>
                            <p className="text-sm text-white/40">
                                Your password has been updated. Redirecting to dashboard...
                            </p>
                        </div>
                        <div className="w-full bg-black/20 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 animate-[width_2.5s_linear]" style={{ width: "100%" }}></div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">Set New Password</h2>
                            <p className="text-sm text-indigo-100/40">Choose a strong password for your account</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm text-center mb-6">
                                {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            {/* New Password */}
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all pr-12"
                                    placeholder="New Password"
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

                            {/* Confirm Password */}
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 transition-all"
                                    placeholder="Confirm New Password"
                                    value={confirm}
                                    onChange={(e) => setConfirm(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleReset()}
                                />
                            </div>

                            {/* Strength hint */}
                            {password.length > 0 && (
                                <p className={`text-xs font-medium ${password.length >= 12 ? "text-emerald-400" :
                                    password.length >= 8 ? "text-amber-400" : "text-rose-400"
                                    }`}>
                                    {password.length >= 12 ? "✓ Strong password" :
                                        password.length >= 8 ? "⚠ Acceptable — longer is stronger" :
                                            "✗ Too short — minimum 8 characters"}
                                </p>
                            )}

                            <button
                                onClick={handleReset}
                                disabled={loading}
                                className="w-full mt-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] disabled:opacity-60"
                            >
                                {loading ? "Resetting..." : "Reset Password"}
                            </button>

                            <div className="text-center text-sm text-white/30 pt-2">
                                Remember your password?{" "}
                                <button
                                    onClick={() => router.push("/")}
                                    className="text-cyan-400 font-semibold hover:text-cyan-300 transition-colors"
                                >
                                    Sign in
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}