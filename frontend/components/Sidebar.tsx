"use client";

import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="w-64 bg-slate-900 h-screen p-6 space-y-6">
      <h1 className="text-2xl font-bold text-indigo-400">
        LearnFlow
      </h1>

      <nav className="space-y-3">
        <Link href="/dashboard" className="block hover:text-indigo-400">
          Dashboard
        </Link>
        <Link href="/adaptive" className="block hover:text-indigo-400">
          Adaptive Mode
        </Link>
      </nav>
    </div>
  );
}