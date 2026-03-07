"use client";

import { useState } from "react";
import Link from "next/link";

export default function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* MOBILE TOP BAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 z-50 flex items-center justify-between px-4 h-14 border-b border-white/10">
        <h1 className="text-lg font-bold text-indigo-400">
          LearnFlow
        </h1>

        <button
          onClick={() => setOpen(!open)}
          className="text-white text-2xl"
        >
          ☰
        </button>
      </div>

      {/* OVERLAY */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
        fixed top-0 left-0 h-screen w-64 bg-slate-900 p-6 space-y-6 z-50
        transform transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0
      `}
      >
        <h1 className="text-2xl font-bold text-indigo-400">
          LearnFlow
        </h1>

        <nav className="space-y-3">
          <Link
            href="/dashboard"
            className="block hover:text-indigo-400"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>

          <Link
            href="/adaptive"
            className="block hover:text-indigo-400"
            onClick={() => setOpen(false)}
          >
            Adaptive Mode
          </Link>
        </nav>
      </div>
    </>
  );
}