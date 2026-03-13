"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Settings } from "lucide-react";
import Image from "next/image";
import API from "../utils/api";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Learning Lab", path: "/learning" },
  { name: "Adaptive Mode", path: "/adaptive" },
  { name: "Leaderboard", path: "/leaderboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatar, setAvatar] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-profile-dropdown]")) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch user profile for avatar + username
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    API.get("/dashboard")
      .then((res) => {
        const user = res.data?.user || res.data;
        if (user?.avatar) setAvatar(user.avatar);
        if (user?.username) setUsername(user.username);
      })
      .catch(() => {});
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const AvatarCircle = ({ size = "md" }: { size?: "sm" | "md" }) => {
    const dim = size === "sm" ? "w-7 h-7 text-xs" : "w-9 h-9 text-sm";
    return avatar ? (
      <img
        src={avatar}
        alt={username || "Profile"}
        className={`${dim} rounded-full object-cover border-2 border-white/10 flex-shrink-0`}
      />
    ) : (
      <div
        className={`${dim} rounded-full bg-gradient-to-br from-cyan-500 to-indigo-600 border-2 border-white/10 flex items-center justify-center font-bold text-white flex-shrink-0`}
      >
        {username ? username[0].toUpperCase() : "?"}
      </div>
    );
  };

  return (
    <>
      {/* ═══ TOP BAR ═══ */}
      <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-4 sm:px-6 md:px-10 py-3 sm:py-4 glass-panel border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/Logo2.png" alt="Logo" width={40} height={40} className="w-full h-full object-cover" />
          </div>
          <h2 className="text-base sm:text-xl font-bold font-display tracking-tight text-white">
            Cognivra Adaptive
          </h2>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                pathname === item.path
                  ? "bg-white/10 text-brand-accent1 shadow-inner ring-1 ring-white/10"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-3">
          <p className="text-xs font-semibold text-brand-accent1 tracking-widest uppercase bg-brand-accent1/10 px-3 py-1.5 rounded-full border border-brand-accent1/20">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </p>

          {/* Profile dropdown */}
          <div className="relative" data-profile-dropdown>
            <button
              onClick={() => setProfileOpen((p) => !p)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
            >
              <AvatarCircle size="md" />
              {username && (
                <span className="text-sm text-white/70 group-hover:text-white transition-colors font-medium max-w-[100px] truncate">
                  {username}
                </span>
              )}
              <svg
                className={`w-3.5 h-3.5 text-white/30 transition-transform duration-200 ${profileOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  className="absolute right-0 mt-2 w-48 rounded-2xl bg-[#0d1227] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
                >
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
                    <AvatarCircle size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{username || "User"}</p>
                      <p className="text-xs text-white/30">My Account</p>
                    </div>
                  </div>

                  <div className="p-2 space-y-0.5">
                    <Link
                      href="/settings"
                      onClick={() => setProfileOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-400/10 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile: avatar + hamburger */}
        <div className="md:hidden flex items-center gap-2">
          <AvatarCircle size="sm" />
          <button
            onClick={() => setMobileOpen((p) => !p)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ═══ MOBILE DROPDOWN MENU ═══ */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Dropdown panel */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="fixed top-[57px] left-0 right-0 z-50 md:hidden mx-3 rounded-2xl bg-[#0d1227] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
            >
              {/* Mobile profile header */}
              <div className="px-4 py-3.5 border-b border-white/5 flex items-center gap-3">
                <AvatarCircle size="md" />
                <div>
                  <p className="text-sm font-semibold text-white">{username || "User"}</p>
                  <p className="text-xs text-white/30">My Account</p>
                </div>
              </div>

              <nav className="p-3 space-y-1">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
                      pathname === item.path
                        ? "bg-brand-accent1/15 text-brand-accent1 border border-brand-accent1/25"
                        : "text-white/60 hover:bg-white/5 hover:text-white border border-transparent"
                    }`}
                  >
                    <span>{item.name}</span>
                    {pathname === item.path && (
                      <motion.span
                        layoutId="mobileActiveTab"
                        className="ml-auto w-2 h-2 rounded-full bg-brand-accent1"
                      />
                    )}
                  </Link>
                ))}
              </nav>

              <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setMobileOpen(false)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-white/60 hover:bg-white/5 hover:text-white border border-transparent transition-all"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-400/10 hover:border-red-400/20 border border-transparent transition-all"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}