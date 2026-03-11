"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Learning Lab", path: "/learning" },
  { name: "Adaptive Mode", path: "/adaptive" },
  { name: "Leaderboard", path: "/leaderboard" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
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
        <div className="hidden md:flex items-center gap-4">
          <p className="text-xs font-semibold text-brand-accent1 tracking-widest uppercase bg-brand-accent1/10 px-3 py-1.5 rounded-full border border-brand-accent1/20">
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <button
            onClick={logout}
            className="btn-secondary px-5 py-2 text-sm text-red-400 hover:text-red-300 hover:border-red-400/50 hover:bg-red-400/10"
          >
            Sign Out
          </button>
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={() => setMobileOpen((p) => !p)}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
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

              <div className="px-3 pb-3 pt-1 border-t border-white/5">
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