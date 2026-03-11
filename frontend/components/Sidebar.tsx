"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Brain,
  Trophy,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Learning Lab", path: "/learning", icon: BookOpen },
  { name: "Adaptive Mode", path: "/adaptive", icon: Brain },
  { name: "Leaderboard", path: "/leaderboard", icon: Trophy },
];

interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const NavLink = ({ item }: { item: typeof NAV_ITEMS[0] }) => {
    const active = pathname === item.path;
    const Icon = item.icon;

    return (
      <Link
        href={item.path}
        onClick={() => setMobileOpen(false)}
        className={`
          relative flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all duration-200 group
          ${active
            ? "bg-brand-accent1/20 text-brand-accent1 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)] border border-brand-accent1/25"
            : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent"}
        `}
      >
        {active && (
          <motion.div
            layoutId="activeIndicator"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-accent1 rounded-r-full"
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
        )}
        <Icon className={`w-5 h-5 flex-shrink-0 transition-colors ${active ? "text-brand-accent1" : "text-white/40 group-hover:text-white/70"}`} />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden whitespace-nowrap text-sm"
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>
      </Link>
    );
  };

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`flex flex-col h-full ${isMobile ? "p-4" : "p-4"}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-2 mb-8 ${collapsed && !isMobile ? "justify-center" : ""}`}>
        <div className="w-9 h-9 flex-shrink-0 rounded-xl bg-gradient-to-br from-brand-accent1 to-brand-accent2 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.4)]">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {(!collapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.15 }}
            >
              <h1 className="text-base font-extrabold text-white leading-tight">Cognivra</h1>
              <p className="text-xs text-brand-accent1 font-medium -mt-0.5">Adaptive</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.path} item={item} />
        ))}
      </nav>

      {/* Bottom: Date + Logout */}
      <div className="space-y-2 pt-4 border-t border-white/5">
        {(!collapsed || isMobile) && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-white/30 text-center py-1 tracking-wide"
          >
            {new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </motion.p>
        )}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-white/40 hover:text-rose-400 hover:bg-rose-400/10 border border-transparent hover:border-rose-400/20 transition-all duration-200 group ${collapsed && !isMobile ? "justify-center" : ""}`}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {(!collapsed || isMobile) && <span className="text-sm font-medium">Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* ─────── MOBILE TOP BAR ─────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 glass-panel border-b border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-accent1 to-brand-accent2 flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.35)]">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white leading-tight">Cognivra</h1>
            <p className="text-[10px] text-brand-accent1 font-medium -mt-0.5">Adaptive</p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* ─────── MOBILE DRAWER ─────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 lg:hidden"
            />
            {/* drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              className="fixed top-0 left-0 h-screen w-72 z-50 lg:hidden bg-[#0d1227] border-r border-white/10 shadow-[4px_0_40px_rgba(0,0,0,0.5)]"
            >
              {/* close button */}
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarContent isMobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─────── DESKTOP SIDEBAR ─────── */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 240 }}
        transition={{ type: "spring", stiffness: 350, damping: 35 }}
        className="hidden lg:flex flex-col fixed top-0 left-0 h-screen z-40 bg-[#0d1227] border-r border-white/10 shadow-[4px_0_40px_rgba(0,0,0,0.3)] overflow-hidden"
      >
        <SidebarContent />

        {/* Collapse toggle */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute bottom-20 -right-3.5 w-7 h-7 rounded-full bg-[#0d1227] border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all shadow-lg"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </motion.aside>
    </>
  );
}