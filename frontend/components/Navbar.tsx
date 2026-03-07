"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-10 py-4 glass-panel border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-brand-accent1/20 border border-brand-accent1/50 flex items-center justify-center group-hover:bg-brand-accent1/40 transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-brand-accent1 to-brand-accent2 leading-none mt-0.5">CA</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white hidden sm:block">
            Cognivra Adaptive
          </h2>
        </Link>
        <nav className="hidden md:flex gap-2">
          {[
            { name: "Dashboard", path: "/dashboard" },
            { name: "Learning Lab", path: "/learning" },
            { name: "Adaptive Mode", path: "/adaptive" },
            { name: "Leaderboard", path: "/leaderboard" }
          ].map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${pathname === item.path
                ? "bg-white/10 text-brand-accent1 shadow-inner ring-1 ring-white/10"
                : "text-white/60 hover:bg-white/5 hover:text-white"
                }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-6">
        <p className="text-xs font-semibold text-brand-accent1 tracking-widest hidden lg:block uppercase bg-brand-accent1/10 px-3 py-1.5 rounded-full border border-brand-accent1/20">
          {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
        </p>
        <button
          onClick={logout}
          className="btn-secondary px-5 py-2 text-sm text-red-400 hover:text-red-300 hover:border-red-400/50 hover:bg-red-400/10"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}